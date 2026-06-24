# Aspectly.Bridge.CefSharp

[![NuGet version](https://img.shields.io/nuget/v/Aspectly.Bridge.CefSharp?style=flat-square&logo=nuget&color=004880)](https://www.nuget.org/packages/Aspectly.Bridge.CefSharp)
[![NuGet downloads](https://img.shields.io/nuget/dt/Aspectly.Bridge.CefSharp?style=flat-square&color=22c55e)](https://www.nuget.org/packages/Aspectly.Bridge.CefSharp)

CefSharp browser bridge for [Aspectly](https://github.com/JeanIsahakyan/aspectly) - enables bidirectional communication with JavaScript via CefSharp (Chromium Embedded Framework).

## Installation

```bash
dotnet add package Aspectly.Bridge.CefSharp
```

## Usage

```csharp
using Aspectly.Bridge;
using Aspectly.Bridge.CefSharp;
using CefSharp.Wpf;

// Create browser
var browser = new ChromiumWebBrowser("https://your-app.com");

// Create bridge
var browserBridge = new CefSharpBrowserBridge(browser);
var bridge = new BridgeHost(browserBridge);

// Register handlers
bridge.RegisterHandler<MyParams, MyResult>("myMethod", async (p) => {
    return new MyResult { Value = p.Input * 2 };
});

// Initialize
await bridge.InitializeAsync();

// Call JS methods
var result = await bridge.SendAsync<JsResult>("jsMethod", new { data = "hello" });
```

## Requirements

- .NET 8.0 (Windows) or .NET Framework 4.8
- CefSharp.Wpf

CefSharp is the **Windows-only** host; the web content auto-detects it through
the `@aspectly/transports` CefSharp transport (`window.CefSharp.PostMessage`,
priority 100).

## Other platforms

`Aspectly.Bridge.CefSharp` is one host of an 8-family bridge ecosystem (all at
version **2.1.0**). The same protocol ships for:

- **Web (iframe/popup)** — `@aspectly/web` (npm)
- **React Native** — `@aspectly/react-native` (npm)
- **React Native Web / Expo** — `@aspectly/react-native-web` (npm)
- **.NET (CefSharp/WebView2, Windows)** — `Aspectly.Bridge.CefSharp` / `Aspectly.Bridge.WebView2` (NuGet)
- **iOS/macOS/visionOS** — `AspectlyBridge` + `AspectlyBridgeWebKit` (SwiftPM + CocoaPods)
- **Android** — `com.aspectly:aspectly-bridge-webview` (Maven Central)
- **Flutter** — `aspectly_bridge` (pub.dev)
- **Python (Linux/WebKitGTK)** — `aspectly-bridge` (PyPI)

See the [main README](../../README.md) for the full platform matrix.

## License

MIT
