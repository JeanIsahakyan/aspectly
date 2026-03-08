# Aspectly .NET

.NET implementation of the Aspectly bridge protocol.

## Packages

| Package | Description |
|---------|-------------|
| `Aspectly.Bridge` | Core library (no browser dependencies) |
| `Aspectly.Bridge.CefSharp` | CefSharp (Chromium) integration |
| `Aspectly.Bridge.WebView2` | Microsoft Edge WebView2 integration |

## Quick Start

```bash
# For CefSharp
dotnet add package Aspectly.Bridge.CefSharp

# For WebView2
dotnet add package Aspectly.Bridge.WebView2
```

```csharp
// CefSharp
var browserBridge = new CefSharpBrowserBridge(chromiumWebBrowser);
var bridge = new BridgeHost(browserBridge);

// WebView2
var browserBridge = new WebView2BrowserBridge(webView2);
var bridge = new BridgeHost(browserBridge);

// Register handlers & use
bridge.RegisterHandler<Params, Result>("method", async p => new Result());
await bridge.InitializeAsync();
var result = await bridge.SendAsync<Result>("jsMethod", new { });
```

## Building

```bash
dotnet build Aspectly.sln
dotnet test
```
