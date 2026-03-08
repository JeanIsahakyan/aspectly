# Aspectly.Bridge.CefSharp

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

## License

MIT
