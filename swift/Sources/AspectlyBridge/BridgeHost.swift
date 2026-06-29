import Foundation

/// `BridgeHost` manages bidirectional communication between native Swift code
/// and JavaScript via the Aspectly protocol. It handles message passing in both
/// directions and provides type-safe handler registration.
///
/// This is the native (host) side of the bridge — the Swift equivalent of the
/// .NET `BridgeHost` and the parent side of the web hooks. The embedded web
/// content uses `@aspectly/core`'s `AspectlyBridge`.
public final class BridgeHost {
    /// Default request/handler timeout (100 seconds), matching `@aspectly/core`.
    public static let defaultTimeoutMs = 100_000

    private let browserBridge: BrowserBridge
    private let logger: BridgeLogger
    private let timeoutMs: Int

    private let lock = BridgeLock()

    private var initialized = false
    private var remoteInitReceived = false
    private var initResultReceived = false
    private var disposed = false
    private var requestIdCounter = 0
    private var initContinuation: CheckedContinuation<Void, Error>?

    private var supportedMethodsStorage: [String] = []
    private var handlers: [String: RawBridgeHandler] = [:]
    private var pendingRequests: [String: CheckedContinuation<JSONValue, Error>] = [:]

    /// Whether the bridge has completed the handshake (both `Init` and
    /// `InitResult` exchanged).
    public var isInitialized: Bool {
        lock.lock(); defer { lock.unlock() }
        return initialized
    }

    /// The methods supported by the JavaScript side.
    public var supportedMethods: [String] {
        lock.lock(); defer { lock.unlock() }
        return supportedMethodsStorage
    }

    /// The locally registered handler method names.
    public var registeredMethods: [String] {
        lock.lock(); defer { lock.unlock() }
        return Array(handlers.keys)
    }

    /// Invoked when the bridge becomes initialized (handshake complete).
    public var onInitialized: (() -> Void)?

    /// Create a new `BridgeHost`.
    /// - Parameters:
    ///   - browserBridge: The browser bridge implementation.
    ///   - logger: Optional logger (defaults to a no-op logger).
    ///   - timeoutMs: Handler execution timeout in milliseconds (default 100000).
    public init(
        browserBridge: BrowserBridge,
        logger: BridgeLogger = NullLogger.shared,
        timeoutMs: Int = BridgeHost.defaultTimeoutMs
    ) {
        self.browserBridge = browserBridge
        self.logger = logger
        self.timeoutMs = timeoutMs

        browserBridge.onMessage = { [weak self] message in
            Task { await self?.processMessage(message) }
        }
        logger.info("[BridgeHost] Created and subscribed to messages")
    }

    // MARK: - Incoming messages

    /// Process a message received from JavaScript.
    /// - Parameter messageJson: JSON string containing a bridge event wrapper.
    public func processMessage(_ messageJson: String) async {
        if messageJson.isEmpty { return }

        logger.debug("[BridgeHost] Received: \(messageJson)")

        let wrapper: JSONValue
        do {
            wrapper = try JSONValue(jsonString: messageJson)
        } catch {
            logger.error("[BridgeHost] JSON parse error", error)
            return
        }

        guard wrapper["type"]?.stringValue == "BridgeEvent" else {
            logger.debug("[BridgeHost] Ignoring non-BridgeEvent message")
            return
        }

        guard let event = wrapper["event"],
              let eventTypeRaw = event["type"]?.stringValue,
              let eventType = BridgeEventType(rawValue: eventTypeRaw) else {
            return
        }

        let data = event["data"] ?? .null
        await handleEvent(type: eventType, data: data)
    }

    private func handleEvent(type: BridgeEventType, data: JSONValue) async {
        switch type {
        case .`init`:
            await handleInit(data)
        case .request:
            await handleRequest(data)
        case .result:
            handleResult(data)
        case .initResult:
            logger.info("[BridgeHost] InitResult received from JS")
            tryResolveInit(markInitResult: true)
        }
    }

