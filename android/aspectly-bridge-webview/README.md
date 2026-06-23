# aspectly-bridge-webview

Android `WebView` browser bridge for
[Aspectly](https://github.com/JeanIsahakyan/aspectly) — enables bidirectional
communication with JavaScript running in an Android `WebView`.

## Usage

```kotlin
import com.aspectly.bridge.BridgeHost
import com.aspectly.bridge.webview.AndroidWebViewBrowserBridge

val webView = WebView(context)
val browserBridge = AndroidWebViewBrowserBridge(webView)
val bridge = BridgeHost(browserBridge)

// Register handlers
bridge.registerTypedHandler<MyParams>("myMethod") { p -> MyResult(p.input * 2) }

webView.webViewClient = object : WebViewClient() {
    override fun onPageFinished(view: WebView?, url: String?) {
        lifecycleScope.launch {
            // Initialize
            bridge.initialize()
            // Call JS methods
            val result: JsResult = bridge.send("jsMethod", mapOf("data" to "hello"))
        }
    }
}

webView.loadUrl("https://your-app.com")
```

The bridge enables JavaScript on the `WebView` and injects a
`@JavascriptInterface` named `AspectlyAndroid` (configurable). All `WebView`
access is dispatched to the main thread.

## Requirements

- Android API 21+
- `aspectly-bridge` (core)

## License

MIT
