# @aspectly/core

[![npm version](https://img.shields.io/npm/v/@aspectly/core?style=flat-square&logo=npm&color=cb3837)](https://www.npmjs.com/package/@aspectly/core)
[![npm downloads](https://img.shields.io/npm/dm/@aspectly/core?style=flat-square&color=22c55e)](https://www.npmjs.com/package/@aspectly/core)
[![CI](https://img.shields.io/github/actions/workflow/status/JeanIsahakyan/aspectly/ci.yml?style=flat-square&logo=github-actions&logoColor=white&label=CI)](https://github.com/JeanIsahakyan/aspectly/actions)

The core bridge framework for cross-platform communication between WebViews, iframes, and web applications.

## Installation

```bash
# npm
npm install @aspectly/core

# pnpm
pnpm add @aspectly/core

# yarn
yarn add @aspectly/core
```

## Overview

`@aspectly/core` provides the foundational bridge communication layer that enables bidirectional message passing between different execution contexts:

- **WebView ↔ React Native**: Communication between web content and React Native apps
- **iframe ↔ Parent Window**: Communication between iframes and their parent pages
- **Browser Context**: Standalone browser usage with global bridge instance

`@aspectly/core` is the **web side** of the bridge. The exact same code runs **unchanged across every native host** — Web (iframe/popup), React Native, .NET (CefSharp/WebView2), iOS/macOS, Android, Flutter, and Linux/WebKitGTK. The correct host transport is **auto-detected at runtime** via [`@aspectly/transports`](../transports) (priorities: `cefsharp` 100 > `webkit` 95 > `react-native` 90 > `android` 85 > `flutter` 84 > `iframe` 80 > `window` 70 > `postmessage` 10), so your embedded web app never needs host-specific branches.

## Quick Start

### Inside a WebView or iframe

```typescript
import { AspectlyBridge } from '@aspectly/core';

// Create a bridge instance
const bridge = new AspectlyBridge();

// Initialize with handlers for incoming requests
await bridge.init({
  greet: async (params: { name: string }) => {
    return { message: `Hello, ${params.name}!` };
  },
  getData: async () => {
    return { timestamp: Date.now() };
  },
});

// Send requests to the parent container
const result = await bridge.send('parentMethod', { data: 'value' });
console.log(result);
```

### Browser Script Tag Usage

```html
<script src="https://unpkg.com/@aspectly/core/dist/browser.js"></script>
<script>
  window.aspectlyBridge.init({
    greet: async (params) => ({ message: `Hello, ${params.name}!` })
  }).then(() => {
    console.log('Bridge initialized');
  });
</script>
```

## API Reference

### AspectlyBridge

The main class for bridge communication.

#### Constructor

```typescript
const bridge = new AspectlyBridge(options?: BridgeOptions);
```

**Options:**
- `timeout?: number` - Handler execution timeout in ms (default: 100000)

#### Methods

##### `init(handlers?: BridgeHandlers): Promise<boolean>`

Initialize the bridge with handlers for incoming requests. The returned promise resolves only when both `Init` and `InitResult` messages have been exchanged (via `tryResolveInit`), ensuring the full handshake is complete.

```typescript
await bridge.init({
  methodName: async (params) => {
    // Handle request and return result
    return { success: true };
  },
});
```

##### `send<T>(method: string, params?: object): Promise<T>`

Send a request to the other side.

```typescript
const result = await bridge.send<{ data: string }>('getData', { id: 123 });
```

##### `supports(method: string): boolean`

Check if a method is supported by the other side.

```typescript
if (bridge.supports('getData')) {
  const data = await bridge.send('getData');
}
```

##### `isAvailable(): boolean`

Check if the bridge is initialized and ready.

```typescript
if (bridge.isAvailable()) {
  // Bridge is ready
}
```

##### `subscribe(listener: BridgeListener): number`

Subscribe to all result events for monitoring/debugging.

```typescript
bridge.subscribe((result) => {
  console.log('Event:', result.method, result.data);
});
```

##### `registerHandler(method: string, handler: (params: object) => Promise<unknown>): void`

Register a handler for incoming requests after initialization.

```typescript
bridge.registerHandler('newMethod', async (params) => {
  return { result: 'value' };
});
```

##### `unregisterHandler(method: string): void`

Remove a previously registered handler.

```typescript
bridge.unregisterHandler('newMethod');
```

##### `unsubscribe(listener: BridgeListener): void`

Remove a result event listener.

##### `destroy(): void`

Cleanup bridge subscriptions.

```typescript
bridge.destroy();
```

## Error Handling

The bridge provides typed errors for different failure scenarios:

```typescript
import { BridgeErrorType } from '@aspectly/core';

try {
  await bridge.send('unknownMethod');
} catch (error) {
  switch (error.error_type) {
    case BridgeErrorType.UNSUPPORTED_METHOD:
      console.log('Method not registered');
      break;
    case BridgeErrorType.METHOD_EXECUTION_TIMEOUT:
      console.log('Handler timed out');
      break;
    case BridgeErrorType.REJECTED:
      console.log('Handler threw error:', error.error_message);
      break;
    case BridgeErrorType.BRIDGE_NOT_AVAILABLE:
      console.log('Bridge not initialized');
      break;
  }
}
```

## Architecture

The package consists of four layers:

1. **BridgeCore** - Low-level platform detection and message serialization
2. **BridgeInternal** - Protocol management and request/response lifecycle
3. **BridgeBase** - Clean public API interface
4. **AspectlyBridge** - Main entry point composing all layers

## Native hosts

The same `@aspectly/core` web code talks to native hosts on every supported platform family, with the transport selected automatically by [`@aspectly/transports`](../transports):

- **Web** (iframe/popup), **React Native**, and **React Native Web/Expo** — npm packages
- **.NET** (CefSharp / WebView2, Windows) — NuGet
- **iOS/macOS/visionOS** — SwiftPM + CocoaPods (`AspectlyBridge`, `AspectlyBridgeWebKit`)
- **Android** — Maven Central (`io.github.jeanisahakyan:aspectly-bridge-webview`)
- **Flutter** (Dart) — pub.dev (`aspectly_bridge`)
- **Linux/WebKitGTK** (Python) — PyPI (`aspectly-bridge`, reuses the WebKit transport)

See the [main README](../../README.md) for the full host matrix, install commands, and native host APIs.

## Related Packages

- [`@aspectly/web`](../web) - Web/iframe integration with React hooks
- [`@aspectly/react-native`](../react-native) - React Native WebView integration
- [`@aspectly/react-native-web`](../react-native-web) - React Native Web + iframe support
- [`@aspectly/transports`](../transports) - Transport layer with native host auto-detection

## License

MIT
