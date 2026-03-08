# Aspectly.Bridge.CefSharp Example

A WPF application demonstrating bidirectional communication between C# and JavaScript using Aspectly.Bridge with CefSharp.

## Requirements

- Windows (WPF)
- .NET 8.0 SDK
- Visual Studio 2022 or `dotnet` CLI

## Running the Example

```bash
cd examples/dotnet
dotnet run
```

Or open in Visual Studio and press F5.

## What This Example Shows

### C# Side (MainWindow.xaml.cs)

Registers handlers that JavaScript can call:

```csharp
// Create the browser bridge
_browserBridge = new CefSharpBrowserBridge(Browser);
_bridgeHost = new BridgeHost(_browserBridge);

// Register handlers
_bridgeHost.RegisterHandler<string>("ping", async () => "pong");
_bridgeHost.RegisterHandler<EchoParams, string>("echo", async (p) => p.Message);
_bridgeHost.RegisterHandler<AddParams, int>("add", async (p) => p.A + p.B);

// Initialize and wait for JS
await _bridgeHost.InitializeAsync();

// Call JS methods
var result = await _bridgeHost.SendAsync<GreetResult>("greet", new { name = "C#" });
```

### JavaScript Side (wwwroot/index.html)

Uses `@aspectly/core` browser bundle:

```html
<script src="aspectly.js"></script>
<script>
  // Initialize with handlers that C# can call
  window.aspectlyBridge.init({
    greet: async (params) => {
      return { message: `Hello, ${params.name}!` };
    },
    getTime: async () => {
      return { time: new Date().toISOString() };
    }
  });

  // Call C# methods
  const result = await window.aspectlyBridge.send('ping');
  console.log(result); // "pong"
</script>
```

## Project Structure

```
examples/dotnet/
├── Aspectly.Bridge.Example.CefSharp.csproj
├── App.xaml / App.xaml.cs         # CefSharp initialization
├── MainWindow.xaml                 # WPF UI
├── MainWindow.xaml.cs              # Bridge setup and handlers
├── wwwroot/
│   ├── index.html                  # Demo page
│   └── aspectly.js                 # @aspectly/core browser bundle
└── README.md
```

## Features Demonstrated

1. **Handler Registration** - Both C# and JS register methods the other side can call
2. **Type-Safe Parameters** - Using record types for request/response DTOs
3. **Async/Await** - All calls are asynchronous
4. **Event Logging** - Real-time logging of bridge communication
5. **Status Indicators** - Visual feedback for connection state
