# Aspectly.Bridge

[![NuGet version](https://img.shields.io/nuget/v/Aspectly.Bridge?style=flat-square&logo=nuget&color=004880)](https://www.nuget.org/packages/Aspectly.Bridge)
[![NuGet downloads](https://img.shields.io/nuget/dt/Aspectly.Bridge?style=flat-square&color=22c55e)](https://www.nuget.org/packages/Aspectly.Bridge)

Core bridge library for [Aspectly](https://github.com/JeanIsahakyan/aspectly) - bidirectional communication between .NET and JavaScript via the Aspectly protocol.

## Installation

```bash
dotnet add package Aspectly.Bridge
```

For browser-specific implementations, also install one of:
- `Aspectly.Bridge.CefSharp` - For CefSharp (Chromium Embedded Framework)
- `Aspectly.Bridge.WebView2` - For Microsoft Edge WebView2

## Usage

```csharp
using Aspectly.Bridge;

// Create with your browser bridge implementation
var bridge = new BridgeHost(browserBridge);

// Register handlers that JS can call
bridge.RegisterHandler<MyParams, MyResult>("myMethod", async (p) => {
    return new MyResult { Value = p.Input * 2 };
});

// Initialize the bridge
await bridge.InitializeAsync();

// Call methods on JS side
var result = await bridge.SendAsync<JsResult>("jsMethod", new { data = "hello" });
```

## Creating Custom Browser Bridge

Implement `IBrowserBridge` to support any browser control:

```csharp
public class MyBrowserBridge : IBrowserBridge
{
    public bool IsReady => /* check if browser is ready */;

    public event EventHandler<BrowserMessageEventArgs>? MessageReceived;

    public Task ExecuteScriptAsync(string script)
    {
        // Execute JavaScript in the browser
    }

    public void Dispose() { }
}
```

## Other platforms

`Aspectly.Bridge` is the .NET core of an 8-family bridge ecosystem (all at
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
