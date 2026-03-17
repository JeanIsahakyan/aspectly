# @aspectly/react-native

[![npm version](https://img.shields.io/npm/v/@aspectly/react-native?style=flat-square&logo=npm&color=cb3837)](https://www.npmjs.com/package/@aspectly/react-native)
[![npm downloads](https://img.shields.io/npm/dm/@aspectly/react-native?style=flat-square&color=22c55e)](https://www.npmjs.com/package/@aspectly/react-native)

React Native WebView integration for the Aspectly bridge - communicate with web content in your React Native app.

## Installation

```bash
# npm
npm install @aspectly/react-native react-native-webview

# pnpm
pnpm add @aspectly/react-native react-native-webview

# yarn
yarn add @aspectly/react-native react-native-webview
```

### iOS Additional Setup

```bash
cd ios && pod install
```

## Overview

`@aspectly/react-native` provides React hooks for React Native apps to embed WebViews and establish bidirectional communication with web content. The web content should use `@aspectly/core` to communicate back.

## Quick Start

### React Native App (Host)

```tsx
import React, { useEffect } from 'react';
import { View, Button, Platform } from 'react-native';
import { useAspectlyWebView } from '@aspectly/react-native';

function App() {
  const [bridge, loaded, WebView] = useAspectlyWebView({
    url: 'https://example.com/app'
  });

  useEffect(() => {
    if (loaded) {
      // Initialize bridge with handlers
      bridge.init({
        getDeviceInfo: async () => ({
          platform: Platform.OS,
          version: Platform.Version,
        }),
        showAlert: async (params: { message: string }) => {
          Alert.alert('From Web', params.message);
          return { shown: true };
        },
      });
    }
  }, [loaded, bridge]);

  const handleSendMessage = async () => {
    try {
      const result = await bridge.send('greet', { name: 'Native App' });
      console.log('Response:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <WebView style={{ flex: 1 }} />
      <Button
        title="Send Message"
        onPress={handleSendMessage}
        disabled={!loaded}
      />
    </View>
  );
}
```

### Web Content (Inside WebView)

The web content should use `@aspectly/core`:

```typescript
// In your web app loaded in the WebView
import { AspectlyBridge } from '@aspectly/core';

const bridge = new AspectlyBridge();

// Initialize with handlers
await bridge.init({
  greet: async (params: { name: string }) => {
    return { message: `Hello, ${params.name}!` };
  }
});

// Call native methods
const deviceInfo = await bridge.send('getDeviceInfo');
console.log('Device:', deviceInfo.platform, deviceInfo.version);

// Trigger native alert
await bridge.send('showAlert', { message: 'Hello from web!' });
```

## API Reference

### useAspectlyWebView

```typescript
const [bridge, loaded, WebViewComponent] = useAspectlyWebView(options);
```

#### Options

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `url` | `string` | Yes | URL to load in the WebView |
| `timeout` | `number` | No | Handler execution timeout in ms (default: 100000) |

#### Returns

| Index | Type | Description |
|-------|------|-------------|
| 0 | `BridgeBase` | Bridge instance for communication |
| 1 | `boolean` | Whether the WebView has finished loading |
| 2 | `FunctionComponent` | React component to render the WebView |

### WebViewComponent Props

The returned WebView component accepts all standard `react-native-webview` props except `source`, `onMessage`, `onLoad`, and `ref` (which are managed internally), plus:

| Prop | Type | Description |
|------|------|-------------|
| `style` | `ViewStyle` | Custom styles for the WebView |
| `onError` | `(error: unknown) => void` | Optional error handler |

## Common Use Cases

### Accessing Native Features from Web

```tsx
// React Native side
bridge.init({
  takePhoto: async () => {
    const result = await ImagePicker.launchCamera();
    return { uri: result.assets[0].uri };
  },
  getLocation: async () => {
    const location = await Geolocation.getCurrentPosition();
    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude
    };
  },
  shareContent: async (params: { text: string; url?: string }) => {
    await Share.share({ message: params.text, url: params.url });
    return { shared: true };
  }
});
```

### Handling Web Navigation Events

```tsx
// React Native side
bridge.init({
  navigate: async (params: { screen: string; data?: object }) => {
    navigation.navigate(params.screen, params.data);
    return { navigated: true };
  },
  goBack: async () => {
    navigation.goBack();
    return { success: true };
  }
});
```

### Authentication Flow

```tsx
// React Native side
bridge.init({
  getAuthToken: async () => {
    const token = await AsyncStorage.getItem('authToken');
    return { token };
  },
  setAuthToken: async (params: { token: string }) => {
    await AsyncStorage.setItem('authToken', params.token);
    return { saved: true };
  },
  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    return { loggedOut: true };
  }
});
```

## Error Handling

```tsx
import { BridgeErrorType } from '@aspectly/react-native';

const handleSend = async () => {
  try {
    await bridge.send('action', { data: 'value' });
  } catch (error) {
    switch (error.error_type) {
      case BridgeErrorType.BRIDGE_NOT_AVAILABLE:
        console.log('WebView not ready');
        break;
      case BridgeErrorType.UNSUPPORTED_METHOD:
        console.log('Method not supported by web content');
        break;
      case BridgeErrorType.METHOD_EXECUTION_TIMEOUT:
        console.log('Request timed out');
        break;
      case BridgeErrorType.REJECTED:
        console.log('Handler error:', error.error_message);
        break;
    }
  }
};
```

## Platform Notes

### iOS
- Uses `WKWebView` under the hood
- Requires `react-native-webview` pod installation

### Android
- Uses `WebView` component
- `javaScriptEnabled` is automatically set to `true`
- `mixedContentMode` is set to `"always"` for development

## Related Packages

- [`@aspectly/core`](../core) - Core bridge framework (used in web content)
- [`@aspectly/web`](../web) - Web/iframe integration
- [`@aspectly/react-native-web`](../react-native-web) - React Native Web + iframe support

## License

MIT
