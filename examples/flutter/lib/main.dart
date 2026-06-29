import 'dart:async';

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:aspectly_bridge/aspectly_bridge.dart';

void main() => runApp(const MyApp());

/// A `BrowserBridge` backed by a webview_flutter [WebViewController].
class WebViewFlutterBrowserBridge implements BrowserBridge {
  WebViewFlutterBrowserBridge(this.controller) {
    controller.addJavaScriptChannel(
      'AspectlyFlutter',
      onMessageReceived: (JavaScriptMessage m) => onMessage?.call(m.message),
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

class MyApp extends StatefulWidget {
  const MyApp({super.key});
  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late final WebViewController _controller;
  late final BridgeHost _bridge;
  String _lastResult = 'Tap a button to call into the web (Dart -> JS).';
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted);

    final browserBridge = WebViewFlutterBrowserBridge(_controller);
    _bridge = BridgeHost(browserBridge);

    // Native handlers JS can call.
    _bridge.registerHandler('ping', (params) => 'pong');
    _bridge.registerHandler('echo', (params) => params['message']);
    _bridge.registerHandler('add', (params) => params['a'] + params['b']);
    _bridge.registerHandler('getSystemInfo', (params) => <String, dynamic>{
          'platform': 'Flutter',
          'dartVersion': '3.x',
        });

    _controller.setNavigationDelegate(NavigationDelegate(
      onPageFinished: (_) async {
        if (_ready) return;
        _ready = true;
        await _bridge.initialize();
      },
    ));

    // Load the bundled demo page (assets/web/index.html on a Flutter asset
    // server, or your hosted widget URL).
    _controller.loadFlutterAsset('web/index.html');
  }

  Future<void> _call(String method, [dynamic params]) async {
    try {
      final dynamic r = await _bridge.send<dynamic>(method, params);
      setState(() => _lastResult = 'Dart -> JS  $method -> $r');
    } catch (e) {
      setState(() => _lastResult = 'Error: $e');
    }
  }

  @override
  void dispose() {
    _bridge.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('Aspectly Flutter Example')),
        body: Column(
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const Text('Native (Dart) -> call into the web (JS):',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  Wrap(spacing: 8, children: <Widget>[
                    ElevatedButton(
                        onPressed: () => _call('greet', <String, dynamic>{'name': 'Flutter'}),
                        child: const Text('greet()')),
                    ElevatedButton(
                        onPressed: () => _call('getTime'), child: const Text('getTime()')),
                    ElevatedButton(
                        onPressed: () => _call('calculate', <String, dynamic>{'a': 5, 'b': 3}),
                        child: const Text('calculate()')),
                  ]),
                  const SizedBox(height: 8),
                  Text(_lastResult, style: const TextStyle(fontFamily: 'monospace')),
                ],
              ),
            ),
            Expanded(child: WebViewWidget(controller: _controller)),
          ],
        ),
      ),
    );
  }
}
