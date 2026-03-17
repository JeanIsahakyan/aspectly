# @aspectly/transports

[![npm version](https://img.shields.io/npm/v/@aspectly/transports?style=flat-square&logo=npm&color=cb3837)](https://www.npmjs.com/package/@aspectly/transports)
[![npm downloads](https://img.shields.io/npm/dm/@aspectly/transports?style=flat-square&color=22c55e)](https://www.npmjs.com/package/@aspectly/transports)

Transport layer for cross-platform communication between WebViews, iframes, and web applications.

## Installation

```bash
# npm
npm install @aspectly/transports

# pnpm
pnpm add @aspectly/transports

# yarn
yarn add @aspectly/transports
```

## Overview

`@aspectly/transports` provides a flexible abstraction layer for platform detection and message passing across different execution contexts. It automatically detects the current environment (CefSharp, React Native WebView, iframe, or browser) and provides a unified API for bidirectional communication.

### Built-in Transports

| Transport | Detection | Priority | Use Case |
|-----------|-----------|----------|----------|
| **CefSharpTransport** | `window.CefSharp.PostMessage` | 100 | Desktop apps with CefSharp (Chromium Embedded Framework for .NET) |
| **ReactNativeTransport** | `window.ReactNativeWebView.postMessage` | 90 | React Native WebView |
| **IframeTransport** | `window.parent !== window` | 80 | Web content inside iframes |
| **NullTransport** | Always available | - | Fallback for SSR/testing (no-op) |

### Auto-Detection

The `TransportRegistry` automatically selects the appropriate transport based on priority order. Higher priority transports are checked first, ensuring the most specific transport is used.

## Quick Start

### Auto-Detection (Recommended)

```typescript
import { detectTransport } from '@aspectly/transports';

// Automatically detect the current environment
const transport = detectTransport();
console.log(`Using transport: ${transport.name}`); // 'cefsharp', 'react-native', 'iframe', or 'null'

// Send a message
transport.send(JSON.stringify({ type: 'hello', data: 'world' }));

// Subscribe to incoming messages
const unsubscribe = transport.subscribe((message) => {
  const data = JSON.parse(message);
  console.log('Received:', data);
});

// Cleanup when done
unsubscribe();
```

### Direct Transport Usage

```typescript
import { CefSharpTransport } from '@aspectly/transports';

const transport = new CefSharpTransport();

if (transport.isAvailable()) {
  transport.send(JSON.stringify({ method: 'getData' }));
}
```

### Custom Transport Registration

```typescript
import { registerTransport, detectTransport } from '@aspectly/transports';

// Register a custom transport with high priority
registerTransport({
  name: 'electron',
  priority: 150, // Higher than CefSharp (100)
  detect: () => {
    return typeof window !== 'undefined' &&
           window.electron?.send !== undefined;
  },
  createTransport: () => new ElectronTransport(),
});

// Now auto-detection will check your custom transport first
const transport = detectTransport();
```

## API Reference

### Transport Interface

The core interface implemented by all transports:

```typescript
interface Transport {
  readonly name: string;
  isAvailable(): boolean;
  send(message: string): void;
  subscribe(listener: TransportListener): TransportUnsubscribe;
}
```

**Properties:**
- `name` - Unique identifier for the transport (e.g., 'cefsharp', 'react-native')

**Methods:**
- `isAvailable()` - Check if the transport is available in the current environment
- `send(message: string)` - Send a message to the parent/host context
- `subscribe(listener)` - Subscribe to incoming messages, returns cleanup function

### Types

```typescript
// Message listener callback
type TransportListener = (message: string) => void;

// Cleanup function returned by subscribe
type TransportUnsubscribe = () => void;

// Factory function for creating transports
type TransportFactory = () => Transport;
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

**Properties:**
- `name` - Transport identifier
- `priority` - Detection priority (higher values checked first)

**Methods:**
- `detect()` - Return `true` if this transport is available
- `createTransport()` - Create and return a transport instance

### BaseTransport Class

Abstract base class providing common functionality:

```typescript
abstract class BaseTransport implements Transport {
  abstract readonly name: string;
  abstract isAvailable(): boolean;
  abstract send(message: string): void;
  abstract subscribe(listener: TransportListener): TransportUnsubscribe;

  protected hasWindow(): boolean;
  protected getWindow(): Window | null;
}
```

**Protected Helpers:**
- `hasWindow()` - Check if `window` is defined (SSR-safe)
- `getWindow()` - Safely get the `window` object or `null`

### TransportRegistry

Global registry for managing transport detectors:

```typescript
class TransportRegistry {
  register(detector: TransportDetector): void;
  unregister(name: string): void;
  getDetectors(): readonly TransportDetector[];
  detect(forceRedetect?: boolean): Transport;
  clearCache(): void;
  reset(): void;
}
```

**Methods:**
- `register(detector)` - Register a custom transport detector
- `unregister(name)` - Remove a detector by name
- `getDetectors()` - Get all registered detectors
- `detect(forceRedetect?)` - Detect and return the appropriate transport (cached)
- `clearCache()` - Clear the cached transport
- `reset()` - Reset to default state (built-in detectors only)

### Convenience Functions

```typescript
// Detect the current transport
function detectTransport(forceRedetect?: boolean): Transport;

// Register a custom detector
function registerTransport(detector: TransportDetector): void;
```

## Built-in Transports

### CefSharpTransport

For desktop applications using [CefSharp](https://cefsharp.github.io/) (Chromium Embedded Framework for .NET).

**Detection:** Checks for `window.CefSharp.PostMessage`
**Priority:** 100 (highest)

```typescript
import { CefSharpTransport } from '@aspectly/transports';

const transport = new CefSharpTransport();
transport.send(JSON.stringify({ action: 'openFile' }));

const unsubscribe = transport.subscribe((message) => {
  console.log('From C#:', message);
});
```

**Messaging:**
- Sends messages via `window.CefSharp.PostMessage(message)`
- Receives messages via `window.postMessage` events

### ReactNativeTransport

For web content running inside [React Native WebView](https://github.com/react-native-webview/react-native-webview).

**Detection:** Checks for `window.ReactNativeWebView.postMessage`
**Priority:** 90

```typescript
import { ReactNativeTransport } from '@aspectly/transports';

const transport = new ReactNativeTransport();
transport.send(JSON.stringify({ action: 'navigate' }));
```

**Messaging:**
- Sends messages via `window.ReactNativeWebView.postMessage(message)`
- Messages are wrapped in quotes for iOS compatibility: `'${message}'`
- Receives messages via `window.postMessage` events

### IframeTransport

For web content running inside an iframe.

**Detection:** Checks if `window.parent !== window`
**Priority:** 80

```typescript
import { IframeTransport } from '@aspectly/transports';

// Default: sends to any origin ('*')
const transport = new IframeTransport();

// Specify target origin for security
const secureTransport = new IframeTransport('https://parent-domain.com');

transport.send(JSON.stringify({ type: 'ready' }));
```

**Constructor:**
- `new IframeTransport(targetOrigin?: string)` - Default: `'*'`

**Messaging:**
- Sends messages via `window.parent.postMessage(message, targetOrigin)`
- Receives messages via `window.postMessage` events

### NullTransport

Fallback transport that performs no operations. Used when no other transport is available (e.g., SSR, testing).

**Priority:** Always available (fallback)

```typescript
import { NullTransport } from '@aspectly/transports';

const transport = new NullTransport();
transport.isAvailable(); // true
transport.send('message'); // No-op (logs warning in development)
transport.subscribe(() => {}); // Returns no-op cleanup function
```

**Behavior:**
- `isAvailable()` always returns `true`
- `send()` is a no-op (logs warning in development mode)
- `subscribe()` returns a no-op cleanup function

## Creating Custom Transports

### Example: Electron Transport

```typescript
import { BaseTransport, registerTransport } from '@aspectly/transports';
import type { TransportListener, TransportUnsubscribe } from '@aspectly/transports';

// Extend BaseTransport for helper methods
class ElectronTransport extends BaseTransport {
  readonly name = 'electron';

  isAvailable(): boolean {
    const win = this.getWindow();
    return typeof win?.electron?.send === 'function';
  }

  send(message: string): void {
    const win = this.getWindow();
    if (!win?.electron?.send) {
      console.warn('[ElectronTransport] electron.send not available');
      return;
    }
    win.electron.send('message', message);
  }

  subscribe(listener: TransportListener): TransportUnsubscribe {
    const win = this.getWindow();
    if (!win?.electron?.on) {
      return () => {};
    }

    const handler = (_event: any, message: string) => {
      listener(message);
    };

    win.electron.on('message', handler);
    return () => {
      win.electron?.removeListener('message', handler);
    };
  }
}

// Register with high priority
registerTransport({
  name: 'electron',
  priority: 150,
  detect: () => {
    return typeof window !== 'undefined' &&
           window.electron?.send !== undefined;
  },
  createTransport: () => new ElectronTransport(),
});
```

### Implementation Checklist

When creating a custom transport:

1. ✓ Extend `BaseTransport` or implement `Transport` interface
2. ✓ Provide unique `name` property
3. ✓ Implement `isAvailable()` to check environment
4. ✓ Implement `send()` to send messages
5. ✓ Implement `subscribe()` to receive messages
6. ✓ Return cleanup function from `subscribe()`
7. ✓ Handle SSR/missing globals safely
8. ✓ Create a `TransportDetector` for registration
9. ✓ Set appropriate `priority` (higher = checked first)

## Related Packages

- [`@aspectly/core`](../core) - Core bridge protocol and message handling
- [`@aspectly/web`](../web) - Web/iframe integration with React hooks
- [`@aspectly/react-native`](../react-native) - React Native WebView integration
- [`@aspectly/react-native-web`](../react-native-web) - Universal React Native Web support

## License

MIT
