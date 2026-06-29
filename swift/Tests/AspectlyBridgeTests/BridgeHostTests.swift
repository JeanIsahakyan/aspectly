import XCTest
@testable import AspectlyBridge

final class BridgeHostTests: XCTestCase {
    private var mock: MockBrowserBridge!
    private var bridge: BridgeHost!

    override func setUp() {
        super.setUp()
        mock = MockBrowserBridge()
        bridge = BridgeHost(browserBridge: mock)
    }

    override func tearDown() {
        bridge.dispose()
        bridge = nil
        mock = nil
        super.tearDown()
    }

    // MARK: - Handler registration

    func testRegisterHandlerAddsHandler() {
        bridge.registerHandler("test") { _ in "result" }
        XCTAssertTrue(bridge.registeredMethods.contains("test"))
    }

    func testUnregisterHandlerRemovesHandler() {
        bridge.registerHandler("test") { _ in "result" }
        bridge.unregisterHandler("test")
        XCTAssertFalse(bridge.registeredMethods.contains("test"))
    }

    func testRegisterHandlerWithSameNameOverwrites() async {
        bridge.registerHandler("test") { _ in "first" }
        bridge.registerHandler("test") { _ in "second" }

        let request = BridgeTestSupport.message(.request, data: .object([
            "method": .string("test"),
            "request_id": .string("1"),
            "params": .object([:]),
        ]))
        await bridge.processMessage(request)

        let script = mock.scripts().last
        XCTAssertNotNil(script)
        XCTAssertTrue(script!.contains("second"))
    }

    // MARK: - Init handshake

    func testProcessMessageWithInitUpdatesSupportedMethods() async {
        let initMessage = BridgeTestSupport.message(.`init`, data: .object([
            "methods": .array([.string("jsMethod1"), .string("jsMethod2")]),
        ]))
        await bridge.processMessage(initMessage)

        XCTAssertTrue(bridge.supportedMethods.contains("jsMethod1"))
        XCTAssertTrue(bridge.supportedMethods.contains("jsMethod2"))
    }

    func testHandleInitOnlySendsInitResultNotOurInit() async {
        bridge.registerHandler("myMethod") { _ in "result" }

        let initMessage = BridgeTestSupport.message(.`init`, data: .object([
            "methods": .array([.string("jsMethod")]),
        ]))
        await bridge.processMessage(initMessage)

        let scripts = mock.scripts()
        XCTAssertEqual(scripts.count, 1)
        XCTAssertTrue(scripts[0].contains("InitResult"))
        // The escaped inner JSON would contain \"type\":\"Init\" if we sent Init.
        XCTAssertFalse(scripts[0].contains("type\\\":\\\"Init\\\""))
    }

    func testInitializesOnlyWhenBothInitAndInitResultReceived() async {
        var eventFired = false
        bridge.onInitialized = { eventFired = true }

        // Only InitResult — should NOT be initialized yet.
        await bridge.processMessage(BridgeTestSupport.message(.initResult, data: .bool(true)))
        XCTAssertFalse(bridge.isInitialized)
        XCTAssertFalse(eventFired)

        // Now Init arrives — should be initialized.
        await bridge.processMessage(BridgeTestSupport.message(.`init`, data: .object([
            "methods": .array([.string("jsMethod")]),
        ])))
        XCTAssertTrue(bridge.isInitialized)
        XCTAssertTrue(eventFired)
    }

    func testInitializeWaitsForBothInitAndInitResult() async throws {
        let initTask = Task { try await bridge.initialize() }

        // Wait until our Init is sent.
        await BridgeTestSupport.wait { !self.mock.scripts().isEmpty }

        // JS Init (remote methods).
        await bridge.processMessage(BridgeTestSupport.message(.`init`, data: .object([
            "methods": .array([.string("jsMethod")]),
        ])))

        // JS InitResult.
        await bridge.processMessage(BridgeTestSupport.message(.initResult, data: .bool(true)))

        try await initTask.value
        XCTAssertTrue(bridge.isInitialized)
        XCTAssertTrue(bridge.supportedMethods.contains("jsMethod"))
    }

    func testInitializeWithHandlersRegistersAndInits() async throws {
        let handlers: [String: RawBridgeHandler] = [
            "method1": { _ in "result1" },
            "method2": { _ in "result2" },
        ]
        let initTask = Task { try await bridge.initialize(handlers: handlers) }

        await BridgeTestSupport.wait { self.bridge.registeredMethods.count >= 2 }
        XCTAssertTrue(bridge.registeredMethods.contains("method1"))
        XCTAssertTrue(bridge.registeredMethods.contains("method2"))

        await bridge.processMessage(BridgeTestSupport.message(.`init`, data: .object([
            "methods": .array([.string("jsMethod")]),
        ])))
        await bridge.processMessage(BridgeTestSupport.message(.initResult, data: .bool(true)))

        try await initTask.value
        XCTAssertTrue(bridge.isInitialized)
    }

