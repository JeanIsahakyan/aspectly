# aspectly_bridge (Dart / Flutter)

[![pub package](https://img.shields.io/pub/v/aspectly_bridge?style=flat-square&logo=dart&color=0175C2)](https://pub.dev/packages/aspectly_bridge)

Type-safe, bidirectional bridge between native Dart/Flutter code and JavaScript
running in a web view. Speaks the [Aspectly](https://github.com/JeanIsahakyan/aspectly)
protocol, so the same `@aspectly/core` web content runs unchanged across Web,
React Native, React Native Web/Expo, .NET, iOS/macOS/visionOS, Android, Flutter,
and Linux/WebKitGTK (Python) hosts.

The package is **pure Dart** (no Flutter dependency) — wire it to any web view by
implementing `BrowserBridge`. The example shows the `webview_flutter` glue.

## Install

```yaml
dependencies:
  aspectly_bridge: ^2.1.0
```

The web content loaded in the web view uses `@aspectly/core` (npm). It
auto-detects the Flutter host via the
[`@aspectly/transports`](https://www.npmjs.com/package/@aspectly/transports)
Flutter transport (`window.AspectlyFlutter`).

## Usage

```dart
import 'package:aspectly_bridge/aspectly_bridge.dart';

final bridge = BridgeHost(browserBridge);

// Register handlers JS can call (before initialize).
bridge.registerHandler('ping', (params) => 'pong');
bridge.registerHandler('add', (params) async => params['a'] + params['b']);

await bridge.initialize();

// Call a JS method.
final result = await bridge.send<Map<String, dynamic>>('greet', {'name': 'Flutter'});
print(result['message']);
```

### Wiring `webview_flutter`

```dart
import 'package:webview_flutter/webview_flutter.dart';
import 'package:aspectly_bridge/aspectly_bridge.dart';

class WebViewFlutterBrowserBridge implements BrowserBridge {
  WebViewFlutterBrowserBridge(this.controller) {
    controller.addJavaScriptChannel(
      'AspectlyFlutter',
      onMessageReceived: (m) => onMessage?.call(m.message),
    );
  }

  final WebViewController controller;
  @override
  bool get isReady => true;
  @override
  void Function(String message)? onMessage;
  @override
  Future<void> executeScript(String script) => controller.runJavaScript(script);
  @override
  void dispose() {}
}
```

Then call `bridge.initialize()` once the page has finished loading
(`NavigationDelegate.onPageFinished`).

## API

```dart
BridgeHost(browserBridge, {BridgeLogger? logger, int timeoutMs = 100000});

void registerHandler(String method, BridgeHandler handler); // handler(params) -> result
void unregisterHandler(String method);
Future<void> initialize([Map<String, BridgeHandler>? handlers]);
Future<T> send<T>(String method, [dynamic params, int? timeoutMs]);
Future<void> processMessage(String messageJson);

bool get isInitialized;
List<String> get supportedMethods;   // JS-side methods
List<String> get registeredMethods;  // Dart-side handlers
void Function()? onInitialized;
void dispose();
```

`send` / handlers throw `BridgeException` with `errorType` one of
`BridgeErrorType.{unsupportedMethod, methodExecutionTimeout, rejected, bridgeNotAvailable}`.

## Testing

```bash
cd dart
dart pub get
dart test
```

## Other platforms

Aspectly also ships for Web (iframe/popup), React Native, React Native Web/Expo,
.NET (CefSharp/WebView2 on Windows), iOS/macOS/visionOS, Android, and
Linux/WebKitGTK (Python) — all at version 2.1.0. See the
[repository README](../README.md) for the full platform matrix.

## License

MIT
