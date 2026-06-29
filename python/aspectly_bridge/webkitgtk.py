"""WebKitGTK browser bridge (Linux). Requires PyGObject + WebKit2GTK.

JS <-> native uses the same mechanism as WKWebView, so the embedded web content
auto-detects this host via the ``@aspectly/transports`` WebKit transport
(``window.webkit.messageHandlers.aspectly``) — no extra JS is required.
"""

from .browser_bridge import BrowserBridge

_GTK_IMPORT_ERROR = None
try:  # pragma: no cover - exercised only on Linux with GTK installed
    import gi

    gi.require_version("WebKit2", "4.1")
    from gi.repository import WebKit2  # noqa: F401

    _HAS_GTK = True
except Exception as exc:  # noqa: BLE001
    _HAS_GTK = False
    _GTK_IMPORT_ERROR = exc


class WebKitGTKBrowserBridge(BrowserBridge):
    """``BrowserBridge`` implementation for a WebKitGTK ``WebKit2.WebView``.

    - JS -> native: ``window.webkit.messageHandlers.<name>.postMessage(message)``
      delivered via a registered script message handler.
    - native -> JS: ``web_view.run_javascript("window.postMessage(...)")``.

    All WebView access must happen on the GTK main thread.
    """

    DEFAULT_HANDLER_NAME = "aspectly"

    def __init__(self, web_view, handler_name=DEFAULT_HANDLER_NAME):
        if not _HAS_GTK:
            raise RuntimeError(
                "WebKitGTKBrowserBridge requires PyGObject + WebKit2GTK (Linux). "
                "Import failed: %s" % _GTK_IMPORT_ERROR
            )
        self._web_view = web_view
        self._handler_name = handler_name
        self._disposed = False
        self.on_message = None

        ucm = web_view.get_user_content_manager()
        ucm.register_script_message_handler(handler_name)
        ucm.connect("script-message-received::" + handler_name, self._on_script_message)

    @property
    def is_ready(self):
        return not self._disposed

    def _on_script_message(self, user_content_manager, js_message):
        try:
            value = js_message.get_js_value().to_string()
        except Exception:  # noqa: BLE001
            value = None
        if value is not None and self.on_message is not None:
            self.on_message(value)

    def execute_script(self, script):
        # run_javascript must be called on the GTK main thread.
        self._web_view.run_javascript(script, None, None, None)

    def dispose(self):
        if self._disposed:
            return
        self._disposed = True
        self.on_message = None
        try:
            self._web_view.get_user_content_manager().unregister_script_message_handler(
                self._handler_name
            )
        except Exception:  # noqa: BLE001
            pass