    private func handleInit(_ data: JSONValue) async {
        if let methods = data["methods"]?.stringArray {
            lock.lock()
            supportedMethodsStorage = methods
            lock.unlock()
            logger.info("[BridgeHost] JS supports methods: \(methods.joined(separator: ", "))")
        }

        // Match JS protocol: only send InitResult, not our Init.
        // Our Init is sent explicitly via initialize().
        await sendEvent(.initResult, .bool(true))
        logger.info("[BridgeHost] Sent InitResult")
        tryResolveInit(markRemoteInit: true)
    }

    /// Resolve the init handshake. The handshake flags are mutated and read
    /// inside the single lock so that two messages processed concurrently
    /// (each `processMessage` runs in its own Task) cannot race on them.
    private func tryResolveInit(markInitResult: Bool = false, markRemoteInit: Bool = false) {
        lock.lock()
        if markInitResult { initResultReceived = true }
        if markRemoteInit { remoteInitReceived = true }
        let shouldResolve = initResultReceived && remoteInitReceived && !initialized
        if shouldResolve {
            initialized = true
        }
        let continuation = shouldResolve ? initContinuation : nil
        if shouldResolve {
            initContinuation = nil
        }
        lock.unlock()

        if shouldResolve {
            continuation?.resume()
            logger.info("[BridgeHost] Bridge fully initialized (both Init and InitResult received)")
            onInitialized?()
        }
    }

    private func handleRequest(_ data: JSONValue) async {
        guard let method = data["method"]?.stringValue,
              let requestId = data["request_id"]?.stringValue else {
            return
        }
        let params = data["params"] ?? .object([:])

        lock.lock()
        let handler = handlers[method]
        lock.unlock()

        let result: JSONValue
        if let handler = handler {
            do {
                let handlerResult = try await runWithTimeout(timeoutMs) {
                    try await handler(params)
                }
                let dataValue: JSONValue
                if let handlerResult = handlerResult {
                    dataValue = try JSONValue(encoding: handlerResult)
                } else {
                    dataValue = .null
                }
                result = .object([
                    "type": .string(BridgeResultType.success.rawValue),
                    "method": .string(method),
                    "request_id": .string(requestId),
                    "data": dataValue,
                ])
                logger.debug("[BridgeHost] Handler '\(method)' completed successfully")
            } catch is TimeoutSignal {
                logger.error("[BridgeHost] Handler '\(method)' timed out after \(timeoutMs)ms")
                result = errorResult(
                    method: method,
                    requestId: requestId,
                    errorType: .methodExecutionTimeout,
                    message: "Execution timeout exceeded"
                )
            } catch {
                logger.error("[BridgeHost] Handler '\(method)' failed", error)
                result = errorResult(
                    method: method,
                    requestId: requestId,
                    errorType: .rejected,
                    message: describe(error)
                )
            }
        } else {
            logger.warn("[BridgeHost] Unknown method: \(method)")
            result = errorResult(
                method: method,
                requestId: requestId,
                errorType: .unsupportedMethod,
                message: "Method '\(method)' is not registered"
            )
        }

        await sendEvent(.result, result)
    }

    private func handleResult(_ data: JSONValue) {
        guard let requestId = data["request_id"]?.stringValue else { return }

        lock.lock()
        let continuation = pendingRequests.removeValue(forKey: requestId)
        lock.unlock()

        guard let continuation = continuation else { return }

        let typeRaw = data["type"]?.stringValue
        if typeRaw == BridgeResultType.success.rawValue {
            continuation.resume(returning: data["data"] ?? .null)
        } else if let errorData = data["error"] {
            let errorType = errorData["error_type"]?.stringValue
                .flatMap(BridgeErrorType.init(rawValue:)) ?? .rejected
            let message = errorData["error_message"]?.stringValue
            continuation.resume(throwing: BridgeError(errorType, message))
        } else {
            continuation.resume(throwing: BridgeError(.rejected, "Unknown result"))
        }
    }

