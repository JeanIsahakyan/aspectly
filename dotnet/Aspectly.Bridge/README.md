# Aspectly.Bridge

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

## License

MIT
