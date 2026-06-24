# Aspectly Android

[![Kotlin](https://img.shields.io/badge/Kotlin-1.9+-blueviolet?style=flat-square&logo=kotlin)](https://kotlinlang.org)
[![Android](https://img.shields.io/badge/Android-API%2021+-3DDC84?style=flat-square&logo=android)](https://developer.android.com)
[![CI](https://img.shields.io/github/actions/workflow/status/JeanIsahakyan/aspectly/ci.yml?style=flat-square&logo=github-actions&logoColor=white&label=CI)](https://github.com/JeanIsahakyan/aspectly/actions)

Kotlin implementation of the Aspectly bridge protocol — bidirectional, type-safe
communication between native Android code and JavaScript running in an Android
`WebView`.

## Modules

| Module | Description |
|--------|-------------|
| `aspectly-bridge` | Core bridge (`BridgeHost`, protocol types) — pure Kotlin/JVM, no Android dependency |
| `aspectly-bridge-webview` | `AndroidWebViewBrowserBridge` — Android `WebView` integration |

The core module depends only on **Gson** and **kotlinx-coroutines**, so it can be
unit-tested on a plain JVM (no Android SDK required).

## Install

From [Maven Central](https://central.sonatype.com/), add to your `build.gradle.kts`:

```kotlin
dependencies {
    implementation("com.aspectly:aspectly-bridge:2.1.0")
    implementation("com.aspectly:aspectly-bridge-webview:2.1.0")
}
```

Or with Groovy `build.gradle`:

```groovy
dependencies {
    implementation 'com.aspectly:aspectly-bridge:2.1.0'
    implementation 'com.aspectly:aspectly-bridge-webview:2.1.0'
}
```

## Quick Start

```kotlin
import com.aspectly.bridge.BridgeHost
import com.aspectly.bridge.webview.AndroidWebViewBrowserBridge

val webView = WebView(context)
val browserBridge = AndroidWebViewBrowserBridge(webView)
val bridge = BridgeHost(browserBridge)

// Register handlers JS can call (before initialize).
bridge.registerHandler("ping") { _ -> "pong" }
bridge.registerTypedHandler<AddParams>("add") { p -> p.a + p.b }

webView.webViewClient = object : WebViewClient() {
    override fun onPageFinished(view: WebView?, url: String?) {
        lifecycleScope.launch {
            bridge.initialize()                              // handshake
            val result: GreetResult =
                bridge.send("greet", GreetParams("Android")) // call JS
        }
    }
}
webView.loadUrl("https://app.example.com")
```

The web content loaded in the WebView uses
[`@aspectly/core`](../packages/core):

```bash
npm install @aspectly/core
```

## `BridgeHost` API

```kotlin
// Construction
val bridge = BridgeHost(
    browserBridge,          // BrowserBridge (required)
    logger = ConsoleLogger, // BridgeLogger (optional, default: NullLogger)
    timeoutMs = 30_000L     // Long (optional, default: 100_000 = 100s)
)

// Handler registration (call BEFORE initialize)
bridge.registerHandler("raw") { json -> /* json: JsonElement */ }   // raw params
bridge.registerTypedHandler<MyParams>("typed") { p -> MyResult() }  // typed params + result
bridge.registerHandler(myHandler, MyParams::class.java)             // BridgeHandler interface
bridge.unregisterHandler("raw")

// Initialization (suspend)
bridge.initialize()
// Map form: handlers must be typed as RawBridgeHandler (Kotlin does not coerce a
// bare lambda to `suspend` inside a map literal).
val getData: RawBridgeHandler = { _ -> MyResult() }
bridge.initialize(mapOf("getData" to getData))

// Calling JS (suspend, reified)
val result: MyResult = bridge.send("jsMethod", MyParams())

// Properties
bridge.isInitialized      // Boolean
bridge.supportedMethods   // List<String>  (JS-side methods)
bridge.registeredMethods  // List<String>  (Kotlin-side handlers)

// Event
bridge.onInitialized = { /* handshake complete */ }

// Cleanup
bridge.dispose()
```

## Protocol & Transport

The web content auto-detects the native host through the
[`@aspectly/transports`](../packages/transports) **Android transport**:

- **JS → native**: `window.AspectlyAndroid.postMessage(message)`, delivered to a
  `@JavascriptInterface` method.
- **native → JS**: `webView.evaluateJavascript("window.postMessage(...)")`,
  received via the `message` event.

The interface name (`AspectlyAndroid`) is configurable on
`AndroidWebViewBrowserBridge`.

## Error Handling

`send` and handlers surface `BridgeException`:

```kotlin
try {
    val result: MyResult = bridge.send("someMethod", params)
} catch (e: BridgeException) {
    when (e.errorType) {
        BridgeErrorType.UNSUPPORTED_METHOD -> { /* method not registered */ }
        BridgeErrorType.METHOD_EXECUTION_TIMEOUT -> { /* timed out */ }
        BridgeErrorType.REJECTED -> { /* handler threw */ }
        BridgeErrorType.BRIDGE_NOT_AVAILABLE -> { /* not initialized */ }
    }
}
```

## Building & Testing

```bash
cd android
gradle :aspectly-bridge:test                  # run core unit tests (JVM)
gradle :aspectly-bridge-webview:assemble       # build the WebView module (AAR)
```

See [`examples/android`](../examples/android) for a runnable sample app.

## Other platforms

Aspectly ships the same bridge for Web (iframe/popup), React Native, .NET
(CefSharp/WebView2), iOS/macOS/visionOS, Flutter, and Linux/WebKitGTK — all at
version `2.1.0`. See the [main README](../README.md) for the full platform list.

## License

MIT