    // MARK: - Outgoing messages

    /// Send a raw event to JavaScript via `window.postMessage`.
    public func sendEvent(_ type: BridgeEventType, _ data: JSONValue) async {
        let innerEvent: JSONValue = .object([
            "type": .string(type.rawValue),
            "data": data,
        ])
        let wrapper: JSONValue = .object([
            "type": .string("BridgeEvent"),
            "event": innerEvent,
        ])

        do {
            let json = try wrapper.jsonString()
            let jsLiteral = Self.jsStringLiteral(json)
            // Wrap in an IIFE returning a supported value so WKWebView does not
            // raise a "result of an unsupported type" error for `undefined`.
            let script = "(function(){window.postMessage(\(jsLiteral), '*');return true;})();"
            try await browserBridge.executeScript(script)
            logger.debug("[BridgeHost] Sent: \(json)")
        } catch {
            logger.error("[BridgeHost] Failed to send event", error)
        }
    }

    /// Send a request to the JavaScript side and await the response.
    /// - Parameters:
    ///   - method: The JS method to invoke.
    ///   - params: Optional parameters (any `Encodable`).
    ///   - timeoutMs: Request timeout in milliseconds.
    /// - Returns: The decoded result.
    public func send<T: Decodable>(
        _ method: String,
        params: Encodable? = nil,
        timeoutMs: Int = BridgeHost.defaultTimeoutMs
    ) async throws -> T {
        guard isInitialized else {
            throw BridgeError(.bridgeNotAvailable, "Bridge not initialized")
        }

        lock.lock()
        let supported = supportedMethodsStorage.contains(method)
        lock.unlock()
        guard supported else {
            throw BridgeError(.unsupportedMethod, "Method '\(method)' not supported by JS side")
        }

        let requestId = nextRequestId()
        let paramsValue: JSONValue = try params.map { try JSONValue(encoding: $0) } ?? .object([:])
        let requestData: JSONValue = .object([
            "method": .string(method),
            "request_id": .string(requestId),
            "params": paramsValue,
        ])

        let resultValue: JSONValue = try await withCheckedThrowingContinuation { continuation in
            lock.lock()
            pendingRequests[requestId] = continuation
            lock.unlock()

            // Send the request.
            Task {
                await self.sendEvent(.request, requestData)
                self.logger.debug("[BridgeHost] Sent request: \(method) (id=\(requestId))")
            }

            // Arm the timeout.
            Task {
                try? await Task.sleep(nanoseconds: UInt64(timeoutMs) * 1_000_000)
                self.lock.lock()
                let timedOut = self.pendingRequests.removeValue(forKey: requestId)
                self.lock.unlock()
                timedOut?.resume(throwing: BridgeError(
                    .methodExecutionTimeout,
                    "Request '\(method)' timed out after \(timeoutMs)ms"
                ))
            }
        }

        return try resultValue.decode(T.self)
    }

    // MARK: - Handler registration

    /// Register a raw handler for a method.
    public func registerHandler(_ method: String, _ handler: @escaping RawBridgeHandler) {
        lock.lock()
        handlers[method] = handler
        lock.unlock()
        logger.info("[BridgeHost] Registered handler: \(method)")
    }

    /// Register a typed handler that takes decoded params and returns an
    /// `Encodable` result.
    public func registerHandler<P: Decodable, R: Encodable>(
        _ method: String,
        _ handler: @escaping (P) async throws -> R
    ) {
        registerHandler(method) { paramsJson in
            let params = try paramsJson.decode(P.self)
            return try await handler(params)
        }
    }

    /// Register a typed handler that takes no params and returns an `Encodable`
    /// result.
    public func registerHandler<R: Encodable>(
        _ method: String,
        _ handler: @escaping () async throws -> R
    ) {
        registerHandler(method) { _ in
            try await handler()
        }
    }

