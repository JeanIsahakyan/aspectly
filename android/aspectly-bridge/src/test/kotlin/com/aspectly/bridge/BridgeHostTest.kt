package com.aspectly.bridge

import com.aspectly.bridge.protocol.BridgeErrorType
import com.google.gson.JsonElement
import com.google.gson.JsonParser
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class BridgeHostTest {
    private lateinit var mock: MockBrowserBridge
    private lateinit var bridge: BridgeHost

    @Before
    fun setUp() {
        mock = MockBrowserBridge()
        bridge = BridgeHost(mock)
    }

    @After
    fun tearDown() {
        bridge.dispose()
    }

    // region Handler registration

    @Test
    fun registerHandlerAddsHandler() {
        bridge.registerHandler("test") { "result" }
        assertTrue(bridge.registeredMethods.contains("test"))
    }

    @Test
    fun unregisterHandlerRemovesHandler() {
        bridge.registerHandler("test") { "result" }
        bridge.unregisterHandler("test")
        assertFalse(bridge.registeredMethods.contains("test"))
    }

    @Test
    fun registerHandlerWithSameNameOverwrites() = runBlocking {
        bridge.registerHandler("test") { "first" }
        bridge.registerHandler("test") { "second" }

        bridge.processMessage(request("test", "1"))

        assertTrue(mock.lastScript()!!.contains("second"))
    }

    // endregion

    // region Init handshake

    @Test
    fun processMessageWithInitUpdatesSupportedMethods() = runBlocking {
        bridge.processMessage(initMessage(listOf("jsMethod1", "jsMethod2")))

        assertTrue(bridge.supportedMethods.contains("jsMethod1"))
        assertTrue(bridge.supportedMethods.contains("jsMethod2"))
    }

    @Test
    fun handleInitOnlySendsInitResultNotOurInit() = runBlocking {
        bridge.registerHandler("myMethod") { "result" }

        bridge.processMessage(initMessage(listOf("jsMethod")))

        assertEquals(1, mock.sentScripts.size)
        assertTrue(mock.sentScripts[0].contains("InitResult"))
        assertFalse(mock.sentScripts[0].contains("""type\":\"Init\""""))
    }

    @Test
    fun initializesOnlyWhenBothInitAndInitResultReceived() = runBlocking {
        var eventFired = false
        bridge.onInitialized = { eventFired = true }

        bridge.processMessage(bridgeMessage("InitResult", "true"))
        assertFalse(bridge.isInitialized)
        assertFalse(eventFired)

        bridge.processMessage(initMessage(listOf("jsMethod")))
        assertTrue(bridge.isInitialized)
        assertTrue(eventFired)
    }

    @Test
    fun initializeWaitsForBothInitAndInitResult() = runBlocking {
        bridge.handshake(mock, listOf("jsMethod"))
        assertTrue(bridge.isInitialized)
        assertTrue(bridge.supportedMethods.contains("jsMethod"))
    }

    @Test
    fun initializeWithHandlersRegistersAndInits() = runBlocking {
        // Handlers must be typed as RawBridgeHandler so the lambda is inferred as
        // a `suspend` function (Kotlin does not coerce bare lambdas to suspend
        // inside a Pair/map literal).
        val h1: RawBridgeHandler = { _ -> "result1" }
        val h2: RawBridgeHandler = { _ -> "result2" }
        coroutineScope {
            val job = async {
                bridge.initialize(mapOf("method1" to h1, "method2" to h2))
            }
            waitFor { bridge.registeredMethods.size >= 2 }
            assertTrue(bridge.registeredMethods.contains("method1"))
            assertTrue(bridge.registeredMethods.contains("method2"))

            bridge.processMessage(initMessage(listOf("jsMethod")))
            bridge.processMessage(bridgeMessage("InitResult", "true"))
            job.await()
        }
        assertTrue(bridge.isInitialized)
    }

    // endregion

    // region Incoming requests

    @Test
    fun processMessageWithRequestCallsHandler() = runBlocking {
        var called = false
        bridge.registerHandler("testMethod") {
            called = true
            mapOf("success" to true)
        }

        bridge.processMessage(request("testMethod", "1"))
        assertTrue(called)
    }

    @Test
    fun processMessageWithUnknownMethodSendsError() = runBlocking {
        bridge.processMessage(request("unknownMethod", "1"))
        assertTrue(mock.lastScript()!!.contains("UNSUPPORTED_METHOD"))
    }

    @Test
    fun requestHandlerReturnsDataSendsSuccessResult() = runBlocking {
        bridge.registerHandler("testMethod") { mapOf("value" to 42) }

        bridge.processMessage(request("testMethod", "test-123"))

        val script = mock.lastScript()!!
        assertTrue(script.contains("Success"))
        assertTrue(script.contains("42"))
    }

    @Test
    fun requestHandlerThrowsSendsRejectedError() = runBlocking {
        bridge.registerHandler("testMethod") { throw RuntimeException("test error") }

        bridge.processMessage(request("testMethod", "test-123"))

        val script = mock.lastScript()!!
        assertTrue(script.contains("REJECTED"))
        assertTrue(script.contains("test error"))
    }

    @Test
    fun handleRequestTimesOutSlowHandler() = runBlocking {
        val shortBridge = BridgeHost(mock, timeoutMs = 100)
        shortBridge.registerHandler("slowMethod") {
            delay(5000)
            mapOf("value" to "late")
        }

        shortBridge.processMessage(request("slowMethod", "1"))

        assertTrue(mock.lastScript()!!.contains("METHOD_EXECUTION_TIMEOUT"))
        shortBridge.dispose()
    }

    @Test
    fun typedHandlerDecodesParams() = runBlocking {
        bridge.registerTypedHandler<AddParams>("add") { p -> p.a + p.b }

        bridge.processMessage(
            bridgeMessage("Request", """{"method":"add","request_id":"1","params":{"a":10,"b":20}}""")
        )

        val wrapper = parseSentScript(mock.lastScript()!!)
        val data = wrapper.asJsonObject.getAsJsonObject("event").getAsJsonObject("data").get("data")
        assertEquals(30, data.asInt)
    }

    // endregion

    // region Sending requests

    @Test
    fun sendWithSuccessResultResolvesPendingRequest() = runBlocking {
        bridge.handshake(mock, listOf("jsMethod"))
        coroutineScope {
            val job = async { bridge.send<String>("jsMethod") }
            waitFor { mock.anyScriptContains("jsMethod") }
            bridge.processMessage(successResult("\"test result\"", "1"))
            assertEquals("test result", job.await())
        }
    }

    @Test
    fun sendWithErrorResultRejectsWithBridgeException() = runBlocking {
        bridge.handshake(mock, listOf("jsMethod"))
        coroutineScope {
            val job = async { runCatching { bridge.send<String>("jsMethod") } }
            waitFor { mock.anyScriptContains("jsMethod") }
            bridge.processMessage(
                bridgeMessage(
                    "Result",
                    """{"type":"Error","error":{"error_type":"REJECTED","error_message":"Method failed"},"request_id":"1"}"""
                )
            )
            val result = job.await()
            assertTrue(result.isFailure)
            val ex = result.exceptionOrNull()
            assertTrue(ex is BridgeException)
            assertEquals(BridgeErrorType.REJECTED, (ex as BridgeException).errorType)
            assertEquals("Method failed", ex.message)
        }
    }

    @Test
    fun sendWithTimeoutThrowsTimeoutError() = runBlocking {
        bridge.handshake(mock, listOf("jsMethod"))
        val result = runCatching { bridge.send<String>("jsMethod", timeoutMs = 100) }
        assertTrue(result.isFailure)
        assertEquals(
            BridgeErrorType.METHOD_EXECUTION_TIMEOUT,
            (result.exceptionOrNull() as BridgeException).errorType
        )
    }

    @Test
    fun sendBeforeInitializationThrows() = runBlocking {
        val result = runCatching { bridge.send<String>("anyMethod") }
        assertTrue(result.isFailure)
        assertEquals(
            BridgeErrorType.BRIDGE_NOT_AVAILABLE,
            (result.exceptionOrNull() as BridgeException).errorType
        )
    }

    @Test
    fun sendUnsupportedMethodThrows() = runBlocking {
        bridge.handshake(mock, listOf("otherMethod"))
        val result = runCatching { bridge.send<String>("unknownMethod") }
        assertTrue(result.isFailure)
        assertEquals(
            BridgeErrorType.UNSUPPORTED_METHOD,
            (result.exceptionOrNull() as BridgeException).errorType
        )
    }

    // endregion

    // region Ignored messages

    @Test
    fun processMessageWithEmptyStringIsIgnored() = runBlocking {
        bridge.processMessage("")
        assertTrue(mock.sentScripts.isEmpty())
    }

    @Test
    fun processMessageWithInvalidJsonIsIgnored() = runBlocking {
        bridge.processMessage("not json {")
        assertTrue(mock.sentScripts.isEmpty())
    }

    @Test
    fun processMessageWithNonBridgeEventIsIgnored() = runBlocking {
        bridge.processMessage("""{"type":"OtherEvent","data":{}}""")
        assertTrue(mock.sentScripts.isEmpty())
    }

    // endregion

    // region Dispose

    @Test
    fun disposeDisposesBrowserBridge() {
        bridge.dispose()
        assertTrue(mock.disposed)
    }

    @Test
    fun disposeCalledTwiceDoesNotThrow() {
        bridge.dispose()
        bridge.dispose()
    }

    @Test
    fun disposeCancelsPendingRequests() = runBlocking {
        bridge.handshake(mock, listOf("jsMethod"))
        coroutineScope {
            val job = async { runCatching { bridge.send<String>("jsMethod") } }
            waitFor { mock.anyScriptContains("jsMethod") }
            bridge.dispose()
            val result = job.await()
            assertTrue(result.isFailure)
            assertTrue(result.exceptionOrNull() is CancellationException)
        }
    }

    // endregion

    // region Helpers

    data class AddParams(val a: Int, val b: Int)

    private suspend fun BridgeHost.handshake(mock: MockBrowserBridge, jsMethods: List<String>) = coroutineScope {
        val job = async { initialize() }
        waitFor { mock.sentScripts.isNotEmpty() }
        processMessage(initMessage(jsMethods))
        processMessage(bridgeMessage("InitResult", "true"))
        job.await()
    }

    private suspend fun waitFor(timeoutMs: Long = 3000, condition: () -> Boolean) {
        val deadline = System.currentTimeMillis() + timeoutMs
        while (!condition() && System.currentTimeMillis() < deadline) {
            delay(2)
        }
    }

    private fun bridgeMessage(type: String, dataJson: String): String =
        """{"type":"BridgeEvent","event":{"type":"$type","data":$dataJson}}"""

    private fun initMessage(methods: List<String>): String {
        val arr = methods.joinToString(",") { "\"$it\"" }
        return bridgeMessage("Init", """{"methods":[$arr]}""")
    }

    private fun request(method: String, id: String): String =
        bridgeMessage("Request", """{"method":"$method","request_id":"$id","params":{}}""")

    private fun successResult(dataJson: String, id: String): String =
        bridgeMessage("Result", """{"type":"Success","data":$dataJson,"request_id":"$id"}""")

    private fun parseSentScript(script: String): JsonElement {
        val start = script.indexOf("window.postMessage(") + "window.postMessage(".length
        val end = script.indexOf(", '*')", start)
        val literal = script.substring(start, end)
        // literal is a JSON string token; decode it to get the inner JSON.
        val innerJson = JsonParser.parseString(literal).asString
        return JsonParser.parseString(innerJson)
    }

    // endregion
}
