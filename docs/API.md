# API Reference

Complete API documentation for all Aspectly packages.

## Table of Contents

- [@aspectly/core](#aspectcore)
- [@aspectly/web](#aspectweb)
- [@aspectly/react-native](#aspectreact-native)
- [@aspectly/react-native-web](#aspectreact-native-web)
- [@aspectly/transports](#aspectlytransports)
- [Types](#types)

---

## @aspectly/core

The core package provides the bridge implementation for use inside iframes and WebViews.

### AspectlyBridge

The main class for creating a bridge instance inside embedded content.

```typescript
import { AspectlyBridge } from '@aspectly/core';

const bridge = new AspectlyBridge(options?: BridgeOptions);
```

#### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout` | `number` | `100000` | Handler execution timeout in milliseconds |

#### Methods

##### `init(handlers?: BridgeHandlers): Promise<boolean>`

Initialize the bridge with handlers for incoming requests.

```typescript
await bridge.init({
  methodName: async (params) => {
    // Handle request
    return { result: 'value' };
  }
});
```

##### `send<T>(method: string, params?: object): Promise<T>`

Send a request to the host context.

```typescript
const result = await bridge.send<{ name: string }>('getUserData', { id: 123 });
```

##### `supports(method: string): boolean`

Check if a method is supported by the host.

##### `isAvailable(): boolean`

Check if the bridge is initialized and ready.

##### `subscribe(listener: BridgeListener): number`

Subscribe to all result events.

##### `unsubscribe(listener: BridgeListener): void`

Unsubscribe from result events.

##### `destroy(): void`

Cleanup bridge subscriptions.

##### `reset(): void`

Reset bridge state (clears pending requests, supported methods, and availability).

---

## @aspectly/web

React hooks for iframe and popup window communication in web applications.

### useAspectlyIframe

```typescript
import { useAspectlyIframe } from '@aspectly/web';

const [bridge, loaded, IframeComponent] = useAspectlyIframe({
  url: 'https://widget.example.com',
  timeout: 100000 // optional
});
```

#### Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `url` | `string` | Yes | URL to load in the iframe |
| `timeout` | `number` | No | Handler execution timeout |

#### Returns

| Index | Type | Description |
|-------|------|-------------|
| 0 | `BridgeBase` | Bridge instance |
| 1 | `boolean` | Loading state |
| 2 | `FunctionComponent` | iframe component |

### useAspectlyWindow

```typescript
import { useAspectlyWindow } from '@aspectly/web';

const [bridge, loaded, open, close, isOpen] = useAspectlyWindow({
  url: 'https://popup.example.com',
  features: 'width=800,height=600', // optional
  target: '_blank', // optional, default: '_blank'
  timeout: 100000 // optional
});
```

#### Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `url` | `string` | Yes | URL to open in the popup window |
| `features` | `string` | No | Window features string (e.g., 'width=800,height=600') |
| `target` | `string` | No | Window target name (default: '_blank') |
| `timeout` | `number` | No | Handler execution timeout |

#### Returns

| Index | Type | Description |
|-------|------|-------------|
| 0 | `BridgeBase` | Bridge instance |
| 1 | `boolean` | Whether the window has loaded |
| 2 | `() => void` | Function to open the popup window |
| 3 | `() => void` | Function to close the popup window |
| 4 | `boolean` | Whether the window is currently open |

---

## @aspectly/react-native

React hooks for React Native WebView integration.

### useAspectlyWebView

```typescript
import { useAspectlyWebView } from '@aspectly/react-native';

const [bridge, loaded, WebViewComponent] = useAspectlyWebView({
  url: 'https://webapp.example.com',
  timeout: 100000 // optional
});
```

Same API as `@aspectly/web` but renders a WebView instead of iframe.

---

## @aspectly/react-native-web

Universal hooks for Expo and React Native Web apps.

### useAspectlyWebView

```typescript
import { useAspectlyWebView } from '@aspectly/react-native-web';
```

Same API, works on Web (iframe), iOS and Android (WebView).

---

## @aspectly/transports

Transport layer for platform detection and cross-environment messaging.

### Transport Interface

Core interface implemented by all transports:

```typescript
interface Transport {
  readonly name: string;
  isAvailable(): boolean;
  send(message: string): void;
  subscribe(listener: TransportListener): TransportUnsubscribe;
}

type TransportListener = (message: string) => void;
type TransportUnsubscribe = () => void;
```

### detectTransport

Automatically detect and return the appropriate transport for the current environment:

```typescript
import { detectTransport } from '@aspectly/transports';

const transport = detectTransport();
console.log(transport.name); // 'cefsharp', 'react-native', 'iframe', 'window', 'postmessage', or 'null'

// Send a message
transport.send(JSON.stringify({ type: 'hello' }));

// Subscribe to messages
const unsubscribe = transport.subscribe((message) => {
  console.log('Received:', message);
});

// Cleanup
unsubscribe();
```

### Built-in Transports

| Transport | Detection | Priority | Use Case |
|-----------|-----------|----------|----------|
| CefSharpTransport | `window.CefSharp.PostMessage` | 100 | Desktop apps with CefSharp (.NET) |
| ReactNativeTransport | `window.ReactNativeWebView.postMessage` | 90 | React Native WebView |
| IframeTransport | `window.parent !== window` | 80 | Web content in iframes |
| WindowTransport | `window.addEventListener('message')` | 70 | Popup window communication |
| PostMessageTransport | `window.postMessage` | 10 | Generic postMessage fallback |
| NullTransport | Always available | - | Fallback for SSR/testing |

### TransportRegistry

Global registry for managing custom transports:

```typescript
import { TransportRegistry, registerTransport } from '@aspectly/transports';

// Register custom transport
registerTransport({
  name: 'electron',
  priority: 150, // Higher = checked first
  detect: () => !!window.electron,
  createTransport: () => new ElectronTransport(),
});

// Force re-detection (ignores cache)
const transport = TransportRegistry.detect(true);

// Clear cached transport
TransportRegistry.clearCache();

// Reset to default state
TransportRegistry.reset();
```

### TransportDetector Interface

Used for registering custom transports:

```typescript
interface TransportDetector {
  readonly name: string;
  readonly priority: number;
  detect(): boolean;
  createTransport(): Transport;
}
```

### BaseTransport

Abstract base class with SSR-safe helpers:

```typescript
import { BaseTransport } from '@aspectly/transports';

class CustomTransport extends BaseTransport {
  readonly name = 'custom';

  isAvailable(): boolean {
    // Use helper methods for SSR safety
    if (!this.hasWindow()) return false;
    const win = this.getWindow();
    return win?.customAPI !== undefined;
  }

  // ... implement send() and subscribe()
}
```

---

## Types

### BridgeErrorType

```typescript
enum BridgeErrorType {
  METHOD_EXECUTION_TIMEOUT = 'METHOD_EXECUTION_TIMEOUT',
  UNSUPPORTED_METHOD = 'UNSUPPORTED_METHOD',
  REJECTED = 'REJECTED',
  BRIDGE_NOT_AVAILABLE = 'BRIDGE_NOT_AVAILABLE',
}
```

### BridgeHandlers

```typescript
interface BridgeHandlers {
  [key: string]: (params: object) => Promise<unknown>;
}
```

### BridgeResultError

```typescript
interface BridgeResultError {
  error_type: BridgeErrorType;
  error_message?: string;
}
```
