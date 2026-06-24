# Aspectly Flutter Example

A Flutter app demonstrating bidirectional communication between native Dart and
JavaScript using `aspectly_bridge` with `webview_flutter`.

## Requirements

- Flutter 3.10+ (Dart 3)
- An iOS/Android device or emulator

## Run

```bash
cd examples/flutter
flutter pub get
flutter run
```

## What it shows

- **Native Dart → web (JS)**: the buttons at the top call `greet`, `getTime`,
  `calculate` in the web page and show the result.
- **Web (JS) → native Dart**: the buttons inside the WebView call the native
  `ping` / `echo` / `add` / `getSystemInfo` handlers.

The Dart side wires `webview_flutter`'s `WebViewController` to a
`WebViewFlutterBrowserBridge` (see `lib/main.dart`), registers handlers, and
calls `bridge.initialize()` on `onPageFinished`. The web page uses the
`@aspectly/core` browser bundle (`web/aspectly.js`) and auto-detects the Flutter
host via the `AspectlyFlutter` JavaScript channel.

## Regenerating the browser bundle

```bash
# from the repo root, after `pnpm build`
npx esbuild packages/core/src/browser.ts \
  --bundle --format=iife --platform=browser --target=es2018 \
  --outfile=examples/flutter/web/aspectly.js
```
