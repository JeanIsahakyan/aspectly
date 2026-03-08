---
name: aspectly
description: >
  Expert skill for writing code with the Aspectly bridge framework — bidirectional
  type-safe communication between JavaScript/TypeScript and native hosts (React Native
  WebView, iframe, popup window, .NET CefSharp/WebView2). Use this skill whenever the
  user works with Aspectly packages (@aspectly/core, @aspectly/web, @aspectly/react-native,
  @aspectly/react-native-web, @aspectly/transports, Aspectly.Bridge for .NET), writes
  bridge communication code, implements WebView-to-native messaging, creates iframe
  integrations, registers bridge handlers, or asks about the Aspectly protocol. Also
  trigger when you see imports from @aspectly/* or Aspectly.Bridge namespaces, or
  BridgeHost/AspectlyBridge/useAspectlyIframe/useAspectlyWebView in code.
---

# Aspectly Bridge Framework

Aspectly is a bidirectional, type-safe communication bridge between JavaScript/TypeScript
and native host contexts. It works across React Native WebView, web iframes, popup windows,
and .NET desktop apps (CefSharp, WebView2).

## Architecture

Five layers, bottom to top:

| Layer | Component | Role |
|-------|-----------|------|
| 0 | **Transport** (`@aspectly/transports`) | Platform detection, raw message passing |
| 1 | **BridgeCore** (`@aspectly/core`) | Message serialization, transport delegation |
| 2 | **BridgeInternal** (`@aspectly/core`) | Protocol logic, request/response lifecycle |
| 3 | **BridgeBase** (`@aspectly/core`) | Clean public API |
| 4 | **AspectlyBridge** / Hooks | Entry points for end users |

## Package Selection

| Use case | Package |
|----------|---------|
| Inside iframe or WebView (embedded content) | `@aspectly/core` |
| Parent page embedding an iframe | `@aspectly/web` (`useAspectlyIframe`) |
| Parent page with popup window | `@aspectly/web` (`useAspectlyWindow`) |
| React Native app with WebView | `@aspectly/react-native` |
| Universal (Expo / React Native Web) | `@aspectly/react-native-web` |
| Custom transport or platform detection | `@aspectly/transports` |
| .NET desktop with CefSharp | `Aspectly.Bridge` + `Aspectly.Bridge.CefSharp` |
| .NET desktop with WebView2 | `Aspectly.Bridge` + `Aspectly.Bridge.WebView2` |

## Common Patterns

### Embedded content (inside iframe/WebView)

```typescript
import { AspectlyBridge } from '@aspectly/core';

const bridge = new AspectlyBridge(); // options: { timeout?: number }

// Register handlers the host can call, then init
await bridge.init({
  greet: async (params: { name: string }) => ({ message: `Hello, ${params.name}!` }),
  calculate: async ({ a, b }: { a: number; b: number }) => ({ sum: a + b }),
});

// Call host methods
const user = await bridge.send<{ name: string }>('getUserData');

// Check availability
bridge.supports('hostMethod'); // boolean
bridge.isAvailable();          // boolean

// Listen to all results
const subId = bridge.subscribe((result) => console.log(result));
bridge.unsubscribe(listener);

// Cleanup
bridge.destroy();
```

### Host: iframe embedding (React)

```tsx
import { useAspectlyIframe } from '@aspectly/web';

function App() {
  const [bridge, loaded, IframeComponent] = useAspectlyIframe({
    url: 'https://widget.example.com',
    timeout: 100000, // optional
  });

  useEffect(() => {
    if (loaded) {
      bridge.init({
        getUserData: async () => ({ name: 'John', role: 'Admin' }),
      });
    }
  }, [loaded]);

  const callWidget = async () => {
    const result = await bridge.send<{ message: string }>('greet', { name: 'World' });
  };

  return <IframeComponent style={{ width: '100%', height: 400 }} />;
}
```

### Host: popup window (React)

```tsx
import { useAspectlyWindow } from '@aspectly/web';

function App() {
  const [bridge, loaded, openWindow, closeWindow, isOpen] = useAspectlyWindow({
    url: 'https://popup.example.com',
    features: 'width=800,height=600',
    target: '_blank',
  });

  useEffect(() => {
    if (loaded) bridge.init({ getData: async () => ({ user: 'John' }) });
  }, [loaded]);

  return (
    <div>
      <button onClick={openWindow}>Open</button>
      {isOpen && <button onClick={closeWindow}>Close</button>}
    </div>
  );
}
```

### Host: React Native WebView

```tsx
import { useAspectlyWebView } from '@aspectly/react-native';
// or for universal: import { useAspectlyWebView } from '@aspectly/react-native-web';

function App() {
  const [bridge, loaded, WebViewComponent] = useAspectlyWebView({
    url: 'https://webapp.example.com',
  });

  useEffect(() => {
    if (loaded) {
      bridge.init({
        getDeviceInfo: async () => ({ platform: Platform.OS }),
      });
    }
  }, [loaded]);

  return <WebViewComponent style={{ flex: 1 }} />;
}
```

### Host: .NET (CefSharp)

```csharp
using Aspectly.Bridge;
using Aspectly.Bridge.CefSharp;

var browserBridge = new CefSharpBrowserBridge(chromiumBrowser);
var bridge = new BridgeHost(browserBridge);

// Type-safe handler registration
bridge.RegisterHandler<RequestParams, ResponseData>("methodName", async (p) => {
    return new ResponseData { Value = p.Input * 2 };
});

// Simple handler (no typed params)
bridge.RegisterHandler("ping", async (_) => new { pong = true });

await bridge.InitializeAsync();

// Call JS methods
var result = await bridge.SendAsync<string>("jsMethod", new { data = "value" });

// Properties
bridge.IsInitialized    // bool
bridge.SupportedMethods // IReadOnlyCollection<string> (JS-side methods)
bridge.RegisteredMethods // IReadOnlyCollection<string> (.NET-side handlers)

// Event
bridge.Initialized += (sender, args) => { /* ready */ };

