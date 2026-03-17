# @aspectly/react-native-web

[![npm version](https://img.shields.io/npm/v/@aspectly/react-native-web?style=flat-square&logo=npm&color=cb3837)](https://www.npmjs.com/package/@aspectly/react-native-web)
[![npm downloads](https://img.shields.io/npm/dm/@aspectly/react-native-web?style=flat-square&color=22c55e)](https://www.npmjs.com/package/@aspectly/react-native-web)

Cross-platform Aspectly bridge integration for React Native Web, Expo, and universal React Native apps.

## Installation

```bash
# npm
npm install @aspectly/react-native-web

# pnpm
pnpm add @aspectly/react-native-web

# yarn
yarn add @aspectly/react-native-web
```

For native platforms, you'll also need:

```bash
npm install react-native-webview
cd ios && pod install
```

## Overview

`@aspectly/react-native-web` provides a unified API for embedding web content in universal React Native apps:

- **Web Platform**: Uses iframes for embedding
- **iOS/Android**: Uses `react-native-webview` (via `@aspectly/react-native`)

This package allows you to write one codebase that works seamlessly across all platforms.

## Quick Start

```tsx
import React, { useEffect } from 'react';
import { View, Text, Button, Platform } from 'react-native';
import { useAspectlyWebView } from '@aspectly/react-native-web';

function App() {
  const [bridge, loaded, WebView] = useAspectlyWebView({
    url: 'https://example.com/widget'
  });

  useEffect(() => {
    if (loaded) {
      bridge.init({
        getPlatform: async () => ({
          os: Platform.OS,
          isWeb: Platform.OS === 'web'
        }),
        showMessage: async (params: { text: string }) => {
          alert(params.text);
          return { shown: true };
        }
      });
    }
  }, [loaded, bridge]);

  const handlePress = async () => {
    const result = await bridge.send('greet', { name: 'Universal App' });
    console.log(result);
  };

  return (
    <View style={{ flex: 1 }}>
      <Text>Platform: {Platform.OS}</Text>
      <WebView style={{ flex: 1 }} />
      <Button
        title="Send Message"
        onPress={handlePress}
        disabled={!loaded}
      />
    </View>
  );
}
```

## API Reference

### useAspectlyWebView

```typescript
const [bridge, loaded, WebViewComponent] = useAspectlyWebView(options);
```

#### Options

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `url` | `string` | Yes | URL to load |
| `timeout` | `number` | No | Handler execution timeout in ms (default: 100000) |

#### Returns

| Index | Type | Description |
|-------|------|-------------|
| 0 | `BridgeBase` | Bridge instance for communication |
| 1 | `boolean` | Whether the content has loaded |
| 2 | `FunctionComponent` | Platform-appropriate component |

### WebViewComponent Props (Web Platform)

| Prop | Type | Description |
|------|------|-------------|
| `style` | `CSSProperties` | Custom styles |
| `className` | `string` | CSS class name |
| `title` | `string` | Accessibility title (default: "Embedded content") |
| `sandbox` | `string` | iframe sandbox attribute |
| `allow` | `string` | iframe allow attribute |
| `onError` | `(error: unknown) => void` | Error handler |

### WebViewComponent Props (Native Platform)

Accepts all `react-native-webview` props except `source`, `onMessage`, `onLoad`, and `ref`.

## Platform-Specific Code

The package uses React Native's platform-specific file extensions:

- `index.ts` / `useAspectlyWebView.tsx` - Web platform (iframe)
- `index.native.ts` / `useAspectlyWebView.native.tsx` - iOS/Android (WebView)

This is handled automatically by Metro bundler (React Native) and most web bundlers.

## Cross-Platform Patterns

### Detecting Platform

```tsx
import { Platform } from 'react-native';

bridge.init({
  getPlatformInfo: async () => ({
    platform: Platform.OS, // 'web', 'ios', 'android'
    isWeb: Platform.OS === 'web',
    isNative: Platform.OS !== 'web',
  })
});
```

### Conditional Features

```tsx
bridge.init({
  takePhoto: async () => {
    if (Platform.OS === 'web') {
      // Use file input on web
      return { error: 'Use file picker on web' };
    }
    // Use native camera on iOS/Android
    const result = await ImagePicker.launchCamera();
    return { uri: result.assets[0].uri };
  }
});
```

### Styling Differences

```tsx
// The component handles platform differences internally
<WebView
  style={{
    flex: 1,
    // These work on both platforms
    width: '100%',
    height: 400,
  }}
/>
```

## Expo Support

This package works great with Expo:

```bash
# Install in an Expo project
npx expo install @aspectly/react-native-web react-native-webview
```

Works automatically with:
- Expo Go (web only)
- Expo Dev Client (all platforms)
- EAS Build (all platforms)

## Metro Configuration

For the native platform resolution to work correctly, ensure your `metro.config.js` supports platform extensions:

```js
// metro.config.js (usually automatic)
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = ['native.tsx', 'native.ts', ...config.resolver.sourceExts];

module.exports = config;
```

## Webpack Configuration (Web)

For web builds, ensure the resolver handles the extensions correctly:

```js
// webpack.config.js
module.exports = {
  resolve: {
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.js'],
    alias: {
      'react-native$': 'react-native-web'
    }
  }
};
```

## Related Packages

- [`@aspectly/core`](../core) - Core bridge framework
- [`@aspectly/web`](../web) - Web/iframe integration (standalone)
- [`@aspectly/react-native`](../react-native) - React Native WebView integration

## When to Use Which Package

| Package | Use Case |
|---------|----------|
| `@aspectly/react-native-web` | Universal apps (Expo/RN Web) |
| `@aspectly/react-native` | Native-only apps |
| `@aspectly/web` | Web-only apps |
| `@aspectly/core` | Inside WebViews/iframes |

## License

MIT