    func testConcurrentHandshakeAlwaysResolves() async throws {
        // Regression test: Init and InitResult delivered concurrently must still
        // resolve initialize() (the handshake flags are mutated under the lock).
        for _ in 0..<200 {
            let mock = MockBrowserBridge()
            let bridge = BridgeHost(browserBridge: mock)
            let initTask = Task { try await bridge.initialize() }
            await BridgeTestSupport.wait { !mock.scripts().isEmpty }

            let initMessage = BridgeTestSupport.message(.`init`, data: .object([
                "methods": .array([.string("m")]),
            ]))
            let initResultMessage = BridgeTestSupport.message(.initResult, data: .bool(true))

            async let a: Void = bridge.processMessage(initMessage)
            async let b: Void = bridge.processMessage(initResultMessage)
            _ = await (a, b)

            try await initTask.value
            XCTAssertTrue(bridge.isInitialized)
            bridge.dispose()
        }
    }

    // MARK: - Incoming requests

    func testProcessMessageWithRequestCallsHandler() async {
        var handlerCalled = false
        bridge.registerHandler("testMethod") { (_: JSONValue) -> [String: Bool] in
            handlerCalled = true
            return ["success": true]
        }

        let request = BridgeTestSupport.message(.request, data: .object([
            "method": .string("testMethod"),
            "request_id": .string("1"),
            "params": .object([:]),
        ]))
        await bridge.processMessage(request)

        XCTAssertTrue(handlerCalled)
    }

    func testProcessMessageWithUnknownMethodSendsError() async {
        let request = BridgeTestSupport.message(.request, data: .object([
            "method": .string("unknownMethod"),
            "request_id": .string("1"),
            "params": .object([:]),
        ]))
        await bridge.processMessage(request)

        let script = mock.scripts().last
        XCTAssertNotNil(script)
        XCTAssertTrue(script!.contains("UNSUPPORTED_METHOD"))
    }

    func testRequestHandlerReturnsDataSendsSuccessResult() async {
        struct Result: Encodable { let value: Int }
        bridge.registerHandler("testMethod") { _ in Result(value: 42) }

        let request = BridgeTestSupport.message(.request, data: .object([
            "method": .string("testMethod"),
            "request_id": .string("test-123"),
            "params": .object([:]),
        ]))
        await bridge.processMessage(request)

        let script = mock.scripts().last
        XCTAssertNotNil(script)
        XCTAssertTrue(script!.contains("Success"))
        XCTAssertTrue(script!.contains("42"))
    }

    func testRequestHandlerThrowsSendsRejectedError() async {
        struct HandlerError: Error, LocalizedError {
            var errorDescription: String? { "test error" }
        }
        bridge.registerHandler("testMethod") { (_: JSONValue) -> String in
            throw HandlerError()
        }

        let request = BridgeTestSupport.message(.request, data: .object([
            "method": .string("testMethod"),
            "request_id": .string("test-123"),
            "params": .object([:]),
        ]))
        await bridge.processMessage(request)

        let script = mock.scripts().last
        XCTAssertNotNil(script)
        XCTAssertTrue(script!.contains("REJECTED"))
        XCTAssertTrue(script!.contains("test error"))
    }

    func testHandleRequestTimesOutSlowHandler() async {
        let shortBridge = BridgeHost(browserBridge: mock, timeoutMs: 100)
        shortBridge.registerHandler("slowMethod") { (_: JSONValue) -> [String: String] in
            try? await Task.sleep(nanoseconds: 5_000_000_000)
            return ["value": "late"]
        }

        let request = BridgeTestSupport.message(.request, data: .object([
            "method": .string("slowMethod"),
            "request_id": .string("1"),
            "params": .object([:]),
        ]))
        await shortBridge.processMessage(request)

        let script = mock.scripts().last
        XCTAssertNotNil(script)
        XCTAssertTrue(script!.contains("METHOD_EXECUTION_TIMEOUT"))
        shortBridge.dispose()
    }

    func testTypedHandlerDecodesParams() async {
        struct AddParams: Decodable { let a: Int; let b: Int }
        bridge.registerHandler("add") { (params: AddParams) -> Int in
            params.a + params.b
        }

        let request = BridgeTestSupport.message(.request, data: .object([
            "method": .string("add"),
            "request_id": .string("1"),
            "params": .object(["a": .int(10), "b": .int(20)]),
        ]))
        await bridge.processMessage(request)

        let wrapper = BridgeTestSupport.parseSentScript(mock.scripts().last ?? "")
        let data = wrapper?["event"]?["data"]?["data"]
        XCTAssertEqual(data?.intValue, 30)
    }

