# Migration Guide

Guide for migrating from the legacy single-package `@jeanisahakyan/chirp` to the new multi-package architecture.

## Overview

The Aspectly library has been restructured into a monorepo with multiple focused packages:

| Old | New | Use Case |
|-----|-----|----------|
| `@jeanisahakyan/chirp` | `@aspectly/core` | Inside iframes/WebViews |
| `@jeanisahakyan/chirp` | `@aspectly/web` | Web apps embedding iframes |
| `@jeanisahakyan/chirp` | `@aspectly/react-native` | React Native apps |
| `@jeanisahakyan/chirp` | `@aspectly/react-native-web` | Universal Expo apps |

> This guide covers the JavaScript packages only. The native host bridges — .NET
> (`Aspectly.Bridge.*`), Swift/iOS/macOS/visionOS (`AspectlyBridge`), Android
> (`com.aspectly:aspectly-bridge`), Flutter (`aspectly_bridge`), and Python /
> WebKitGTK (`aspectly-bridge`) — are new in the 2.x line and have no `chirp`
> predecessor, so there is nothing to migrate. See
> [`EXAMPLES.md`](./EXAMPLES.md) and the per-platform guides to adopt them.

## Step-by-Step Migration

### Step 1: Identify Your Use Case

**If you're building a widget/app that runs inside an iframe or WebView:**
→ Use `@aspectly/core`

**If you're building a web app that embeds iframes:**
→ Use `@aspectly/web`

**If you're building a React Native app that uses WebViews:**
→ Use `@aspectly/react-native`

**If you're building a universal app (Expo/React Native Web):**
→ Use `@aspectly/react-native-web`

### Step 2: Update Dependencies

```bash
# Remove old package
npm uninstall @jeanisahakyan/chirp

# Install new package based on use case
npm install @aspectly/core          # For embedded content
npm install @aspectly/web           # For web iframe hosts
npm install @aspectly/react-native  # For React Native
```

### Step 3: Update Imports

#### For AspectlyBridge (Inside WebView/iframe)

```diff
- import { ChirpBridge } from '@jeanisahakyan/chirp';
+ import { AspectlyBridge } from '@aspectly/core';

const bridge = new AspectlyBridge();
```

#### For useAspectlyWebView (React Native)

```diff
- import { useChirpWebView } from '@jeanisahakyan/chirp';
+ import { useAspectlyWebView } from '@aspectly/react-native';

function App() {
-  const [bridge, loaded, WebView] = useChirpWebView({
-    webview_url: 'https://example.com'
-  });
+  const [bridge, loaded, WebView] = useAspectlyWebView({
+    url: 'https://example.com'  // Note: 'webview_url' → 'url'
+  });
}
```

#### For useAspectlyIframe (Web)

```diff
- import { useChirpBrowserIframe } from '@jeanisahakyan/chirp';
+ import { useAspectlyIframe } from '@aspectly/web';

function App() {
-  const [bridge, loaded, Iframe] = useChirpBrowserIframe({
-    webview_url: 'https://example.com'
-  });
+  const [bridge, loaded, Iframe] = useAspectlyIframe({
+    url: 'https://example.com'  // Note: 'webview_url' → 'url'
+  });
}
```

### Step 4: Update Options

The options object has been simplified:

```diff
// Old
const [bridge, loaded, Component] = useAspectlyWebView({
-  webview_url: 'https://example.com'
+  url: 'https://example.com'
});
```

### Step 5: Type Imports

Error types and other TypeScript types are now exported from each package:

```diff
- import { BridgeErrorType } from '@jeanisahakyan/chirp';
+ import { BridgeErrorType } from '@aspectly/core';
// or from any other package
+ import { BridgeErrorType } from '@aspectly/web';
```

## API Changes

### Hook Return Types

The hook return types remain the same:
- `bridge` - Bridge instance
- `loaded` - Loading state boolean
- `Component` - React component to render

### Options

| Old Property | New Property |
|--------------|--------------|
| `webview_url` | `url` |

### New Features

The new packages include additional features:

- **`timeout` option** - Configure handler execution timeout
- **`destroy()` method** - Clean up bridge subscriptions
- **Improved TypeScript generics** - Better type inference for `send<T>()`

## Package Comparison

### Bundle Sizes

The new packages are more modular, resulting in smaller bundle sizes when you only need specific functionality:

| Package | Approximate Size |
|---------|------------------|
| `@aspectly/core` | ~4 KB |
| `@aspectly/web` | ~2 KB (+ core) |
| `@aspectly/react-native` | ~2 KB (+ core) |

### Dependencies

- `@aspectly/core` - No dependencies
- `@aspectly/web` - Depends on `@aspectly/core`, peer dep on `react`
- `@aspectly/react-native` - Depends on `@aspectly/core`, peer deps on `react`, `react-native`, `react-native-webview`
- `@aspectly/react-native-web` - Depends on all packages

## Troubleshooting

### "Cannot find module '@aspectly/core'"

Make sure you've installed the correct package for your use case.

### "Property 'webview_url' does not exist"

The option has been renamed to `url`. Update your code:

```typescript
useAspectlyIframe({ url: 'https://...' })
```

### "Bridge methods not working"

Ensure both sides are using compatible versions of the packages. The protocol is backwards-compatible, but new features require updated packages on both sides.

## Support

If you encounter issues during migration:

1. Check the [API documentation](./API.md)
2. Review the [examples](./EXAMPLES.md)
3. Open an issue on [GitHub](https://github.com/JeanIsahakyan/aspectly/issues)
