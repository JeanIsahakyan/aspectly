# Aspectly

A powerful, type-safe communication bridge framework for React Native, Web, iframes, .NET desktop, **iOS/macOS (Swift)**, **Android (Kotlin)**, **Flutter (Dart)**, and **Linux/WebKitGTK (Python)**.

[![GitHub stars](https://img.shields.io/github/stars/JeanIsahakyan/aspectly?style=flat-square&logo=github)](https://github.com/JeanIsahakyan/aspectly)
[![npm version](https://img.shields.io/npm/v/@aspectly/core?style=flat-square&logo=npm&color=cb3837)](https://www.npmjs.com/package/@aspectly/core)
[![NuGet version](https://img.shields.io/nuget/v/Aspectly.Bridge?style=flat-square&logo=nuget&color=004880)](https://www.nuget.org/packages/Aspectly.Bridge)
[![npm downloads](https://img.shields.io/npm/dm/@aspectly/core?style=flat-square&color=22c55e)](https://www.npmjs.com/package/@aspectly/core)
[![CI](https://img.shields.io/github/actions/workflow/status/JeanIsahakyan/aspectly/ci.yml?style=flat-square&logo=github-actions&logoColor=white&label=CI)](https://github.com/JeanIsahakyan/aspectly/actions)
[![License: MIT](https://img.shields.io/github/license/JeanIsahakyan/aspectly?style=flat-square)](https://opensource.org/licenses/MIT)

## Overview

Aspectly enables seamless, type-safe, bidirectional communication between
embedded web content (iframe / WebView) and a native host — across **8 platform
families**. The same `@aspectly/core` web content runs unchanged on every host.

## Supported platforms

All packages are at **v2.1.0** (the .NET packages publish at the release tag
version; the Swift package is consumed via the git tag / `2.1.0` CocoaPods).

| Platform | Package | Version | Registry | Install |
|----------|---------|:-------:|----------|---------|
| Web (iframe / popup) | `@aspectly/core`, `@aspectly/web` | 2.1.0 | npm | `npm i @aspectly/web` |
| React Native | `@aspectly/react-native` | 2.1.0 | npm | `npm i @aspectly/react-native react-native-webview` |
| React Native Web / Expo | `@aspectly/react-native-web` | 2.1.0 | npm | `npm i @aspectly/react-native-web` |
| Transports (platform detection) | `@aspectly/transports` | 2.1.0 | npm | `npm i @aspectly/transports` |
| .NET — CefSharp (Windows) | `Aspectly.Bridge.CefSharp` | 2.1.0 | NuGet | `dotnet add package Aspectly.Bridge.CefSharp` |
| .NET — WebView2 (Windows) | `Aspectly.Bridge.WebView2` | 2.1.0 | NuGet | `dotnet add package Aspectly.Bridge.WebView2` |
| iOS / macOS / visionOS | `AspectlyBridge`, `AspectlyBridgeWebKit` | 2.1.0 | SwiftPM · CocoaPods | `.package(url: "…/aspectly.git", from: "2.1.0")` · `pod 'AspectlyBridgeWebKit'` |
| Android | `com.aspectly:aspectly-bridge(-webview)` | 2.1.0 | Maven Central | `implementation("com.aspectly:aspectly-bridge-webview:2.1.0")` |
| Flutter (Dart) | `aspectly_bridge` | 2.1.0 | pub.dev | `flutter pub add aspectly_bridge` |
| Linux / WebKitGTK (Python) | `aspectly-bridge` | 2.1.0 | PyPI | `pip install "aspectly-bridge[webkitgtk]"` |

## Packages

| Package | Description |
|---------|-------------|
| [`@aspectly/core`](./packages/core) | Core bridge framework - use inside iframes/WebViews |
| [`@aspectly/web`](./packages/web) | Web/iframe integration with React hooks |
| [`@aspectly/react-native`](./packages/react-native) | React Native WebView integration |
| [`@aspectly/react-native-web`](./packages/react-native-web) | Universal React Native Web support |
| [`@aspectly/transports`](./packages/transports) | Transport layer for platform detection |
| | |
| [`Aspectly.Bridge`](./dotnet/Aspectly.Bridge) | Core .NET bridge library |
| [`Aspectly.Bridge.CefSharp`](./dotnet/Aspectly.Bridge.CefSharp) | CefSharp (Chromium) integration |
| [`Aspectly.Bridge.WebView2`](./dotnet/Aspectly.Bridge.WebView2) | WebView2 (Edge) integration |
| | |
| [`AspectlyBridge`](./swift) (Swift) | Core Swift bridge — iOS & macOS |
| [`AspectlyBridgeWebKit`](./swift) (Swift) | `WKWebView` bridge + SwiftUI `AspectlyWebView` |
| | |
| [`aspectly-bridge`](./android) (Kotlin) | Core Android bridge library |
| [`aspectly-bridge-webview`](./android) (Kotlin) | Android `WebView` integration |
| | |
| [`aspectly_bridge`](./dart) (Dart) | Flutter / Dart bridge (`webview_flutter`) |
| [`aspectly-bridge`](./python) (Python) | WebKitGTK bridge (Linux desktop) |

## Quick Start

### Scenario 1: Web page embedding an iframe

**Parent page (host):**

```tsx
import { useAspectlyIframe } from '@aspectly/web';

function App() {
  const [bridge, loaded, Iframe] = useAspectlyIframe({
    url: 'https://widget.example.com'
  });

  useEffect(() => {
    if (loaded) {
      bridge.init({
        getUserData: async () => ({ name: 'John', id: 123 })
      });
    }
  }, [loaded]);

  return <Iframe style={{ width: '100%', height: 400 }} />;
}
```

**iframe content (widget):**

```typescript
import { AspectlyBridge } from '@aspectly/core';

const bridge = new AspectlyBridge();
await bridge.init({
  greet: async (params) => ({ message: `Hello, ${params.name}!` })
});

const user = await bridge.send('getUserData');
```

### Scenario 2: React Native app with WebView

**React Native app:**

```tsx
import { useAspectlyWebView } from '@aspectly/react-native';

function App() {
  const [bridge, loaded, WebView] = useAspectlyWebView({
    url: 'https://webapp.example.com'
  });

  useEffect(() => {
    if (loaded) {
      bridge.init({
        getDeviceInfo: async () => ({
          platform: Platform.OS,
          version: Platform.Version
        })
      });
    }
  }, [loaded]);

  return <WebView style={{ flex: 1 }} />;
}
```

**Web content (inside WebView):**

```typescript
import { AspectlyBridge } from '@aspectly/core';

const bridge = new AspectlyBridge();
await bridge.init();

const device = await bridge.send('getDeviceInfo');
console.log(`Running on ${device.platform}`);
```

### Scenario 3: Universal app (Expo / React Native Web)

```tsx
import { useAspectlyWebView } from '@aspectly/react-native-web';

// Same API works on iOS, Android, and Web!
function App() {
  const [bridge, loaded, WebView] = useAspectlyWebView({
    url: 'https://widget.example.com'
  });

  return <WebView style={{ flex: 1 }} />;
}
```

### Scenario 4: .NET desktop app with CefSharp

**C# host app:**

```csharp
using Aspectly.Bridge;
using Aspectly.Bridge.CefSharp;

var browserBridge = new CefSharpBrowserBridge(chromiumBrowser);
var bridge = new BridgeHost(browserBridge);

bridge.RegisterHandler<object, object>("getUserData", async _ =>
    new { name = "John", id = 123 });

// InitializeAsync() awaits both Init and InitResult from the JS side
await bridge.InitializeAsync();
var result = await bridge.SendAsync<string>("jsMethod");

// Or initialize with handlers in one call:
await bridge.InitializeAsync(new Dictionary<string, Delegate>
{
    ["getUserData"] = async (object _) => new { name = "John", id = 123 }
});
```

### Scenario 5: iOS / macOS app with SwiftUI

**Swift host app:**

```swift
import SwiftUI
import AspectlyBridge
import AspectlyBridgeWebKit

struct ContentView: View {
    @StateObject private var model = AspectlyWebViewModel(
        url: URL(string: "https://webapp.example.com")!
    )

    var body: some View {
        AspectlyWebView(model: model)
            .onChange(of: model.isLoaded) { loaded in
                guard loaded else { return }
                Task {
                    model.bridge.registerHandler("getDeviceInfo") { _ in
                        DeviceInfo(platform: "iOS")
                    }
                    try await model.bridge.initialize()
                    let result: GreetResult = try await model.bridge.send(
                        "greet", params: GreetParams(name: "Native")
                    )
                }
            }
    }
}
```

### Scenario 6: Android app with WebView

**Kotlin host app:**

```kotlin
import com.aspectly.bridge.BridgeHost
import com.aspectly.bridge.webview.AndroidWebViewBrowserBridge

val browserBridge = AndroidWebViewBrowserBridge(webView)
val bridge = BridgeHost(browserBridge)

bridge.registerHandler("getDeviceInfo") { _ -> DeviceInfo("Android") }

webView.webViewClient = object : WebViewClient() {
    override fun onPageFinished(view: WebView?, url: String?) {
        lifecycleScope.launch {
            bridge.initialize()
            val result: GreetResult = bridge.send("greet", GreetParams("Native"))
        }
    }
}
webView.loadUrl("https://webapp.example.com")
```

The web content inside the WebView is the **same** `@aspectly/core` code as every
other scenario — the transport is auto-detected.

## Features

- **Type-safe** - Full TypeScript support with generics
- **Promise-based** - Modern async/await API
- **Universal** - Works on iOS, Android, and Web
- **Bidirectional** - Send and receive messages in both directions
- **Event-driven** - Subscribe to all bridge events
- **Error handling** - Typed errors with detailed messages
- **Timeout protection** - Configurable request timeouts
- **Cross-platform** - JavaScript, TypeScript, .NET, Swift (iOS/macOS), and Kotlin (Android) support

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Host Context                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ @aspectly/web | @aspectly/react-native | @aspectly/react-native-web | .NET (Aspectly.Bridge)│ │
│  │                                                              │ │
│  │  • useAspectlyIframe() / useAspectlyWebView()               │ │
│  │  • Register handlers                                         │ │
│  │  • Send requests                                             │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│                             │ postMessage / injectJavaScript     │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   Embedded Context                           │ │
│  │                     (iframe/WebView)                         │ │
│  │  ┌───────────────────────────────────────────────────────┐  │ │
│  │  │  @aspectly/core                                        │  │ │
│  │  │                                                        │  │ │
│  │  │  • AspectlyBridge                                     │  │ │
│  │  │  • Register handlers                                   │  │ │
│  │  │  • Send requests                                       │  │ │
│  │  └───────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Installation

Choose the package based on your use case:

```bash
# Inside an iframe or WebView (embedded content)
npm install @aspectly/core

# Web app embedding an iframe
npm install @aspectly/web

# React Native app with WebView
npm install @aspectly/react-native react-native-webview

# Universal app (Expo / React Native Web)
npm install @aspectly/react-native-web react-native-webview

# .NET desktop app with CefSharp
dotnet add package Aspectly.Bridge.CefSharp

# .NET desktop app with WebView2
dotnet add package Aspectly.Bridge.WebView2
```

```swift
// iOS / macOS app (Swift Package Manager)
.package(url: "https://github.com/JeanIsahakyan/aspectly.git", from: "2.1.0")
// products: AspectlyBridge, AspectlyBridgeWebKit
```

```kotlin
// Android app (Gradle)
implementation("com.aspectly:aspectly-bridge-webview:2.1.0")
```

```yaml
# Flutter / Dart app (pubspec.yaml)
dependencies:
  aspectly_bridge: ^2.1.0
```

```bash
# Python WebKitGTK app (Linux)
pip install "aspectly-bridge[webkitgtk]"
```

## Error Handling

```typescript
import { BridgeErrorType } from '@aspectly/core';

try {
  const result = await bridge.send('someMethod', params);
} catch (error) {
  switch (error.error_type) {
    case BridgeErrorType.UNSUPPORTED_METHOD:
      console.log('Method not registered');
      break;
    case BridgeErrorType.METHOD_EXECUTION_TIMEOUT:
      console.log('Handler timed out');
      break;
    case BridgeErrorType.BRIDGE_NOT_AVAILABLE:
      console.log('Bridge not initialized');
      break;
    case BridgeErrorType.REJECTED:
      console.log('Handler threw error:', error.error_message);
      break;
  }
}
```

## Examples

See the [examples](./examples) directory:

- [`examples/core`](./examples/core) - Widget running inside iframe/WebView
- [`examples/web`](./examples/web) - React app embedding an iframe
- [`examples/react-native`](./examples/react-native) - Universal Expo app
- [`examples/dotnet`](./examples/dotnet) - .NET desktop app with CefSharp
- [`examples/swiftui`](./examples/swiftui) - iOS / macOS SwiftUI app
- [`examples/android`](./examples/android) - Android app with WebView
- [`examples/flutter`](./examples/flutter) - Flutter app with webview_flutter
- [`examples/webkitgtk`](./examples/webkitgtk) - Python WebKitGTK app (Linux)

## Documentation

- [API Reference](./docs/API.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Examples](./docs/EXAMPLES.md)
- [Migration Guide](./docs/MIGRATION.md)
- [Publishing](./docs/PUBLISHING.md)

Platform-specific guides: [Swift (iOS/macOS)](./swift) · [Android (Kotlin)](./android) · [Dart/Flutter](./dart) · [Python/WebKitGTK](./python) · [.NET](./dotnet)

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run type checking
pnpm typecheck

# Run linting
pnpm lint
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

MIT © [Zhan Isaakian](https://github.com/JeanIsahakyan)
