import 'dart:async';
import 'dart:convert';

import 'browser_bridge.dart';
import 'bridge_exception.dart';
import 'protocol.dart';

/// A handler for an incoming request. Receives the decoded params and returns
/// a JSON-encodable result (sync or async).
typedef BridgeHandler = FutureOr<dynamic> Function(dynamic params);

/// `BridgeHost` manages bidirectional communication between native Dart code
/// and JavaScript via the Aspectly protocol. The Dart equivalent of the .NET
/// `BridgeHost` and the parent side of the web hooks.
class BridgeHost {
  /// Default request/handler timeout (100 seconds), matching `@aspectly/core`.
  static const int defaultTimeoutMs = 100000;
  static const String _bridgeEventType = 'BridgeEvent';

  final BrowserBridge _browserBridge;
  final BridgeLogger _logger;
  final int _timeoutMs;

  bool _initialized = false;
  bool _remoteInitReceived = false;
  bool _initResultReceived = false;
  bool _disposed = false;
  int _requestIdCounter = 0;
  Completer<void>? _initCompleter;

  final List<String> _supportedMethods = <String>[];
  final Map<String, BridgeHandler> _handlers = <String, BridgeHandler>{};
  final Map<String, Completer<dynamic>> _pendingRequests =
      <String, Completer<dynamic>>{};

  /// Invoked when the bridge becomes initialized (handshake complete).
  void Function()? onInitialized;

  BridgeHost(
    this._browserBridge, {
    BridgeLogger? logger,
    int timeoutMs = defaultTimeoutMs,
  })  : _logger = logger ?? const NullLogger(),
        _timeoutMs = timeoutMs {
    _browserBridge.onMessage = (String message) {
      // Fire-and-forget; processMessage handles its own errors.
      processMessage(message);
    };
    _logger.info('[BridgeHost] Created and subscribed to messages');
  }

  /// Whether the handshake (both `Init` and `InitResult`) has completed.
  bool get isInitialized => _initialized;

  /// The methods supported by the JavaScript side.
  List<String> get supportedMethods => List<String>.unmodifiable(_supportedMethods);

  /// The locally registered handler method names.
  List<String> get registeredMethods => List<String>.unmodifiable(_handlers.keys);

  /// Register a handler for [method]. Call before [initialize].
  void registerHandler(String method, BridgeHandler handler) {
    _handlers[method] = handler;
    _logger.info('[BridgeHost] Registered handler: $method');
  }

  /// Remove a previously registered handler.
  void unregisterHandler(String method) {
    _handlers.remove(method);
    _logger.info('[BridgeHost] Unregistered handler: $method');
  }

  /// Process a message received from JavaScript.
  Future<void> processMessage(String messageJson) async {
    if (messageJson.isEmpty) return;
    _logger.debug('[BridgeHost] Received: $messageJson');

    dynamic wrapper;
    try {
      wrapper = jsonDecode(messageJson);
    } catch (e) {
      _logger.error('[BridgeHost] JSON parse error', e);
      return;
    }

    if (wrapper is! Map || wrapper['type'] != _bridgeEventType) return;
    final dynamic event = wrapper['event'];
    if (event is! Map) return;
    final dynamic type = event['type'];
    final dynamic data = event['data'];

    switch (type) {
      case BridgeEventType.init:
        await _handleInit(data);
        break;
      case BridgeEventType.request:
        await _handleRequest(data);
        break;
      case BridgeEventType.result:
        _handleResult(data);
        break;
      case BridgeEventType.initResult:
        _initResultReceived = true;
        _logger.info('[BridgeHost] InitResult received from JS');
        _tryResolveInit();
        break;
    }
  }

  Future<void> _handleInit(dynamic data) async {
    if (data is Map && data['methods'] is List) {
      _supportedMethods
        ..clear()
        ..addAll((data['methods'] as List).map((dynamic e) => e.toString()));
      _logger.info('[BridgeHost] JS supports methods: ${_supportedMethods.join(', ')}');
    }
    _remoteInitReceived = true;
    // Match the JS protocol: only send InitResult, not our Init.
    await _sendEvent(BridgeEventType.initResult, true);
    _logger.info('[BridgeHost] Sent InitResult');
    _tryResolveInit();
  }

  void _tryResolveInit() {
    if (_initResultReceived && _remoteInitReceived && !_initialized) {
      _initialized = true;
      final Completer<void>? completer = _initCompleter;
      _initCompleter = null;
      completer?.complete();
      _logger.info('[BridgeHost] Bridge fully initialized');
      final cb = onInitialized;
      if (cb != null) cb();
    }
  }

