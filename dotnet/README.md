# Aspectly .NET

[![NuGet version](https://img.shields.io/nuget/v/Aspectly.Bridge?style=flat-square&logo=nuget&color=004880)](https://www.nuget.org/packages/Aspectly.Bridge)
[![NuGet downloads](https://img.shields.io/nuget/dt/Aspectly.Bridge?style=flat-square&color=22c55e)](https://www.nuget.org/packages/Aspectly.Bridge)
[![CI](https://img.shields.io/github/actions/workflow/status/JeanIsahakyan/aspectly/ci.yml?style=flat-square&logo=github-actions&logoColor=white&label=CI)](https://github.com/JeanIsahakyan/aspectly/actions)

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

## BridgeHost Constructor

```csharp
// Full signature with optional parameters
var bridge = new BridgeHost(
    browserBridge,       // IBrowserBridge (required)
    logger: logger,      // ILogger? (optional)
    timeoutMs: 30000     // int? (optional, default: 100000ms / 100s)
);
```

The `timeoutMs` parameter controls the handler execution timeout. If a handler does not complete within the specified time, the request is rejected with a timeout error.

## Initialization

`InitializeAsync()` awaits the `InitResult` message from the JS side (not fire-and-forget). The `HandleInitAsync` method only sends `InitResult` back to JS (not both `Init` and `InitResult`).

```csharp
// Standard initialization (registers handlers first, then initializes)
bridge.RegisterHandler<object, object>("getData", async _ => new { value = 42 });
await bridge.InitializeAsync();

// Or initialize with handlers in one call
await bridge.InitializeAsync(new Dictionary<string, Delegate>
{
    ["getData"] = async (object _) => new { value = 42 }
});
```

## Building

```bash
dotnet build Aspectly.sln
dotnet test
```
