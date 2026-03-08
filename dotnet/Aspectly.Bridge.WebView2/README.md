# Aspectly.Bridge.WebView2

WebView2 browser bridge for [Aspectly](https://github.com/JeanIsahakyan/aspectly) - enables bidirectional communication with JavaScript via Microsoft Edge WebView2.

## Installation

```bash
dotnet add package Aspectly.Bridge.WebView2
```

## Usage

```csharp
using Aspectly.Bridge;
using Aspectly.Bridge.WebView2;
using Microsoft.Web.WebView2.Wpf;

// Create WebView2 control
var webView = new WebView2();
webView.Source = new Uri("https://your-app.com");

// Wait for CoreWebView2 initialization
await webView.EnsureCoreWebView2Async();

// Create bridge
var browserBridge = new WebView2BrowserBridge(webView);
var bridge = new BridgeHost(browserBridge);

// Register handlers for incoming JavaScript calls
bridge.RegisterHandler<MyParams, MyResult>("myMethod", async (p) => {
    return new MyResult { Value = p.Input * 2 };
});

// Initialize the bridge
await bridge.InitializeAsync();

// Call JavaScript methods from C#
var result = await bridge.SendAsync<JsResult>("jsMethod", new { data = "hello" });
Console.WriteLine($"JS returned: {result.Value}");
```

### WPF XAML Example

```xml
<Window x:Class="MyApp.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:wv2="clr-namespace:Microsoft.Web.WebView2.Wpf;assembly=Microsoft.Web.WebView2.Wpf">
    <Grid>
        <wv2:WebView2 x:Name="webView" Source="https://your-app.com"/>
    </Grid>
</Window>
```

```csharp
public partial class MainWindow : Window
{
    private BridgeHost? _bridge;

    public MainWindow()
    {
        InitializeComponent();
        InitializeBridgeAsync();
    }

    private async Task InitializeBridgeAsync()
    {
        // Wait for WebView2 to initialize
        await webView.EnsureCoreWebView2Async();

        // Create bridge
        var browserBridge = new WebView2BrowserBridge(webView);
        _bridge = new BridgeHost(browserBridge);

        // Register handlers
        _bridge.RegisterHandler<string, string>("echo", async (input) => {
            return $"Echo: {input}";
        });

        await _bridge.InitializeAsync();
    }

    protected override void OnClosed(EventArgs e)
    {
        _bridge?.Dispose();
        base.OnClosed(e);
    }
}
```

## API

### WebView2BrowserBridge

Implementation of `IBrowserBridge` for Microsoft Edge WebView2.

#### Constructor

```csharp
public WebView2BrowserBridge(Microsoft.Web.WebView2.Wpf.WebView2 webView)
```

**Parameters:**
- `webView` - The WebView2 control instance

**Throws:**
- `ArgumentNullException` if `webView` is null

#### Properties

```csharp
public bool IsReady { get; }
```

Returns `true` when `CoreWebView2` is initialized and ready for communication.

#### Events

```csharp
public event EventHandler<BrowserMessageEventArgs>? MessageReceived;
```

Fires when a message is received from JavaScript via `window.chrome.webview.postMessage()`.

#### Methods

##### ExecuteScriptAsync

```csharp
public async Task ExecuteScriptAsync(string script)
```

Execute JavaScript code in the WebView2 context.

**Parameters:**
- `script` - JavaScript code to execute

**Throws:**
- `InvalidOperationException` if CoreWebView2 is not initialized

**Example:**
```csharp
await browserBridge.ExecuteScriptAsync("console.log('Hello from C#')");
```

##### Dispose

```csharp
public void Dispose()
```

Cleanup resources and unsubscribe from WebView2 events.

## Requirements

### Runtime Requirements

- **.NET 8.0** (Windows) or **.NET Framework 4.8**
- **Microsoft Edge WebView2 Runtime** - Automatically installed on Windows 11, or download from [Microsoft](https://developer.microsoft.com/microsoft-edge/webview2/)

### NuGet Dependencies

This package requires:
- `Aspectly.Bridge` (core bridge protocol)
- `Microsoft.Web.WebView2` (WebView2 SDK)

Install WebView2 SDK separately:
```bash
dotnet add package Microsoft.Web.WebView2
```

## WebView2 Runtime

The WebView2 Runtime is required to run applications using this package. It comes pre-installed on Windows 11 and recent Windows 10 updates.

### Runtime Installation

**For end users:**
- Download the [Evergreen Standalone Installer](https://go.microsoft.com/fwlink/p/?LinkId=2124703)

**For developers:**
- Use the Fixed Version runtime for testing
- Bundle the runtime with your application installer

**Runtime detection:**
```csharp
using Microsoft.Web.WebView2.Core;

var version = CoreWebView2Environment.GetAvailableBrowserVersionString();
Console.WriteLine($"WebView2 Runtime: {version}");
```

## JavaScript Side

In your web application, use `@aspectly/core` to communicate with C#:

```typescript
import { AspectlyBridge } from '@aspectly/core';

const bridge = new AspectlyBridge();

// Initialize with handlers
await bridge.init({
  jsMethod: async (params) => {
    return { value: `Received: ${params.data}` };
  }
});

// Call C# methods
const result = await bridge.send('myMethod', { input: 42 });
console.log(result.Value); // 84
```

WebView2 uses `window.chrome.webview.postMessage()` for communication, which is automatically detected by `@aspectly/core`.

## License

MIT
