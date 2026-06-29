package com.aspectly.bridge.webview

import android.annotation.SuppressLint
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.aspectly.bridge.BridgeException
import com.aspectly.bridge.BrowserBridge
import com.aspectly.bridge.protocol.BridgeErrorType
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * [BrowserBridge] implementation for an Android [WebView]. The Kotlin
 * equivalent of .NET's `CefSharpBrowserBridge` / Swift's
 * `WKWebViewBrowserBridge`.
 *
 * Message passing:
 * - JS → native: `window.AspectlyAndroid.postMessage(message)` delivered to the
 *   injected `@JavascriptInterface`.
 * - native → JS: `webView.evaluateJavascript("window.postMessage(...)")`.
 *
 * The WebView must have JavaScript enabled; this bridge enables it on
 * construction. All WebView access is dispatched to the main thread.
 */
class AndroidWebViewBrowserBridge @JvmOverloads constructor(
    private val webView: WebView,
    private val interfaceName: String = DEFAULT_INTERFACE_NAME,
) : BrowserBridge {

    companion object {
        /** The default `@JavascriptInterface` name the JS-side transport looks for. */
        const val DEFAULT_INTERFACE_NAME = "AspectlyAndroid"
    }

    private val mainHandler = Handler(Looper.getMainLooper())

    @Volatile
    private var disposed = false

    override var onMessage: ((String) -> Unit)? = null

    override val isReady: Boolean
        get() = !disposed

    private val jsInterface = object {
        @JavascriptInterface
        fun postMessage(message: String) {
            onMessage?.invoke(message)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun attach() {
        webView.settings.javaScriptEnabled = true
        webView.addJavascriptInterface(jsInterface, interfaceName)
    }

    init {
        runOnMain { attach() }
    }

    override suspend fun executeScript(script: String) {
        if (disposed) {
            throw BridgeException(BridgeErrorType.BRIDGE_NOT_AVAILABLE, "WebView bridge disposed")
        }
        suspendCancellableCoroutine { continuation ->
            runOnMain {
                try {
                    webView.evaluateJavascript(script, null)
                    continuation.resume(Unit)
                } catch (e: Throwable) {
                    continuation.resumeWithException(e)
                }
            }
        }
    }

    override fun dispose() {
        if (disposed) return
        disposed = true
        onMessage = null
        runOnMain { webView.removeJavascriptInterface(interfaceName) }
    }

    private fun runOnMain(block: () -> Unit) {
        if (Looper.myLooper() == Looper.getMainLooper()) {
            block()
        } else {
            mainHandler.post(block)
        }
    }
}
