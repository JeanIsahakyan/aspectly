/// Abstraction for browser message passing.
///
/// Implement this for any Dart web view (e.g. `webview_flutter`'s
/// `WebViewController`, `flutter_inappwebview`, a mock for testing). The Dart
/// equivalent of .NET's `IBrowserBridge`.
abstract class BrowserBridge {
  /// Whether the browser is ready for communication.
  bool get isReady;

  /// Callback invoked when a message is received from JavaScript.
  /// `BridgeHost` assigns this when it is constructed.
  set onMessage(void Function(String message)? callback);
  void Function(String message)? get onMessage;

  /// Send a message to JavaScript by executing a script.
  Future<void> executeScript(String script);

  /// Release any resources and detach from the underlying web view.
  void dispose();
}

/// Simple logging interface for `BridgeHost`.
abstract class BridgeLogger {
  void debug(String message);
  void info(String message);
  void warn(String message);
  void error(String message, [Object? error]);
}

/// Null logger that discards all messages (no-op).
class NullLogger implements BridgeLogger {
  const NullLogger();

  @override
  void debug(String message) {}
  @override
  void info(String message) {}
  @override
  void warn(String message) {}
  @override
  void error(String message, [Object? error]) {}
}

/// Logger that prints to stdout.
class ConsoleLogger implements BridgeLogger {
  const ConsoleLogger();

  @override
  void debug(String message) => print('[DEBUG] $message');
  @override
  void info(String message) => print('[INFO] $message');
  @override
  void warn(String message) => print('[WARN] $message');
  @override
  void error(String message, [Object? error]) {
    print('[ERROR] $message');
    if (error != null) print('  Error: $error');
  }
}
