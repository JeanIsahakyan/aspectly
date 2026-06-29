package com.aspectly.bridge

/**
 * Abstraction for browser message passing.
 *
 * Implement this interface to support different web views (Android `WebView`,
 * custom embeddings, mocks for testing). The Kotlin equivalent of .NET's
 * `IBrowserBridge`.
 */
interface BrowserBridge {
    /** Whether the browser is initialized and ready for communication. */
    val isReady: Boolean

    /**
     * Invoked when a message is received from JavaScript.
     * [BridgeHost] assigns this when it is constructed.
     */
    var onMessage: ((String) -> Unit)?

    /**
     * Send a message to JavaScript by executing a script.
     * @param script The JavaScript code to execute.
     */
    suspend fun executeScript(script: String)

    /** Release any resources and detach from the underlying web view. */
    fun dispose()
}
