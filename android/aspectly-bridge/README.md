# aspectly-bridge (core)

Core bridge library for [Aspectly](https://github.com/JeanIsahakyan/aspectly) on
Android/Kotlin — bidirectional communication between native code and JavaScript
via the Aspectly protocol.

Pure Kotlin/JVM (no Android dependency). Depends on Gson and kotlinx-coroutines.

## Usage

```kotlin
import com.aspectly.bridge.BridgeHost

// Create with your BrowserBridge implementation
val bridge = BridgeHost(browserBridge)

// Register handlers JS can call
bridge.registerTypedHandler<MyParams>("myMethod") { p -> MyResult(p.input * 2) }

// Initialize the handshake
bridge.initialize()

// Call methods on the JS side
val result: JsResult = bridge.send("jsMethod", mapOf("data" to "hello"))
```

## Creating a custom BrowserBridge

Implement `BrowserBridge` to support any web view control:

```kotlin
class MyBrowserBridge : BrowserBridge {
    override val isReady: Boolean get() = /* ... */
    override var onMessage: ((String) -> Unit)? = null
    override suspend fun executeScript(script: String) { /* run JS */ }
    override fun dispose() { }
}
```

For the Android `WebView` implementation, use
[`aspectly-bridge-webview`](../aspectly-bridge-webview).

## License

MIT