    // MARK: - Sending requests

    func testSendWithSuccessResultResolvesPendingRequest() async throws {
        try await initializeBridge(jsMethods: ["jsMethod"])

        let sendTask = Task { try await bridge.send("jsMethod") as String }

        // Wait for the request to be registered/sent.
        await BridgeTestSupport.wait {
            self.mock.scripts().contains { $0.contains("jsMethod") }
        }

        await bridge.processMessage(BridgeTestSupport.message(.result, data: .object([
            "type": .string("Success"),
            "data": .string("test result"),
            "request_id": .string("1"),
        ])))

        let result = try await sendTask.value
        XCTAssertEqual(result, "test result")
    }

    func testSendWithErrorResultRejectsWithBridgeError() async throws {
        try await initializeBridge(jsMethods: ["jsMethod"])

        let sendTask = Task { () -> String in try await bridge.send("jsMethod") }
        await BridgeTestSupport.wait {
            self.mock.scripts().contains { $0.contains("jsMethod") }
        }

        await bridge.processMessage(BridgeTestSupport.message(.result, data: .object([
            "type": .string("Error"),
            "error": .object([
                "error_type": .string("REJECTED"),
                "error_message": .string("Method failed"),
            ]),
            "request_id": .string("1"),
        ])))

        do {
            _ = try await sendTask.value
            XCTFail("Expected BridgeError")
        } catch let error as BridgeError {
            XCTAssertEqual(error.errorType, .rejected)
            XCTAssertEqual(error.message, "Method failed")
        }
    }

    func testSendWithTimeoutThrowsTimeoutError() async throws {
        try await initializeBridge(jsMethods: ["jsMethod"])

        do {
            let _: String = try await bridge.send("jsMethod", timeoutMs: 100)
            XCTFail("Expected timeout")
        } catch let error as BridgeError {
            XCTAssertEqual(error.errorType, .methodExecutionTimeout)
        }
    }

    func testSendBeforeInitializationThrows() async {
        do {
            let _: String = try await bridge.send("anyMethod")
            XCTFail("Expected error")
        } catch let error as BridgeError {
            XCTAssertEqual(error.errorType, .bridgeNotAvailable)
        } catch {
            XCTFail("Expected BridgeError, got \(error)")
        }
    }

    func testSendUnsupportedMethodThrows() async throws {
        try await initializeBridge(jsMethods: ["otherMethod"])
        do {
            let _: String = try await bridge.send("unknownMethod")
            XCTFail("Expected error")
        } catch let error as BridgeError {
            XCTAssertEqual(error.errorType, .unsupportedMethod)
        }
    }

    // MARK: - Ignored messages

    func testProcessMessageWithEmptyStringIsIgnored() async {
        await bridge.processMessage("")
        XCTAssertTrue(mock.scripts().isEmpty)
    }

    func testProcessMessageWithInvalidJsonIsIgnored() async {
        await bridge.processMessage("not json {")
        XCTAssertTrue(mock.scripts().isEmpty)
    }

    func testProcessMessageWithNonBridgeEventIsIgnored() async {
        let message = (try? JSONValue.object([
            "type": .string("OtherEvent"),
            "data": .object([:]),
        ]).jsonString()) ?? ""
        await bridge.processMessage(message)
        XCTAssertTrue(mock.scripts().isEmpty)
    }

    // MARK: - Dispose

    func testDisposeCancelsPendingRequests() async throws {
        try await initializeBridge(jsMethods: ["jsMethod"])

        let sendTask = Task { () -> String in try await bridge.send("jsMethod") }
        await BridgeTestSupport.wait {
            self.mock.scripts().contains { $0.contains("jsMethod") }
        }

        bridge.dispose()

        do {
            _ = try await sendTask.value
            XCTFail("Expected cancellation")
        } catch is CancellationError {
            // Expected.
        } catch let error as BridgeError where error.errorType == .methodExecutionTimeout {
            // Acceptable if the timeout races dispose; still a rejection.
        }
    }

    func testDisposeDisposesBrowserBridge() {
        bridge.dispose()
        XCTAssertTrue(mock.disposed)
    }

    func testDisposeCalledTwiceDoesNotThrow() {
        bridge.dispose()
        bridge.dispose()
    }

    // MARK: - Helpers

    private func initializeBridge(jsMethods: [String]) async throws {
        let initTask = Task { try await bridge.initialize() }
        await BridgeTestSupport.wait { !self.mock.scripts().isEmpty }
        await bridge.processMessage(BridgeTestSupport.message(.`init`, data: .object([
            "methods": .array(jsMethods.map { .string($0) }),
        ])))
        await bridge.processMessage(BridgeTestSupport.message(.initResult, data: .bool(true)))
        try await initTask.value
    }
}
