import 'dart:convert';

import 'package:aspectly_bridge/aspectly_bridge.dart';
import 'package:test/test.dart';

class MockBrowserBridge implements BrowserBridge {
  @override
  bool get isReady => true;

  void Function(String message)? _onMessage;
  @override
  set onMessage(void Function(String message)? cb) => _onMessage = cb;
  @override
  void Function(String message)? get onMessage => _onMessage;

  final List<String> sentScripts = <String>[];
  bool disposed = false;

  @override
  Future<void> executeScript(String script) async {
    sentScripts.add(script);
  }

  @override
  void dispose() {
    disposed = true;
  }

  bool anyScriptContains(String s) => sentScripts.any((e) => e.contains(s));
}

String bridgeMessage(String type, dynamic data) => jsonEncode(<String, dynamic>{
      'type': 'BridgeEvent',
      'event': <String, dynamic>{'type': type, 'data': data},
    });

Future<void> handshake(
    BridgeHost bridge, MockBrowserBridge mock, List<String> jsMethods) async {
  final initFuture = bridge.initialize();
  await Future<void>.delayed(Duration.zero);
  await bridge.processMessage(bridgeMessage('Init', <String, dynamic>{'methods': jsMethods}));
  await bridge.processMessage(bridgeMessage('InitResult', true));
  await initFuture;
}