  Future<void> _handleRequest(dynamic data) async {
    if (data is! Map) return;
    final String? method = data['method'] as String?;
    final String? requestId = data['request_id'] as String?;
    if (method == null || requestId == null) return;
    final dynamic params = data.containsKey('params') ? data['params'] : <String, dynamic>{};

    final BridgeHandler? handler = _handlers[method];
    Map<String, dynamic> result;
    if (handler == null) {
      _logger.warn('[BridgeHost] Unknown method: $method');
      result = _errorResult(method, requestId, BridgeErrorType.unsupportedMethod,
          "Method '$method' is not registered");
    } else {
      try {
        final dynamic value = await Future<dynamic>(() => handler(params))
            .timeout(Duration(milliseconds: _timeoutMs));
        result = <String, dynamic>{
          'type': BridgeResultType.success,
          'method': method,
          'request_id': requestId,
          'data': value,
        };
        _logger.debug("[BridgeHost] Handler '$method' completed successfully");
      } on TimeoutException {
        _logger.error("[BridgeHost] Handler '$method' timed out");
        result = _errorResult(method, requestId,
            BridgeErrorType.methodExecutionTimeout, 'Execution timeout exceeded');
      } catch (e) {
        _logger.error("[BridgeHost] Handler '$method' failed", e);
        final String msg = e is BridgeException ? e.message : e.toString();
        result = _errorResult(method, requestId, BridgeErrorType.rejected, msg);
      }
    }
    await _sendEvent(BridgeEventType.result, result);
  }

  void _handleResult(dynamic data) {
    if (data is! Map) return;
    final String? requestId = data['request_id'] as String?;
    if (requestId == null) return;
    final Completer<dynamic>? completer = _pendingRequests.remove(requestId);
    if (completer == null || completer.isCompleted) return;

    if (data['type'] == BridgeResultType.success) {
      completer.complete(data['data']);
    } else {
      final dynamic error = data['error'];
      final String errorType =
          (error is Map ? error['error_type'] : null)?.toString() ?? BridgeErrorType.rejected;
      final String? message = (error is Map ? error['error_message'] : null)?.toString();
      completer.completeError(BridgeException(errorType, message));
    }
  }

  Future<void> _sendEvent(String type, dynamic data) async {
    final Map<String, dynamic> wrapper = <String, dynamic>{
      'type': _bridgeEventType,
      'event': <String, dynamic>{'type': type, 'data': data},
    };
    final String json = jsonEncode(wrapper);
    // Double-encode to produce a safe JS string literal (matches .NET / Swift).
    final String jsLiteral = jsonEncode(json);
    final String script =
        "(function(){window.postMessage($jsLiteral, '*');return true;})();";
    try {
      await _browserBridge.executeScript(script);
      _logger.debug('[BridgeHost] Sent: $json');
    } catch (e) {
      _logger.error('[BridgeHost] Failed to send event', e);
    }
  }

  /// Send a request to the JavaScript side and await the decoded response.
  Future<T> send<T>(String method, [dynamic params, int? timeoutMs]) async {
    if (!_initialized) {
      throw BridgeException(BridgeErrorType.bridgeNotAvailable, 'Bridge not initialized');
    }
    if (!_supportedMethods.contains(method)) {
      throw BridgeException(BridgeErrorType.unsupportedMethod,
          "Method '$method' not supported by JS side");
    }

    final String requestId = (++_requestIdCounter).toString();
    final Completer<dynamic> completer = Completer<dynamic>();
    _pendingRequests[requestId] = completer;

    await _sendEvent(BridgeEventType.request, <String, dynamic>{
      'method': method,
      'request_id': requestId,
      'params': params ?? <String, dynamic>{},
    });
    _logger.debug('[BridgeHost] Sent request: $method (id=$requestId)');

    final Timer timer = Timer(Duration(milliseconds: timeoutMs ?? _timeoutMs), () {
      final Completer<dynamic>? c = _pendingRequests.remove(requestId);
      if (c != null && !c.isCompleted) {
        c.completeError(BridgeException(BridgeErrorType.methodExecutionTimeout,
            "Request '$method' timed out after ${timeoutMs ?? _timeoutMs}ms"));
      }
    });

    try {
      final dynamic result = await completer.future;
      return result as T;
    } finally {
      timer.cancel();
    }
  }

  /// Register handlers and send `Init`, then wait for `InitResult`.
  Future<void> initialize([Map<String, BridgeHandler>? handlers]) async {
    if (handlers != null) {
      handlers.forEach(registerHandler);
    }
    final Completer<void> completer = Completer<void>();
    _initCompleter = completer;
    await _sendEvent(BridgeEventType.init, <String, dynamic>{
      'methods': _handlers.keys.toList(),
    });
    _logger.info('[BridgeHost] Sent Init with methods: ${_handlers.keys.join(', ')}');
    await completer.future;
  }

  /// Detach from the browser bridge and cancel any pending work.
  void dispose() {
    if (_disposed) return;
    _disposed = true;
    _browserBridge.onMessage = null;
    _browserBridge.dispose();

    final BridgeException cancellation =
        BridgeException(BridgeErrorType.bridgeNotAvailable, 'Bridge disposed');
    final Completer<void>? initCompleter = _initCompleter;
    _initCompleter = null;
    if (initCompleter != null && !initCompleter.isCompleted) {
      initCompleter.completeError(cancellation);
    }
    for (final Completer<dynamic> c in _pendingRequests.values) {
      if (!c.isCompleted) c.completeError(cancellation);
    }
    _pendingRequests.clear();
    _logger.info('[BridgeHost] Disposed');
  }

  Map<String, dynamic> _errorResult(
      String method, String requestId, String errorType, String message) {
    return <String, dynamic>{
      'type': BridgeResultType.error,
      'method': method,
      'request_id': requestId,
      'error': <String, dynamic>{
        'error_type': errorType,
        'error_message': message,
      },
    };
  }
}
