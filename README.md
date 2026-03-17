# Aspectly

A powerful, type-safe communication bridge framework for React Native, Web, and iframes.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Aspectly enables seamless bidirectional communication between:
- **React Native apps** and **WebViews**
- **Web pages** and **iframes**
- **Universal apps** (React Native Web / Expo) and embedded content

## Packages

| Package | Description |
|---------|-------------|
| [`@aspectly/core`](./packages/core) | Core bridge framework - use inside iframes/WebViews |
| [`@aspectly/web`](./packages/web) | Web/iframe integration with React hooks |
| [`@aspectly/react-native`](./packages/react-native) | React Native WebView integration |
| [`@aspectly/react-native-web`](./packages/react-native-web) | Universal React Native Web support |
| [`@aspectly/transports`](./packages/transports) | Transport layer for platform detection |
| | |
| [`Aspectly.Bridge`](./dotnet/Aspectly.Bridge) | Core .NET bridge library |
| [`Aspectly.Bridge.CefSharp`](./dotnet/Aspectly.Bridge.CefSharp) | CefSharp (Chromium) integration |
| [`Aspectly.Bridge.WebView2`](./dotnet/Aspectly.Bridge.WebView2) | WebView2 (Edge) integration |

## Quick Start

### Scenario 1: Web page embedding an iframe

**Parent page (host):**

```tsx
import { useAspectlyIframe } from '@aspectly/web';

function App() {
  const [bridge, loaded, Iframe] = useAspectlyIframe({
    url: 'https://widget.example.com'
  });

  useEffect(() => {
    if (loaded) {
      bridge.init({
        getUserData: async () => ({ name: 'John', id: 123 })
      });
    }
  }, [loaded]);

  return <Iframe style={{ width: '100%', height: 400 }} />;
}
```

**iframe content (widget):**

```typescript
import { AspectlyBridge } from '@aspectly/core';

const bridge = new AspectlyBridge();
await bridge.init({
  greet: async (params) => ({ message: `Hello, ${params.name}!` })
});

const user = await bridge.send('getUserData');
```

### Scenario 2: React Native app with WebView

**React Native app:**

```tsx
import { useAspectlyWebView } from '@aspectly/react-native';

function App() {
  const [bridge, loaded, WebView] = useAspectlyWebView({
    url: 'https://webapp.example.com'
  });

  useEffect(() => {
    if (loaded) {
      bridge.init({
        getDeviceInfo: async () => ({
          platform: Platform.OS,
          version: Platform.Version
        })
      });
    }
  }, [loaded]);

  return <WebView style={{ flex: 1 }} />;
}
```

**Web content (inside WebView):**

```typescript
import { AspectlyBridge } from '@aspectly/core';

const bridge = new AspectlyBridge();
await bridge.init();

const device = await bridge.send('getDeviceInfo');
console.log(`Running on ${device.platform}`);
```

### Scenario 3: Universal app (Expo / React Native Web)

```tsx
import { useAspectlyWebView } from '@aspectly/react-native-web';

// Same API works on iOS, Android, and Web!
function App() {
  const [bridge, loaded, WebView] = useAspectlyWebView({
    url: 'https://widget.example.com'
  });

  return <WebView style={{ flex: 1 }} />;
}
```

### Scenario 4: .NET desktop app with CefSharp

**C# host app:**

```csharp
using Aspectly.Bridge;
using Aspectly.Bridge.CefSharp;

var browserBridge = new CefSharpBrowserBridge(chromiumBrowser);
var bridge = new BridgeHost(browserBridge);

bridge.RegisterHandler<object, object>("getUserData", async _ =>
    new { name = "John", id = 123 });

// InitializeAsync() awaits both Init and InitResult from the JS side
await bridge.InitializeAsync();
var result = await bridge.SendAsync<string>("jsMethod");

// Or initialize with handlers in one call:
await bridge.InitializeAsync(new Dictionary<string, Delegate>
{
    ["getUserData"] = async (object _) => new { name = "John", id = 123 }
});
```

## Features

- **Type-safe** - Full TypeScript support with generics
- **Promise-based** - Modern async/await API
- **Universal** - Works on iOS, Android, and Web
- **Bidirectional** - Send and receive messages in both directions
- **Event-driven** - Subscribe to all bridge events
- **Error handling** - Typed errors with detailed messages
- **Timeout protection** - Configurable request timeouts
- **Cross-platform** - JavaScript, TypeScript, and .NET support

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Host Context                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ @aspectly/web | @aspectly/react-native | @aspectly/react-native-web | .NET (Aspectly.Bridge)│ │
│  │                                                              │ │
│  │  • useAspectlyIframe() / useAspectlyWebView()               │ │
│  │  • Register handlers                                         │ │
│  │  • Send requests                                             │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│                             │ postMessage / injectJavaScript     │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   Embedded Context                           │ │
│  │                     (iframe/WebView)                         │ │
│  │  ┌───────────────────────────────────────────────────────┐  │ │
│  │  │  @aspectly/core                                        │  │ │
│  │  │                                                        │  │ │
│  │  │  • AspectlyBridge                                     │  │ │
│  │  │  • Register handlers                                   │  │ │
│  │  │  • Send requests                                       │  │ │
│  │  └───────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Installation

Choose the package based on your use case:

```bash
# Inside an iframe or WebView (embedded content)
npm install @aspectly/core

# Web app embedding an iframe
npm install @aspectly/web

# React Native app with WebView
npm install @aspectly/react-native react-native-webview

# Universal app (Expo / React Native Web)
npm install @aspectly/react-native-web react-native-webview

# .NET desktop app with CefSharp
dotnet add package Aspectly.Bridge.CefSharp

# .NET desktop app with WebView2
dotnet add package Aspectly.Bridge.WebView2
```

## Error Handling

```typescript
import { BridgeErrorType } from '@aspectly/core';

try {
  const result = await bridge.send('someMethod', params);
} catch (error) {
  switch (error.error_type) {
    case BridgeErrorType.UNSUPPORTED_METHOD:
      console.log('Method not registered');
      break;
    case BridgeErrorType.METHOD_EXECUTION_TIMEOUT:
      console.log('Handler timed out');
      break;
    case BridgeErrorType.BRIDGE_NOT_AVAILABLE:
      console.log('Bridge not initialized');
      break;
    case BridgeErrorType.REJECTED:
      console.log('Handler threw error:', error.error_message);
      break;
  }
}
```

## Examples

See the [examples](./examples) directory:

- [`examples/core`](./examples/core) - Widget running inside iframe/WebView
- [`examples/web`](./examples/web) - React app embedding an iframe
- [`examples/react-native`](./examples/react-native) - Universal Expo app
- [`examples/dotnet`](./examples/dotnet) - .NET desktop app with CefSharp

## Documentation

- [API Reference](./docs/API.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Examples](./docs/EXAMPLES.md)
- [Migration Guide](./docs/MIGRATION.md)

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run type checking
pnpm typecheck

# Run linting
pnpm lint
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

MIT © [Zhan Isaakian](https://github.com/JeanIsahakyan)