    /// Register a handler implementing `BridgeHandler`.
    public func registerHandler<H: BridgeHandler>(_ handler: H) {
        registerHandler(handler.methodName) { (params: H.Params) in
            try await handler.handle(params)
        }
    }

    /// Remove a previously registered handler.
    public func unregisterHandler(_ method: String) {
        lock.lock()
        handlers.removeValue(forKey: method)
        lock.unlock()
        logger.info("[BridgeHost] Unregistered handler: \(method)")
    }

    // MARK: - Initialization

    /// Register handlers and send `Init` to JavaScript, then wait for
    /// `InitResult`. Mirrors the JS `bridge.init(handlers)` pattern.
    public func initialize(handlers: [String: RawBridgeHandler]) async throws {
        for (method, handler) in handlers {
            registerHandler(method, handler)
        }
        try await initialize()
    }

    /// Send the `Init` event to JavaScript with the registered methods and wait
    /// for the handshake to complete. Mirrors the JS `bridge.init()` protocol:
    /// send `Init`, await `InitResult`.
    public func initialize() async throws {
        let methods = registeredMethods

        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            lock.lock()
            initContinuation = continuation
            lock.unlock()

            Task {
                await self.sendEvent(.`init`, .object(["methods": .array(methods.map { .string($0) })]))
                self.logger.info("[BridgeHost] Sent Init with methods: \(methods.joined(separator: ", "))")
            }
        }
        logger.info("[BridgeHost] InitResult received, initialization complete")
    }

    // MARK: - Cleanup

    /// Detach from the browser bridge and cancel any pending work.
    public func dispose() {
        lock.lock()
        if disposed {
            lock.unlock()
            return
        }
        disposed = true
        let pending = pendingRequests
        pendingRequests.removeAll()
        let initCont = initContinuation
        initContinuation = nil
        lock.unlock()

        browserBridge.onMessage = nil
        browserBridge.dispose()

        initCont?.resume(throwing: CancellationError())
        for (_, continuation) in pending {
            continuation.resume(throwing: CancellationError())
        }

        logger.info("[BridgeHost] Disposed")
    }

    deinit {
        dispose()
    }

    // MARK: - Helpers

    private func nextRequestId() -> String {
        lock.lock(); defer { lock.unlock() }
        requestIdCounter += 1
        return String(requestIdCounter)
    }

    private func errorResult(
        method: String,
        requestId: String,
        errorType: BridgeErrorType,
        message: String
    ) -> JSONValue {
        .object([
            "type": .string(BridgeResultType.error.rawValue),
            "method": .string(method),
            "request_id": .string(requestId),
            "error": .object([
                "error_type": .string(errorType.rawValue),
                "error_message": .string(message),
            ]),
        ])
    }

    private func describe(_ error: Error) -> String {
        if let bridgeError = error as? BridgeError { return bridgeError.message }
        if let localized = error as? LocalizedError, let description = localized.errorDescription {
            return description
        }
        return String(describing: error)
    }

    private struct TimeoutSignal: Error {}

    /// Race an async operation against a timeout. Returns the operation's value,
    /// or throws `TimeoutSignal` if the timeout elapses first.
    private func runWithTimeout(
        _ ms: Int,
        _ operation: @escaping () async throws -> Encodable?
    ) async throws -> Encodable? {
        try await withThrowingTaskGroup(of: Encodable?.self) { group in
            group.addTask {
                try await operation()
            }
            group.addTask {
                try await Task.sleep(nanoseconds: UInt64(ms) * 1_000_000)
                throw TimeoutSignal()
            }
            defer { group.cancelAll() }
            let result = try await group.next()!
            return result
        }
    }

    /// Encode a string as a JavaScript string literal (escaped, quoted), matching
    /// the .NET double-serialization approach.
    static func jsStringLiteral(_ string: String) -> String {
        if let data = try? JSONEncoder().encode(string),
           let literal = String(data: data, encoding: .utf8) {
            return literal
        }
        return "\"\""
    }
}
