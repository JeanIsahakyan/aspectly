package com.aspectly.bridge

import java.util.Collections

/**
 * In-memory [BrowserBridge] for unit tests. Captures scripts sent to JS and
 * lets tests feed messages back as if they came from JS.
 */
class MockBrowserBridge : BrowserBridge {
    override val isReady = true
    override var onMessage: ((String) -> Unit)? = null

    val sentScripts: MutableList<String> = Collections.synchronizedList(mutableListOf())
    var disposed = false

    override suspend fun executeScript(script: String) {
        sentScripts.add(script)
    }

    override fun dispose() {
        disposed = true
    }

    /** Simulate a message arriving from JavaScript. */
    fun receive(message: String) {
        onMessage?.invoke(message)
    }

    fun lastScript(): String? = synchronized(sentScripts) { sentScripts.lastOrNull() }

    fun anyScriptContains(substring: String): Boolean =
        synchronized(sentScripts) { sentScripts.any { it.contains(substring) } }
}
