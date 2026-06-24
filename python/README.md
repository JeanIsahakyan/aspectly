# aspectly-bridge (Python / WebKitGTK)

[![PyPI](https://img.shields.io/pypi/v/aspectly-bridge?style=flat-square&logo=pypi&color=3776AB)](https://pypi.org/project/aspectly-bridge/)

Type-safe, bidirectional bridge between native Python code and JavaScript
running in a **WebKitGTK** web view (Linux desktop). Speaks the
[Aspectly](https://github.com/JeanIsahakyan/aspectly) protocol, so the same
`@aspectly/core` web content runs unchanged across every host.

> WebKitGTK uses the **same** JS mechanism as WKWebView
> (`window.webkit.messageHandlers.aspectly`), so the embedded web content
> auto-detects this host through the existing `@aspectly/transports` WebKit
> transport — no Flutter/Android-style extra transport needed.

## Install

```bash
pip install aspectly-bridge

# For the WebKitGTK browser bridge (Linux):
#   system packages: gobject-introspection, gir1.2-webkit2-4.1 (or 4.0)
pip install "aspectly-bridge[webkitgtk]"
```

The core (`BridgeHost`) is pure Python with no dependencies. Only the
`WebKitGTKBrowserBridge` needs PyGObject + WebKit2GTK (Linux).

## Usage

```python
from aspectly_bridge import BridgeHost
from aspectly_bridge.webkitgtk import WebKitGTKBrowserBridge

bridge = BridgeHost(WebKitGTKBrowserBridge(web_view))

# Register handlers JS can call (before initialize).
bridge.register_handler("ping", lambda params: "pong")
bridge.register_handler("add", lambda params: params["a"] + params["b"])

# Initialize (returns a Future; resolves when the handshake completes).
bridge.initialize().result()

# Call a JS method (returns a Future).
result = bridge.send("greet", {"name": "Python"}).result()
print(result["message"])
```

`send` and `initialize` return `concurrent.futures.Future`. In a GTK app, the
result is delivered on the GLib main thread, so use `future.add_done_callback`
or `GLib.idle_add` rather than blocking `.result()` on the UI thread.

## API

```python
BridgeHost(browser_bridge, logger=None, timeout_ms=100000)

register_handler(method, handler)     # handler(params) -> result
unregister_handler(method)
initialize(handlers=None) -> Future
send(method, params=None, timeout_ms=None) -> Future
process_message(message_json)

is_initialized        # bool
supported_methods     # list[str]  (JS-side methods)
registered_methods    # list[str]  (Python-side handlers)
on_initialized        # callable or None
dispose()
```

`send` / handlers surface `BridgeException` with `error_type` one of
`BridgeErrorType.{UNSUPPORTED_METHOD, METHOD_EXECUTION_TIMEOUT, REJECTED, BRIDGE_NOT_AVAILABLE}`.

## Testing

```bash
cd python
python -m pytest          # the pure-Python core (no GTK required)
```

See [`examples/webkitgtk`](../examples/webkitgtk) for a runnable GTK app.

## Other platforms

This is the Python / WebKitGTK host (PyPI `aspectly-bridge`, **2.1.0**). The same
Aspectly protocol ships for Web (`@aspectly/web`), React Native
(`@aspectly/react-native`), React Native Web/Expo
(`@aspectly/react-native-web`), .NET CefSharp/WebView2
(`Aspectly.Bridge.CefSharp` / `Aspectly.Bridge.WebView2`), iOS/macOS/visionOS
(`AspectlyBridge`), Android (`com.aspectly:aspectly-bridge`), and Flutter
(`aspectly_bridge`) — all at version **2.1.0**. See the
[repository README](../README.md) for the full platform matrix.

## License

MIT
