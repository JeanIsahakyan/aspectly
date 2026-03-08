# Aspectly Bridge Protocol

## Message Envelope

All messages use the same envelope format:

```json
{
  "type": "BridgeEvent",
  "event": {
    "type": "<EventType>",
    "data": { ... }
  }
}
```

The `type` field at the top level is always `"BridgeEvent"`. Messages with any other type are ignored.

## Event Types

### Init

Sent during initialization to exchange supported methods.

```json
{
  "type": "BridgeEvent",
  "event": {
    "type": "Init",
    "data": {
      "methods": ["methodA", "methodB"]
    }
  }
}
```

### InitResult

Response to Init, confirming initialization is complete.

```json
{
  "type": "BridgeEvent",
  "event": {
    "type": "InitResult",
    "data": true
  }
}
```

### Request

Method invocation from one side to the other.

```json
{
  "type": "BridgeEvent",
  "event": {
    "type": "Request",
    "data": {
      "method": "getUserData",
      "params": { "id": 123 },
      "request_id": "1"
    }
  }
}
```

### Result — Success

```json
{
  "type": "BridgeEvent",
  "event": {
    "type": "Result",
    "data": {
      "type": "Success",
      "data": { "name": "John" },
      "request_id": "1"
    }
  }
}
```

### Result — Error

```json
{
  "type": "BridgeEvent",
  "event": {
    "type": "Result",
    "data": {
      "type": "Error",
      "error": {
        "error_type": "REJECTED",
        "error_message": "Handler threw an error"
      },
      "request_id": "1"
    }
  }
}
```

## Initialization Flow

```
Embedded (iframe/WebView)              Host (parent/native)
        |                                    |
        |  ---- Init {methods: [...]} -----> |
        |                                    |  (registers supported methods)
        |  <--- Init {methods: [...]} ------ |
        |                                    |
        |  (registers supported methods)     |
        |  ---- InitResult (true) ---------> |
        |                                    |
        |  <--- InitResult (true) ---------- |
        |                                    |
        |  === Bridge Ready (both sides) === |
```

Both sides exchange their available methods during init. After both InitResult messages are exchanged, the bridge is ready for requests.

## Request-Response Flow

```
Side A                                 Side B
  |                                      |
  | --- Request {method, params, id} --> |
  |                                      | (executes handler)
  | <-- Result {type, data/error, id} -- |
  |                                      |
  | (resolves/rejects Promise)           |
```

Each request has a unique `request_id` that correlates the response.

## Error Types

| Error | Meaning |
|-------|---------|
| `UNSUPPORTED_METHOD` | Called method is not registered on the receiving side |
| `METHOD_EXECUTION_TIMEOUT` | Handler did not respond within timeout (default 100s) |
| `REJECTED` | Handler threw an exception during execution |
| `BRIDGE_NOT_AVAILABLE` | Attempted to send before bridge initialization |

## Transport-Specific Notes

### React Native WebView
- Messages are wrapped in single quotes for iOS compatibility: `'{"type":"BridgeEvent",...}'`
- Sent via `ReactNativeWebView.postMessage()`
- Received via `onMessage` (nativeEvent.data)

### Iframe
- Sent via `window.parent.postMessage(message, '*')`
- Received via `window.addEventListener('message')`
- Data is a plain JSON string (no quote wrapping)

### CefSharp (.NET)
- Sent from JS via `CefSharp.PostMessage(message)`
- Sent from .NET via `ExecuteScriptAsync("window.postMessage(...)")`
- .NET uses double serialization: `JsonSerializer.Serialize` of the JSON string, which escapes `"` as `\u0022`

### Popup Window
- Sent via `windowRef.postMessage(message, '*')`
- Received via `window.addEventListener('message')` with source check
- Same format as iframe, no quote wrapping
