package com.aspectly.example

import android.app.Activity
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import com.aspectly.bridge.BridgeHost
import com.aspectly.bridge.BridgeLogger
import com.aspectly.bridge.webview.AndroidWebViewBrowserBridge
import com.google.gson.JsonElement
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

/**
 * Demonstrates bidirectional communication between native Android (Kotlin) and
 * JavaScript using `AndroidWebViewBrowserBridge` + `BridgeHost`.
 */
class MainActivity : Activity() {

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private lateinit var bridge: BridgeHost
    private lateinit var browserBridge: AndroidWebViewBrowserBridge
    private lateinit var logView: TextView
    private var initialized = false

    data class EchoParams(val message: String)
    data class AddParams(val a: Int, val b: Int)
    data class SystemInfo(val device: String, val sdkInt: Int, val release: String)
    data class GreetParams(val name: String)
    data class GreetResult(val message: String)
    data class TimeResult(val time: String)
    data class CalcParams(val a: Int, val b: Int)
    data class CalcResult(val sum: Int, val product: Int)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val webView = WebView(this)
        browserBridge = AndroidWebViewBrowserBridge(webView)
        // Pass a logcat-backed logger so all Kotlin-side bridge activity
        // (handshake, every message received/sent, handler results) is visible
        // in `adb logcat -s Aspectly`.
        bridge = BridgeHost(browserBridge, LogcatBridgeLogger)
        registerHandlers()

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                if (initialized) return
                initialized = true
                scope.launch {
                    runCatching { bridge.initialize() }
                        .onSuccess {
                            log("Bridge initialized!")
                            log("JS methods: ${bridge.supportedMethods.joinToString(", ")}")
                            log("Kotlin methods: ${bridge.registeredMethods.joinToString(", ")}")
                            android.util.Log.i(
                                "ASPECTLY_SMOKE",
                                "initialized=${bridge.isInitialized} jsMethods=${bridge.supportedMethods}"
                            )
                            // Native -> JS round-trip smoke check.
                            runCatching { bridge.send<GreetResult>("greet", GreetParams("Android")) }
                                .onSuccess { android.util.Log.i("ASPECTLY_SMOKE", "native->JS greet -> ${it.message}") }
                                .onFailure { android.util.Log.e("ASPECTLY_SMOKE", "native->JS greet FAILED", it) }
                        }
                        .onFailure {
                            log("Bridge init error: ${it.message}")
                            android.util.Log.e("ASPECTLY_SMOKE", "init FAILED", it)
                        }
                }
            }
        }

        logView = TextView(this)
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            addView(button("greet") { callGreet() })
            addView(button("getTime") { callGetTime() })
            addView(button("calculate") { callCalculate() })
            addView(
                ScrollView(this@MainActivity).apply { addView(logView) },
                LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 320)
            )
            addView(
                webView,
                LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f)
            )
        }
        setContentView(root)

        webView.loadUrl("file:///android_asset/web/index.html")
    }

    // Handlers JS can call.
    private fun registerHandlers() {
        bridge.registerHandler("ping") { _: JsonElement ->
            Log.i(TAG, "[Handler] JS->native ping() -> pong")
            "pong"
        }
        bridge.registerTypedHandler<EchoParams>("echo") { p ->
            Log.i(TAG, "[Handler] JS->native echo(\"${p.message}\")")
            p.message
        }
        bridge.registerTypedHandler<AddParams>("add") { p ->
            val sum = p.a + p.b
            Log.i(TAG, "[Handler] JS->native add(${p.a}, ${p.b}) -> $sum")
            sum
        }
        bridge.registerHandler("getSystemInfo") { _: JsonElement ->
            Log.i(TAG, "[Handler] JS->native getSystemInfo()")
            SystemInfo(
                device = Build.MODEL,
                sdkInt = Build.VERSION.SDK_INT,
                release = Build.VERSION.RELEASE,
            )
        }
    }

    // Calls into the JS side.
    private fun callGreet() = scope.launch {
        log("[Call] greet({ name: \"Android\" })")
        runCatching { bridge.send<GreetResult>("greet", GreetParams("Android")) }
            .onSuccess { log("[Result] ${it.message}") }
            .onFailure { log("[Error] ${it.message}") }
    }

    private fun callGetTime() = scope.launch {
        log("[Call] getTime()")
        runCatching { bridge.send<TimeResult>("getTime") }
            .onSuccess { log("[Result] ${it.time}") }
            .onFailure { log("[Error] ${it.message}") }
    }

    private fun callCalculate() = scope.launch {
        log("[Call] calculate({ a: 5, b: 3 })")
        runCatching { bridge.send<CalcResult>("calculate", CalcParams(5, 3)) }
            .onSuccess { log("[Result] sum=${it.sum}, product=${it.product}") }
            .onFailure { log("[Error] ${it.message}") }
    }

    private fun button(title: String, onClick: () -> Unit): Button =
        Button(this).apply {
            text = title
            setOnClickListener { onClick() }
        }

    private fun log(message: String) {
        logView.append(message + "\n")
        // Mirror the on-screen log to logcat so Kotlin-side activity is visible
        // in `adb logcat -s Aspectly`.
        Log.i(TAG, message)
    }

    override fun onDestroy() {
        bridge.dispose()
        scope.cancel()
        super.onDestroy()
    }

    companion object {
        const val TAG = "Aspectly"
    }
}

/** Routes BridgeHost's internal logs to logcat under the "Aspectly" tag. */
object LogcatBridgeLogger : BridgeLogger {
    override fun debug(message: String) = Unit.also { Log.d(MainActivity.TAG, message) }
    override fun info(message: String) = Unit.also { Log.i(MainActivity.TAG, message) }
    override fun warn(message: String) = Unit.also { Log.w(MainActivity.TAG, message) }
    override fun error(message: String, error: Throwable?) {
        Log.e(MainActivity.TAG, message, error)
    }
}
