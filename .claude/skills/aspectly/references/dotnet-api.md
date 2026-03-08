# .NET API Reference

Target frameworks: .NET Standard 2.0, .NET Framework 4.8, .NET 8.0, .NET 10.0

## Aspectly.Bridge (Core)

### BridgeHost

Main bridge class for .NET side. Implements `IDisposable`.

```csharp
public class BridgeHost : IDisposable
{
    // Constructor
    public BridgeHost(IBrowserBridge browserBridge, IBridgeLogger? logger = null);

    // Handler registration (call BEFORE InitializeAsync)
    public void RegisterHandler(string method, Func<JsonElement, Task<object?>> handler);
    public void RegisterHandler<TParams>(string method, Func<TParams, Task<object?>> handler);
    public void RegisterHandler<TParams, TResult>(string method, Func<TParams, Task<TResult>> handler);
    public void UnregisterHandler(string method);

    // Initialization
    public Task InitializeAsync();

    // Send request to JS side
    public Task<T?> SendAsync<T>(string method, object? parameters = null, int timeoutMs = 100000);

    // Send raw event
    public Task SendEventAsync(BridgeEventType type, object data);

    // Properties
    public bool IsInitialized { get; }
    public IReadOnlyCollection<string> SupportedMethods { get; }   // JS-side methods
    public IReadOnlyCollection<string> RegisteredMethods { get; }  // .NET-side handlers

    // Events
    public event EventHandler? Initialized;

    // Process incoming message (called by browser bridge)
    public Task ProcessMessageAsync(string message);

    // Cleanup
    public void Dispose();
}
```

### IBrowserBridge

Interface for browser control integration. Implement this for custom browser controls.

```csharp
public interface IBrowserBridge : IDisposable
{
    bool IsReady { get; }
    event EventHandler<BrowserMessageEventArgs> MessageReceived;
    Task ExecuteScriptAsync(string script);
}

public class BrowserMessageEventArgs : EventArgs
{
    public string Message { get; }
    public BrowserMessageEventArgs(string message);
}
```

### IBridgeLogger

Optional logging interface.

```csharp
public interface IBridgeLogger
{
    void Debug(string message);
    void Info(string message);
    void Warn(string message);
    void Error(string message, Exception? exception = null);
}
```

### BridgeException

```csharp
public class BridgeException : Exception
{
    public BridgeErrorType ErrorType { get; }
    public BridgeException(BridgeErrorType errorType, string message);
    public BridgeException(BridgeErrorType errorType, string message, Exception innerException);
}
```

---

## Protocol Types

All types use `[JsonPropertyName]` attributes for explicit JSON naming.

### BridgeEventType

```csharp
public enum BridgeEventType { Init, InitResult, Request, Result }
```

### BridgeErrorType

```csharp
public enum BridgeErrorType
{
    METHOD_EXECUTION_TIMEOUT,
    UNSUPPORTED_METHOD,
    REJECTED,
    BRIDGE_NOT_AVAILABLE
}
```

### BridgeResultType

```csharp
public enum BridgeResultType { Success, Error }
```

### Message Classes

```csharp
// Outer wrapper: { "type": "BridgeEvent", "event": { ... } }
public sealed class BridgeEventWrapper
{
    [JsonPropertyName("type")]   public string Type { get; set; }
    [JsonPropertyName("event")]  public JsonElement Event { get; set; }
}

// Inner event: { "type": "Request", "data": { ... } }
public sealed class BridgeEventPayload
{
    [JsonPropertyName("type")]  public BridgeEventType Type { get; set; }
    [JsonPropertyName("data")]  public JsonElement Data { get; set; }
}

// Init data: { "methods": ["a", "b"] }
public sealed class BridgeInitData
{
    [JsonPropertyName("methods")]  public string[] Methods { get; set; }
}

// Request data: { "method": "...", "params": {...}, "request_id": "..." }
public sealed class BridgeRequestData
{
    [JsonPropertyName("method")]      public string Method { get; set; }
    [JsonPropertyName("params")]      public JsonElement Params { get; set; }
    [JsonPropertyName("request_id")]  public string RequestId { get; set; }
}

// Result data: { "type": "Success|Error", "data": {...}, "error": {...}, "request_id": "..." }
public sealed class BridgeResultData
{
    [JsonPropertyName("type")]        public BridgeResultType Type { get; set; }
    [JsonPropertyName("data")]        public JsonElement? Data { get; set; }
    [JsonPropertyName("error")]       public BridgeResultError? Error { get; set; }
    [JsonPropertyName("method")]      public string? Method { get; set; }
    [JsonPropertyName("request_id")]  public string? RequestId { get; set; }
}

// Error details
public sealed class BridgeResultError
{
    [JsonPropertyName("error_type")]     public BridgeErrorType ErrorType { get; set; }
    [JsonPropertyName("error_message")]  public string? ErrorMessage { get; set; }
}
```

---

## Browser Bridge Implementations

### Aspectly.Bridge.CefSharp

```csharp
// Target: .NET 8.0-windows, .NET Framework 4.8
using Aspectly.Bridge.CefSharp;

var browserBridge = new CefSharpBrowserBridge(chromiumWebBrowser);
var bridge = new BridgeHost(browserBridge);
```

### Aspectly.Bridge.WebView2

```csharp
// Target: .NET 8.0-windows, .NET Framework 4.8
using Aspectly.Bridge.WebView2;

var browserBridge = new WebView2BrowserBridge(webView2Control);
var bridge = new BridgeHost(browserBridge);
```

---

## JSON Serialization

BridgeHost uses `System.Text.Json` with these options:

```csharp
var options = new JsonSerializerOptions
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    Converters = { new JsonStringEnumConverter() }
};
```

Messages sent to browser use double serialization (JSON string inside JS):
```csharp
var json = JsonSerializer.Serialize(wrapper, options);
var jsonString = JsonSerializer.Serialize(json);  // wraps in quotes, escapes with \u0022
var script = $"window.postMessage({jsonString}, '*');";
```

Note: `System.Text.Json` escapes `"` as `\u0022`, not `\"`. Keep this in mind when parsing scripts in tests.