void main() {
  late MockBrowserBridge mock;
  late BridgeHost bridge;

  setUp(() {
    mock = MockBrowserBridge();
    bridge = BridgeHost(mock);
  });

  tearDown(() => bridge.dispose());

  group('handler registration', () {
    test('registerHandler adds handler', () {
      bridge.registerHandler('test', (p) => 'result');
      expect(bridge.registeredMethods, contains('test'));
    });

    test('unregisterHandler removes handler', () {
      bridge.registerHandler('test', (p) => 'result');
      bridge.unregisterHandler('test');
      expect(bridge.registeredMethods, isNot(contains('test')));
    });

    test('register with same name overwrites', () async {
      bridge.registerHandler('test', (p) => 'first');
      bridge.registerHandler('test', (p) => 'second');
      await bridge.processMessage(bridgeMessage('Request',
          <String, dynamic>{'method': 'test', 'request_id': '1', 'params': <String, dynamic>{}}));
      expect(mock.sentScripts.last, contains('second'));
    });
  });

  group('init handshake', () {
    test('Init updates supported methods', () async {
      await bridge.processMessage(
          bridgeMessage('Init', <String, dynamic>{'methods': <String>['a', 'b']}));
      expect(bridge.supportedMethods, containsAll(<String>['a', 'b']));
    });

    test('handleInit only sends InitResult, not our Init', () async {
      bridge.registerHandler('myMethod', (p) => 'r');
      await bridge.processMessage(
          bridgeMessage('Init', <String, dynamic>{'methods': <String>['jsMethod']}));
      expect(mock.sentScripts.length, 1);
      expect(mock.sentScripts[0], contains('InitResult'));
    });

    test('initializes only when both Init and InitResult received', () async {
      var fired = false;
      bridge.onInitialized = () => fired = true;
      await bridge.processMessage(bridgeMessage('InitResult', true));
      expect(bridge.isInitialized, isFalse);
      expect(fired, isFalse);
      await bridge.processMessage(
          bridgeMessage('Init', <String, dynamic>{'methods': <String>['jsMethod']}));
      expect(bridge.isInitialized, isTrue);
      expect(fired, isTrue);
    });

    test('initialize waits for both Init and InitResult', () async {
      await handshake(bridge, mock, <String>['jsMethod']);
      expect(bridge.isInitialized, isTrue);
      expect(bridge.supportedMethods, contains('jsMethod'));
    });

    test('initialize(handlers) registers and inits', () async {
      final initFuture = bridge.initialize(<String, BridgeHandler>{
        'm1': (p) => 'r1',
        'm2': (p) => 'r2',
      });
      await Future<void>.delayed(Duration.zero);
      expect(bridge.registeredMethods, containsAll(<String>['m1', 'm2']));
      await bridge.processMessage(
          bridgeMessage('Init', <String, dynamic>{'methods': <String>['jsMethod']}));
      await bridge.processMessage(bridgeMessage('InitResult', true));
      await initFuture;
      expect(bridge.isInitialized, isTrue);
    });
  });

  group('incoming requests', () {
    test('calls handler', () async {
      var called = false;
      bridge.registerHandler('m', (p) {
        called = true;
        return <String, dynamic>{'ok': true};
      });
      await bridge.processMessage(bridgeMessage('Request',
          <String, dynamic>{'method': 'm', 'request_id': '1', 'params': <String, dynamic>{}}));
      expect(called, isTrue);
    });

    test('unknown method sends UNSUPPORTED_METHOD', () async {
      await bridge.processMessage(bridgeMessage('Request',
          <String, dynamic>{'method': 'nope', 'request_id': '1', 'params': <String, dynamic>{}}));
      expect(mock.sentScripts.last, contains('UNSUPPORTED_METHOD'));
    });

    test('handler returns data -> Success', () async {
      bridge.registerHandler('m', (p) => <String, dynamic>{'value': 42});
      await bridge.processMessage(bridgeMessage('Request',
          <String, dynamic>{'method': 'm', 'request_id': '1', 'params': <String, dynamic>{}}));
      expect(mock.sentScripts.last, contains('Success'));
      expect(mock.sentScripts.last, contains('42'));
    });

    test('handler throws -> REJECTED', () async {
      bridge.registerHandler('m', (p) => throw Exception('boom'));
      await bridge.processMessage(bridgeMessage('Request',
          <String, dynamic>{'method': 'm', 'request_id': '1', 'params': <String, dynamic>{}}));
      expect(mock.sentScripts.last, contains('REJECTED'));
      expect(mock.sentScripts.last, contains('boom'));
    });

    test('typed params reach handler', () async {
      bridge.registerHandler('add', (p) => p['a'] + p['b']);
      await bridge.processMessage(bridgeMessage('Request', <String, dynamic>{
        'method': 'add',
        'request_id': '1',
        'params': <String, dynamic>{'a': 10, 'b': 20},
      }));
      expect(mock.sentScripts.last, contains('30'));
    });
  });

  group('sending requests', () {
    test('success resolves', () async {
      await handshake(bridge, mock, <String>['jsMethod']);
      final f = bridge.send<String>('jsMethod');
      await Future<void>.delayed(Duration.zero);
      await bridge.processMessage(bridgeMessage('Result', <String, dynamic>{
        'type': 'Success',
        'data': 'test result',
        'request_id': '1',
      }));
      expect(await f, 'test result');
    });

    test('error rejects with BridgeException', () async {
      await handshake(bridge, mock, <String>['jsMethod']);
      final f = bridge.send<String>('jsMethod');
      final expectation = expectLater(
        f,
        throwsA(isA<BridgeException>()
            .having((e) => e.errorType, 'errorType', BridgeErrorType.rejected)
            .having((e) => e.message, 'message', 'failed')),
      );
      await Future<void>.delayed(Duration.zero);
      await bridge.processMessage(bridgeMessage('Result', <String, dynamic>{
        'type': 'Error',
        'error': <String, dynamic>{'error_type': 'REJECTED', 'error_message': 'failed'},
        'request_id': '1',
      }));
      await expectation;
    });

    test('timeout throws', () async {
      await handshake(bridge, mock, <String>['jsMethod']);
      expect(
        () => bridge.send<String>('jsMethod', null, 50),
        throwsA(isA<BridgeException>()
            .having((e) => e.errorType, 'errorType', BridgeErrorType.methodExecutionTimeout)),
      );
    });

    test('send before init throws', () async {
      expect(
        () => bridge.send<String>('m'),
        throwsA(isA<BridgeException>()
            .having((e) => e.errorType, 'errorType', BridgeErrorType.bridgeNotAvailable)),
      );
    });

    test('unsupported method throws', () async {
      await handshake(bridge, mock, <String>['other']);
      expect(
        () => bridge.send<String>('m'),
        throwsA(isA<BridgeException>()
            .having((e) => e.errorType, 'errorType', BridgeErrorType.unsupportedMethod)),
      );
    });
  });

  group('ignored messages', () {
    test('empty', () async {
      await bridge.processMessage('');
      expect(mock.sentScripts, isEmpty);
    });
    test('invalid json', () async {
      await bridge.processMessage('not json {');
      expect(mock.sentScripts, isEmpty);
    });
    test('non-bridge event', () async {
      await bridge.processMessage('{"type":"Other","data":{}}');
      expect(mock.sentScripts, isEmpty);
    });
  });

  group('dispose', () {
    test('disposes browser bridge', () {
      bridge.dispose();
      expect(mock.disposed, isTrue);
    });
    test('called twice does not throw', () {
      bridge.dispose();
      bridge.dispose();
    });
  });
}
