# Aspectly Swift

[![Swift](https://img.shields.io/badge/Swift-5.9+-orange?style=flat-square&logo=swift)](https://swift.org)
[![Platforms](https://img.shields.io/badge/platforms-iOS%20%7C%20macOS%20%7C%20tvOS%20%7C%20visionOS-blue?style=flat-square&logo=apple)](https://developer.apple.com)
[![CI](https://img.shields.io/github/actions/workflow/status/JeanIsahakyan/aspectly/ci.yml?style=flat-square&logo=github-actions&logoColor=white&label=CI)](https://github.com/JeanIsahakyan/aspectly/actions)

Swift implementation of the Aspectly bridge protocol — bidirectional, type-safe
communication between native Swift / SwiftUI code and JavaScript running in a
`WKWebView`. Works on **iOS and macOS** (and tvOS / visionOS) from a single
codebase.

## Products

| Library | Description |
|---------|-------------|
| `AspectlyBridge` | Core bridge (`BridgeHost`, protocol types) — Foundation only, no WebKit dependency |
| `AspectlyBridgeWebKit` | `WKWebViewBrowserBridge` + the SwiftUI `AspectlyWebView` integration |

## Installation

### Swift Package Manager

Add the package to your `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/JeanIsahakyan/aspectly.git", from: "2.1.0"),
],
targets: [
    .target(
        name: "MyApp",
        dependencies: [
            .product(name: "AspectlyBridge", package: "aspectly"),
            .product(name: "AspectlyBridgeWebKit", package: "aspectly"),
        ]
    )
]
```

In Xcode: **File → Add Package Dependencies…** and enter the repository URL
`https://github.com/JeanIsahakyan/aspectly.git` (the `Package.swift` manifest is
at the repository root).

### CocoaPods

```ruby
pod 'AspectlyBridgeWebKit'   # pulls in AspectlyBridge automatically
```

The web content loaded in the WebView uses [`@aspectly/core`](../packages/core):

```bash
npm install @aspectly/core
```

## Quick Start (SwiftUI)

The `AspectlyWebView` + `AspectlyWebViewModel` mirror the React
`useAspectlyWebView` hook's `[bridge, loaded]` return.

```swift
import SwiftUI
import AspectlyBridge
import AspectlyBridgeWebKit

struct DeviceInfo: Encodable { let platform: String }
struct GreetParams: Encodable { let name: String }
struct GreetResult: Decodable { let message: String }

struct ContentView: View {
    @StateObject private var model = AspectlyWebViewModel(
        url: URL(string: "https://app.example.com")!
    )

    var body: some View {
        AspectlyWebView(model: model)
            .onChange(of: model.isLoaded) { loaded in
                guard loaded else { return }
                Task {
                    // Register handlers JS can call, then initialize.
                    model.bridge.registerHandler("getDeviceInfo") { _ in
                        DeviceInfo(platform: "iOS")
                    }
                    try await model.bridge.initialize()

                    // Call a JS method.
                    let result: GreetResult = try await model.bridge.send(
                        "greet", params: GreetParams(name: "Native")
                    )
                    print(result.message)
                }
            }
    }
}
```

## Quick Start (manual `WKWebView`)

If you manage your own `WKWebView` (UIKit / AppKit), use
`WKWebViewBrowserBridge` directly — the equivalent of .NET's
`CefSharpBrowserBridge`:

```swift
import WebKit
import AspectlyBridge
import AspectlyBridgeWebKit

let browserBridge = WKWebViewBrowserBridge(webView: webView)
let bridge = BridgeHost(browserBridge: browserBridge)

// Register handlers JS can call (before initialize).
bridge.registerHandler("ping") { _ in "pong" }
bridge.registerHandler("add") { (p: AddParams) in p.a + p.b }

// Initialize the handshake (sends Init, awaits InitResult).
try await bridge.initialize()

// Call methods on the JS side.
let result: GreetResult = try await bridge.send("greet", params: GreetParams(name: "Swift"))
```

## `BridgeHost` API

```swift
// Construction
let bridge = BridgeHost(
    browserBridge: browserBridge,     // BrowserBridge (required)
    logger: ConsoleLogger(),          // BridgeLogger (optional, default: NullLogger)
    timeoutMs: 30_000                 // Int (optional, default: 100_000 = 100s)
)

// Handler registration (call BEFORE initialize)
bridge.registerHandler("raw") { (params: JSONValue) in ... }          // raw params
bridge.registerHandler("typed") { (p: MyParams) in MyResult(...) }    // typed params + result
bridge.registerHandler("noArgs") { () in MyResult(...) }              // no params
bridge.registerHandler(MyHandler())                                  // BridgeHandler protocol
bridge.unregisterHandler("raw")

// Initialization
try await bridge.initialize()
try await bridge.initialize(handlers: ["getData": { _ in MyResult() }])

// Calling JS
let result: MyResult = try await bridge.send("jsMethod", params: MyParams())

// Properties
bridge.isInitialized       // Bool
bridge.supportedMethods    // [String]  (JS-side methods)
bridge.registeredMethods   // [String]  (Swift-side handlers)

// Event
bridge.onInitialized = { /* handshake complete */ }

// Cleanup
bridge.dispose()
```

## Protocol & Transport

The web content auto-detects the native host through the
[`@aspectly/transports`](../packages/transports) **WebKit transport**:

- **JS → native**: `window.webkit.messageHandlers.aspectly.postMessage(message)`,
  delivered to Swift via `WKScriptMessageHandler`.
- **native → JS**: `webView.evaluateJavaScript("window.postMessage(...)")`,
  received via the `message` event.

The handler name (`aspectly`) is configurable on `WKWebViewBrowserBridge`. Both
sides exchange supported methods during `Init` / `InitResult` and then route
typed requests/results — see [`docs/protocol`](../.claude/skills/aspectly/references/protocol.md).

## Error Handling

`send` and handlers surface `BridgeError`:

```swift
do {
    let result: MyResult = try await bridge.send("someMethod", params: params)
} catch let error as BridgeError {
    switch error.errorType {
    case .unsupportedMethod:        // method not registered on the other side
    case .methodExecutionTimeout:   // handler didn't respond in time
    case .rejected:                 // handler threw
    case .bridgeNotAvailable:       // not initialized
    }
}
```

## Building & Testing

The `Package.swift` manifest is at the **repository root**; sources live under
`swift/`. Run from the repo root:

```bash
swift build          # builds AspectlyBridge + AspectlyBridgeWebKit (macOS)
swift test           # runs the unit test suite

# Compile-check for iOS
xcodebuild build -scheme AspectlyBridgeWebKit \
  -destination 'generic/platform=iOS Simulator'
```

See [`examples/swiftui`](../examples/swiftui) for a runnable SwiftUI demo.

## License

MIT