// Cleanup
bridge.Dispose();
```

## Error Handling

```typescript
import { BridgeErrorType } from '@aspectly/core';

try {
  await bridge.send('someMethod', params);
} catch (error) {
  // error has: error_type (BridgeErrorType), error_message (string)
  switch (error.error_type) {
    case BridgeErrorType.UNSUPPORTED_METHOD:   // method not registered on other side
    case BridgeErrorType.METHOD_EXECUTION_TIMEOUT: // handler didn't respond in time
    case BridgeErrorType.REJECTED:             // handler threw an error
    case BridgeErrorType.BRIDGE_NOT_AVAILABLE: // bridge not initialized
  }
}
```

.NET equivalent:
```csharp
try {
    await bridge.SendAsync<string>("method");
} catch (BridgeException ex) {
    // ex.ErrorType: BridgeErrorType enum
    // ex.Message: error description
}
```

## Custom Transports

```typescript
import { registerTransport, BaseTransport } from '@aspectly/transports';

class ElectronTransport extends BaseTransport {
  readonly name = 'electron';
  isAvailable() { return !!window.electronAPI; }
  send(message: string) { window.electronAPI.send('bridge', message); }
  subscribe(listener: TransportListener) {
    window.electronAPI.on('bridge', listener);
    return () => window.electronAPI.off('bridge', listener);
  }
}

registerTransport({
  name: 'electron',
  priority: 150,  // higher = checked first
  detect: () => !!window.electronAPI,
  createTransport: () => new ElectronTransport(),
});
```

Built-in transport priority: CefSharp (100) > ReactNative (90) > Iframe (80) > Window (70) > PostMessage (10) > Null (fallback).

## Protocol

Messages use envelope format: `{ "type": "BridgeEvent", "event": { "type": "<EventType>", "data": {...} } }`

Event types: `Init`, `InitResult`, `Request`, `Result`.

For full protocol details, read `references/protocol.md`.

## Detailed API Reference

- **JavaScript/TypeScript API**: Read `references/js-api.md` for complete class/hook signatures, all types, and transport details.
- **.NET API**: Read `references/dotnet-api.md` for BridgeHost, protocol types, browser bridge implementations.

## Key Rules When Writing Aspectly Code

1. Always `await bridge.init(handlers)` before calling `bridge.send()` — bridge must be initialized first.
2. Handlers are async functions: `async (params) => result`. Always return a value.
3. Use `bridge.supports('method')` to check if the other side registered a method before calling it.
4. The `loaded` flag from hooks indicates the iframe/WebView has loaded, not that the bridge is initialized. Call `bridge.init()` after `loaded` becomes true.
5. Default timeout is 100 seconds (100000ms). Override via `{ timeout: ms }` in constructor/hook options.
6. In .NET, `RegisterHandler` must be called before `InitializeAsync()` for the JS side to know about available methods.
7. `@aspectly/react-native-web` uses platform-specific files (`.native.ts` / `.ts`) — on native it re-exports from `@aspectly/react-native`, on web it uses iframe transport.
8. The `useAspectlyWindow` hook returns 5 items (not 3 like iframe/webview): `[bridge, loaded, open, close, isOpen]`.
9. `bridge.destroy()` cleans up transport subscriptions. Always call it on unmount for `AspectlyBridge` instances.
10. In .NET, `BridgeHost` implements `IDisposable` — use `using` or call `Dispose()`.
