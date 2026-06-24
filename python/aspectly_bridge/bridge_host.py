import json
import threading
from concurrent.futures import Future

from .browser_bridge import NullLogger
from .errors import BridgeException
from .protocol import BridgeErrorType, BridgeEventType, BridgeResultType

_BRIDGE_EVENT_TYPE = "BridgeEvent"
DEFAULT_TIMEOUT_MS = 100000


class BridgeHost(object):
    """Manages bidirectional communication between native Python code and
    JavaScript via the Aspectly protocol. The Python equivalent of the .NET
    ``BridgeHost``.

    The host is loop-agnostic: ``send`` and ``initialize`` return
    ``concurrent.futures.Future`` objects, and handlers are plain callables
    ``handler(params) -> result`` (returning a JSON-encodable value or raising).
    """

    def __init__(self, browser_bridge, logger=None, timeout_ms=DEFAULT_TIMEOUT_MS):
        self._browser = browser_bridge
        self._logger = logger if logger is not None else NullLogger()
        self._timeout_ms = timeout_ms
        self._lock = threading.RLock()

        self._initialized = False
        self._remote_init_received = False
        self._init_result_received = False
        self._disposed = False
        self._request_counter = 0
        self._init_future = None

        self._supported_methods = []
        self._handlers = {}
        self._pending = {}

        self.on_initialized = None

        self._browser.on_message = self.process_message
        self._logger.info("[BridgeHost] Created and subscribed to messages")

    # region properties

    @property
    def is_initialized(self):
        with self._lock:
            return self._initialized

    @property
    def supported_methods(self):
        with self._lock:
            return list(self._supported_methods)

    @property
    def registered_methods(self):
        with self._lock:
            return list(self._handlers.keys())

    # region handler registration

    def register_handler(self, method, handler):
        with self._lock:
            self._handlers[method] = handler
        self._logger.info("[BridgeHost] Registered handler: %s" % method)

    def unregister_handler(self, method):
        with self._lock:
            self._handlers.pop(method, None)
        self._logger.info("[BridgeHost] Unregistered handler: %s" % method)

    # region incoming

    def process_message(self, message_json):
        if not message_json:
            return
        self._logger.debug("[BridgeHost] Received: %s" % message_json)

        try:
            wrapper = json.loads(message_json)
        except (ValueError, TypeError):
            self._logger.debug("[BridgeHost] JSON parse error")
            return

        if not isinstance(wrapper, dict) or wrapper.get("type") != _BRIDGE_EVENT_TYPE:
            return
        event = wrapper.get("event")
        if not isinstance(event, dict):
            return
        event_type = event.get("type")
        data = event.get("data")

        if event_type == BridgeEventType.INIT:
            self._handle_init(data)
        elif event_type == BridgeEventType.REQUEST:
            self._handle_request(data)
        elif event_type == BridgeEventType.RESULT:
            self._handle_result(data)
        elif event_type == BridgeEventType.INIT_RESULT:
            with self._lock:
                self._init_result_received = True
            self._logger.info("[BridgeHost] InitResult received from JS")
            self._try_resolve_init()

    def _handle_init(self, data):
        if isinstance(data, dict) and isinstance(data.get("methods"), list):
            with self._lock:
                self._supported_methods = [str(m) for m in data["methods"]]
            self._logger.info(
                "[BridgeHost] JS supports methods: %s" % ", ".join(self._supported_methods)
            )
        with self._lock:
            self._remote_init_received = True
        # Match the JS protocol: only send InitResult, not our Init.
        self._send_event(BridgeEventType.INIT_RESULT, True)
        self._logger.info("[BridgeHost] Sent InitResult")
        self._try_resolve_init()

    def _try_resolve_init(self):
        with self._lock:
            should = (
                self._init_result_received
                and self._remote_init_received
                and not self._initialized
            )
            if should:
                self._initialized = True
                future = self._init_future
                self._init_future = None
            else:
                future = None
        if should:
            if future is not None and not future.done():
                future.set_result(None)
            self._logger.info("[BridgeHost] Bridge fully initialized")
            callback = self.on_initialized
            if callback is not None:
                callback()

    def _handle_request(self, data):
        if not isinstance(data, dict):
            return
        method = data.get("method")
        request_id = data.get("request_id")
        if method is None or request_id is None:
            return
        params = data.get("params", {})

        with self._lock:
            handler = self._handlers.get(method)

        if handler is None:
            self._logger.warn("[BridgeHost] Unknown method: %s" % method)
            result = self._error_result(
                method, request_id, BridgeErrorType.UNSUPPORTED_METHOD,
                "Method '%s' is not registered" % method,
            )
        else:
            try:
                value = handler(params)
                result = {
                    "type": BridgeResultType.SUCCESS,
                    "method": method,
                    "request_id": request_id,
                    "data": value,
                }
                self._logger.debug("[BridgeHost] Handler '%s' completed successfully" % method)
            except BridgeException as e:
                self._logger.error("[BridgeHost] Handler '%s' failed" % method, e)
                result = self._error_result(method, request_id, BridgeErrorType.REJECTED, e.message)
            except Exception as e:  # noqa: BLE001
                self._logger.error("[BridgeHost] Handler '%s' failed" % method, e)
                result = self._error_result(method, request_id, BridgeErrorType.REJECTED, str(e))

        self._send_event(BridgeEventType.RESULT, result)

    def _handle_result(self, data):
        if not isinstance(data, dict):
            return
        request_id = data.get("request_id")
        if request_id is None:
            return
        with self._lock:
            future = self._pending.pop(request_id, None)
        if future is None or future.done():
            return

        if data.get("type") == BridgeResultType.SUCCESS:
            future.set_result(data.get("data"))
        else:
            error = data.get("error") or {}
            error_type = error.get("error_type") or BridgeErrorType.REJECTED
            message = error.get("error_message")
            future.set_exception(BridgeException(error_type, message))

    # region outgoing

    def _send_event(self, event_type, data):
        wrapper = {"type": _BRIDGE_EVENT_TYPE, "event": {"type": event_type, "data": data}}
        json_text = json.dumps(wrapper)
        # Double-encode to produce a safe JS string literal (matches .NET / Swift).
        js_literal = json.dumps(json_text)
        script = "(function(){window.postMessage(%s, '*');return true;})();" % js_literal
        try:
            self._browser.execute_script(script)
            self._logger.debug("[BridgeHost] Sent: %s" % json_text)
        except Exception as e:  # noqa: BLE001
            self._logger.error("[BridgeHost] Failed to send event", e)

    def send(self, method, params=None, timeout_ms=None):
        """Send a request to the JavaScript side. Returns a ``Future`` that
        resolves with the result or raises ``BridgeException``."""
        if not self.is_initialized:
            raise BridgeException(BridgeErrorType.BRIDGE_NOT_AVAILABLE, "Bridge not initialized")
        with self._lock:
            supported = method in self._supported_methods
        if not supported:
            raise BridgeException(
                BridgeErrorType.UNSUPPORTED_METHOD,
                "Method '%s' not supported by JS side" % method,
            )

        timeout = timeout_ms if timeout_ms is not None else self._timeout_ms
        with self._lock:
            self._request_counter += 1
            request_id = str(self._request_counter)
            future = Future()
            self._pending[request_id] = future

        self._send_event(BridgeEventType.REQUEST, {
            "method": method,
            "request_id": request_id,
            "params": params if params is not None else {},
        })
        self._logger.debug("[BridgeHost] Sent request: %s (id=%s)" % (method, request_id))

        def on_timeout():
            with self._lock:
                pending = self._pending.pop(request_id, None)
            if pending is not None and not pending.done():
                pending.set_exception(BridgeException(
                    BridgeErrorType.METHOD_EXECUTION_TIMEOUT,
                    "Request '%s' timed out after %dms" % (method, timeout),
                ))

        timer = threading.Timer(timeout / 1000.0, on_timeout)
        timer.daemon = True
        timer.start()
        future.add_done_callback(lambda _f: timer.cancel())
        return future

    def initialize(self, handlers=None):
        """Register handlers and send ``Init``; returns a ``Future`` that
        resolves when the handshake completes."""
        if handlers:
            for method, handler in handlers.items():
                self.register_handler(method, handler)
        with self._lock:
            future = Future()
            self._init_future = future
            methods = list(self._handlers.keys())
        self._send_event(BridgeEventType.INIT, {"methods": methods})
        self._logger.info("[BridgeHost] Sent Init with methods: %s" % ", ".join(methods))
        return future

    def dispose(self):
        with self._lock:
            if self._disposed:
                return
            self._disposed = True
            pending = list(self._pending.values())
            self._pending.clear()
            init_future = self._init_future
            self._init_future = None

        self._browser.on_message = None
        self._browser.dispose()

        cancellation = BridgeException(BridgeErrorType.BRIDGE_NOT_AVAILABLE, "Bridge disposed")
        if init_future is not None and not init_future.done():
            init_future.set_exception(cancellation)
        for future in pending:
            if not future.done():
                future.set_exception(cancellation)
        self._logger.info("[BridgeHost] Disposed")

    def _error_result(self, method, request_id, error_type, message):
        return {
            "type": BridgeResultType.ERROR,
            "method": method,
            "request_id": request_id,
            "error": {"error_type": error_type, "error_message": message},
        }
