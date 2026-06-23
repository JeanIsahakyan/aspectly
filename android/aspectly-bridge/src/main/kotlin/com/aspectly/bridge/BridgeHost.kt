package com.aspectly.bridge

import com.aspectly.bridge.protocol.BridgeErrorType
import com.aspectly.bridge.protocol.BridgeEventType
import com.aspectly.bridge.protocol.BridgeResultType
import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonNull
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.google.gson.JsonPrimitive
import com.google.gson.JsonSyntaxException
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout
import java.lang.reflect.Type
import java.util.concurrent.atomic.AtomicInteger

/**
 * `BridgeHost` manages bidirectional communication between native Android
 * (Kotlin) code and JavaScript via the Aspectly protocol. It handles message
 * passing in both directions and provides type-safe handler registration.
 *
 * This is the native (host) side of the bridge — the Kotlin equivalent of the
 * .NET `BridgeHost` and the parent side of the web hooks. The embedded web
 * content uses `@aspectly/core`'s `AspectlyBridge`.
 */
class BridgeHost @JvmOverloads constructor(
    private val browserBridge: BrowserBridge,
    private val logger: BridgeLogger = NullLogger,
    private val timeoutMs: Long = DEFAULT_TIMEOUT_MS,
) {
    companion object {
        /** Default request/handler timeout (100 seconds), matching `@aspectly/core`. */
        const val DEFAULT_TIMEOUT_MS = 100_000L
        private const val BRIDGE_EVENT_TYPE = "BridgeEvent"
    }

    private val gson = BridgeJson.gson
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private val lock = Any()

    private var initialized = false
    private var remoteInitReceived = false
    private var initResultReceived = false
    private var disposed = false
    private val requestIdCounter = AtomicInteger(0)
    private var initDeferred: CompletableDeferred<Unit>? = null

    private val supportedMethodsStorage = mutableListOf<String>()
    private val handlers = mutableMapOf<String, RawBridgeHandler>()
    private val pendingRequests = mutableMapOf<String, CompletableDeferred<JsonElement>>()

    /** Whether the handshake (both `Init` and `InitResult`) has completed. */
    val isInitialized: Boolean
        get() = synchronized(lock) { initialized }

    /** The methods supported by the JavaScript side. */
    val supportedMethods: List<String>
        get() = synchronized(lock) { supportedMethodsStorage.toList() }

    /** The locally registered handler method names. */
    val registeredMethods: List<String>
        get() = synchronized(lock) { handlers.keys.toList() }

    /** Invoked when the bridge becomes initialized (handshake complete). */
    var onInitialized: (() -> Unit)? = null

    init {
        browserBridge.onMessage = { message -> scope.launch { processMessage(message) } }
        logger.info("[BridgeHost] Created and subscribed to messages")
    }

    // region Incoming messages

    /** Process a message received from JavaScript. */
    suspend fun processMessage(messageJson: String) {
        if (messageJson.isEmpty()) return

        logger.debug("[BridgeHost] Received: $messageJson")

        val root: JsonElement = try {
            JsonParser.parseString(messageJson)
        } catch (e: JsonSyntaxException) {
            logger.error("[BridgeHost] JSON parse error", e)
            return
        }

        val obj = root.asJsonObjectOrNull() ?: return
        if (obj.get("type")?.asStringOrNull() != BRIDGE_EVENT_TYPE) {
            logger.debug("[BridgeHost] Ignoring non-BridgeEvent message")
            return
        }

        val event = obj.get("event")?.asJsonObjectOrNull() ?: return
        val eventTypeRaw = event.get("type")?.asStringOrNull() ?: return
        val eventType = BridgeEventType.fromValue(eventTypeRaw) ?: return
        val data = event.get("data") ?: JsonNull.INSTANCE

        handleEvent(eventType, data)
    }

    private suspend fun handleEvent(type: BridgeEventType, data: JsonElement) {
        when (type) {
            BridgeEventType.INIT -> handleInit(data)
            BridgeEventType.REQUEST -> handleRequest(data)
            BridgeEventType.RESULT -> handleResult(data)
            BridgeEventType.INIT_RESULT -> {
                synchronized(lock) { initResultReceived = true }
                logger.info("[BridgeHost] InitResult received from JS")
                tryResolveInit()
            }
        }
    }

    private suspend fun handleInit(data: JsonElement) {
        val methods = data.asJsonObjectOrNull()
            ?.getAsJsonArrayOrNull("methods")
            ?.mapNotNull { it.asStringOrNull() }
        if (methods != null) {
            synchronized(lock) {
                supportedMethodsStorage.clear()
                supportedMethodsStorage.addAll(methods)
            }
            logger.info("[BridgeHost] JS supports methods: ${methods.joinToString(", ")}")
        }

        synchronized(lock) { remoteInitReceived = true }

        // Match JS protocol: only send InitResult, not our Init.
        // Our Init is sent explicitly via initialize().
        sendEvent(BridgeEventType.INIT_RESULT, JsonPrimitive(true))
        logger.info("[BridgeHost] Sent InitResult")
        tryResolveInit()
    }

    private fun tryResolveInit() {
        var deferred: CompletableDeferred<Unit>? = null
        var shouldResolve = false
        synchronized(lock) {
            if (initResultReceived && remoteInitReceived && !initialized) {
                initialized = true
                shouldResolve = true
                deferred = initDeferred
                initDeferred = null
            }
        }
        if (shouldResolve) {
            deferred?.complete(Unit)
            logger.info("[BridgeHost] Bridge fully initialized (both Init and InitResult received)")
            onInitialized?.invoke()
        }
    }

    private suspend fun handleRequest(data: JsonElement) {
        val obj = data.asJsonObjectOrNull() ?: return
        val method = obj.get("method")?.asStringOrNull() ?: return
        val requestId = obj.get("request_id")?.asStringOrNull() ?: return
        val params = obj.get("params") ?: JsonObject()

        val handler = synchronized(lock) { handlers[method] }

        val result: JsonObject = if (handler != null) {
            try {
                val handlerResult = withTimeout(timeoutMs) { handler(params) }
                logger.debug("[BridgeHost] Handler '$method' completed successfully")
                successResult(method, requestId, gson.toJsonTree(handlerResult))
            } catch (e: TimeoutCancellationException) {
                logger.error("[BridgeHost] Handler '$method' timed out after ${timeoutMs}ms")
                errorResult(method, requestId, BridgeErrorType.METHOD_EXECUTION_TIMEOUT, "Execution timeout exceeded")
            } catch (e: CancellationException) {
                throw e
            } catch (e: Throwable) {
                logger.error("[BridgeHost] Handler '$method' failed", e)
                errorResult(method, requestId, BridgeErrorType.REJECTED, e.message ?: e.toString())
            }
        } else {
            logger.warn("[BridgeHost] Unknown method: $method")
            errorResult(method, requestId, BridgeErrorType.UNSUPPORTED_METHOD, "Method '$method' is not registered")
        }

        sendEvent(BridgeEventType.RESULT, result)
    }

    private fun handleResult(data: JsonElement) {
        val obj = data.asJsonObjectOrNull() ?: return
        val requestId = obj.get("request_id")?.asStringOrNull() ?: return

        val deferred = synchronized(lock) { pendingRequests.remove(requestId) } ?: return

        if (obj.get("type")?.asStringOrNull() == BridgeResultType.SUCCESS.value) {
            deferred.complete(obj.get("data") ?: JsonNull.INSTANCE)
        } else {
            val error = obj.get("error")?.asJsonObjectOrNull()
            val errorType = error?.get("error_type")?.asStringOrNull()
                ?.let { BridgeErrorType.fromValue(it) } ?: BridgeErrorType.REJECTED
            val message = error?.get("error_message")?.asStringOrNull()
            deferred.completeExceptionally(BridgeException(errorType, message))
        }
    }

    // endregion

    // region Outgoing messages

    /** Send a raw event to JavaScript via `window.postMessage`. */
    suspend fun sendEvent(type: BridgeEventType, data: JsonElement) {
        val inner = JsonObject().apply {
            addProperty("type", type.value)
            add("data", data)
        }
        val wrapper = JsonObject().apply {
            addProperty("type", BRIDGE_EVENT_TYPE)
            add("event", inner)
        }

        val json = gson.toJson(wrapper)
        // Double-serialize to produce a safe JS string literal (matches .NET / Swift).
        val jsLiteral = gson.toJson(json)
        // Wrap in an IIFE returning a value so WebView.evaluateJavascript is happy.
        val script = "(function(){window.postMessage($jsLiteral, '*');return true;})();"

        try {
            browserBridge.executeScript(script)
            logger.debug("[BridgeHost] Sent: $json")
        } catch (e: Throwable) {
            logger.error("[BridgeHost] Failed to send event", e)
        }
    }

    /**
     * Send a request to the JavaScript side and await the typed response.
     * Prefer the `reified` overload for ergonomic call sites.
     */
    suspend fun <T> send(method: String, params: Any?, type: Type, timeoutMs: Long = DEFAULT_TIMEOUT_MS): T {
        if (!isInitialized) {
            throw BridgeException(BridgeErrorType.BRIDGE_NOT_AVAILABLE, "Bridge not initialized")
        }

        val supported = synchronized(lock) { supportedMethodsStorage.contains(method) }
        if (!supported) {
            throw BridgeException(BridgeErrorType.UNSUPPORTED_METHOD, "Method '$method' not supported by JS side")
        }

        val requestId = requestIdCounter.incrementAndGet().toString()
        val deferred = CompletableDeferred<JsonElement>()
        synchronized(lock) { pendingRequests[requestId] = deferred }

        val requestData = JsonObject().apply {
            addProperty("method", method)
            addProperty("request_id", requestId)
            add("params", gson.toJsonTree(params ?: JsonObject()))
        }

        sendEvent(BridgeEventType.REQUEST, requestData)
        logger.debug("[BridgeHost] Sent request: $method (id=$requestId)")

        val resultJson: JsonElement = try {
            withTimeout(timeoutMs) { deferred.await() }
        } catch (e: TimeoutCancellationException) {
            synchronized(lock) { pendingRequests.remove(requestId) }
            throw BridgeException(
                BridgeErrorType.METHOD_EXECUTION_TIMEOUT,
                "Request '$method' timed out after ${timeoutMs}ms"
            )
        }

        return gson.fromJson(resultJson, type)
    }

    /** Reified convenience for [send]. */
    suspend inline fun <reified T> send(
        method: String,
        params: Any? = null,
        timeoutMs: Long = DEFAULT_TIMEOUT_MS,
    ): T = send(method, params, object : TypeToken<T>() {}.type, timeoutMs)

    // endregion

    // region Handler registration

    /** Register a raw handler that receives the request params as a [JsonElement]. */
    fun registerHandler(method: String, handler: RawBridgeHandler) {
        synchronized(lock) { handlers[method] = handler }
        logger.info("[BridgeHost] Registered handler: $method")
    }

    /** Register a typed handler whose params are decoded into [P]. */
    inline fun <reified P> registerTypedHandler(
        method: String,
        crossinline handler: suspend (P) -> Any?,
    ) {
        registerHandler(method) { json -> handler(BridgeJson.gson.fromJson(json, P::class.java)) }
    }

    /** Register a handler implementing [BridgeHandler]. */
    fun <P, R> registerHandler(handler: BridgeHandler<P, R>, paramsType: Class<P>) {
        registerHandler(handler.methodName) { json -> handler.handle(BridgeJson.gson.fromJson(json, paramsType)) }
    }

    /** Remove a previously registered handler. */
    fun unregisterHandler(method: String) {
        synchronized(lock) { handlers.remove(method) }
        logger.info("[BridgeHost] Unregistered handler: $method")
    }

    // endregion

    // region Initialization

    /** Register handlers and send `Init` to JavaScript, then wait for `InitResult`. */
    suspend fun initialize(handlers: Map<String, RawBridgeHandler>) {
        handlers.forEach { (method, handler) -> registerHandler(method, handler) }
        initialize()
    }

    /**
     * Send the `Init` event to JavaScript with the registered methods and wait
     * for the handshake to complete. Mirrors the JS `bridge.init()` protocol.
     */
    suspend fun initialize() {
        val methods = registeredMethods
        val deferred = CompletableDeferred<Unit>()
        synchronized(lock) { initDeferred = deferred }

        val initData = JsonObject().apply {
            add("methods", JsonArray().apply { methods.forEach { add(it) } })
        }
        sendEvent(BridgeEventType.INIT, initData)
        logger.info("[BridgeHost] Sent Init with methods: ${methods.joinToString(", ")}")

        deferred.await()
        logger.info("[BridgeHost] InitResult received, initialization complete")
    }

    // endregion

    /** Detach from the browser bridge and cancel any pending work. */
    fun dispose() {
        val pending: List<CompletableDeferred<JsonElement>>
        val initCont: CompletableDeferred<Unit>?
        synchronized(lock) {
            if (disposed) return
            disposed = true
            pending = pendingRequests.values.toList()
            pendingRequests.clear()
            initCont = initDeferred
            initDeferred = null
        }

        browserBridge.onMessage = null
        browserBridge.dispose()

        val cancellation = CancellationException("BridgeHost disposed")
        initCont?.completeExceptionally(cancellation)
        pending.forEach { it.completeExceptionally(cancellation) }
        scope.cancel()

        logger.info("[BridgeHost] Disposed")
    }

    // region Helpers

    private fun successResult(method: String, requestId: String, data: JsonElement): JsonObject =
        JsonObject().apply {
            addProperty("type", BridgeResultType.SUCCESS.value)
            addProperty("method", method)
            addProperty("request_id", requestId)
            add("data", data)
        }

    private fun errorResult(
        method: String,
        requestId: String,
        errorType: BridgeErrorType,
        message: String,
    ): JsonObject = JsonObject().apply {
        addProperty("type", BridgeResultType.ERROR.value)
        addProperty("method", method)
        addProperty("request_id", requestId)
        add("error", JsonObject().apply {
            addProperty("error_type", errorType.value)
            addProperty("error_message", message)
        })
    }

    // endregion
}

private fun JsonElement.asJsonObjectOrNull(): JsonObject? =
    if (isJsonObject) asJsonObject else null

private fun JsonObject.getAsJsonArrayOrNull(key: String): JsonArray? =
    get(key)?.takeIf { it.isJsonArray }?.asJsonArray

private fun JsonElement.asStringOrNull(): String? =
    if (isJsonPrimitive && asJsonPrimitive.isString) asString else null
