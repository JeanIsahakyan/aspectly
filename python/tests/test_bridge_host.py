import json

import pytest

from aspectly_bridge import (
    BridgeErrorType,
    BridgeException,
    BridgeHost,
    BrowserBridge,
)


class MockBrowserBridge(BrowserBridge):
    def __init__(self):
        self.on_message = None
        self.sent = []
        self.disposed = False

    @property
    def is_ready(self):
        return True

    def execute_script(self, script):
        self.sent.append(script)

    def dispose(self):
        self.disposed = True


def msg(event_type, data):
    return json.dumps({"type": "BridgeEvent", "event": {"type": event_type, "data": data}})


def handshake(bridge, js_methods):
    fut = bridge.initialize()
    bridge.process_message(msg("Init", {"methods": js_methods}))
    bridge.process_message(msg("InitResult", True))
    fut.result(timeout=1)


@pytest.fixture
def setup():
    mock = MockBrowserBridge()
    bridge = BridgeHost(mock)
    yield bridge, mock
    bridge.dispose()


# --- handler registration ---

def test_register_handler_adds(setup):
    bridge, _ = setup
    bridge.register_handler("test", lambda p: "result")
    assert "test" in bridge.registered_methods


def test_unregister_handler_removes(setup):
    bridge, _ = setup
    bridge.register_handler("test", lambda p: "result")
    bridge.unregister_handler("test")
    assert "test" not in bridge.registered_methods


def test_same_name_overwrites(setup):
    bridge, mock = setup
    bridge.register_handler("test", lambda p: "first")
    bridge.register_handler("test", lambda p: "second")
    bridge.process_message(msg("Request", {"method": "test", "request_id": "1", "params": {}}))
    assert "second" in mock.sent[-1]


# --- init handshake ---

def test_init_updates_supported(setup):
    bridge, _ = setup
    bridge.process_message(msg("Init", {"methods": ["a", "b"]}))
    assert "a" in bridge.supported_methods and "b" in bridge.supported_methods


def test_handle_init_only_sends_init_result(setup):
    bridge, mock = setup
    bridge.register_handler("myMethod", lambda p: "r")
    bridge.process_message(msg("Init", {"methods": ["jsMethod"]}))
    assert len(mock.sent) == 1
    assert "InitResult" in mock.sent[0]


def test_initializes_only_when_both(setup):
    bridge, _ = setup
    fired = []
    bridge.on_initialized = lambda: fired.append(True)
    bridge.process_message(msg("InitResult", True))
    assert not bridge.is_initialized
    assert not fired
    bridge.process_message(msg("Init", {"methods": ["jsMethod"]}))
    assert bridge.is_initialized
    assert fired


def test_initialize_waits_for_both(setup):
    bridge, _ = setup
    handshake(bridge, ["jsMethod"])
    assert bridge.is_initialized
    assert "jsMethod" in bridge.supported_methods


def test_initialize_with_handlers(setup):
    bridge, _ = setup
    fut = bridge.initialize({"m1": lambda p: "r1", "m2": lambda p: "r2"})
    assert "m1" in bridge.registered_methods and "m2" in bridge.registered_methods
    bridge.process_message(msg("Init", {"methods": ["jsMethod"]}))
    bridge.process_message(msg("InitResult", True))
    fut.result(timeout=1)
    assert bridge.is_initialized


# --- incoming requests ---

def test_request_calls_handler(setup):
    bridge, _ = setup
    called = []
    bridge.register_handler("m", lambda p: called.append(True) or {"ok": True})
    bridge.process_message(msg("Request", {"method": "m", "request_id": "1", "params": {}}))
    assert called


def test_unknown_method_error(setup):
    bridge, mock = setup
    bridge.process_message(msg("Request", {"method": "nope", "request_id": "1", "params": {}}))
    assert "UNSUPPORTED_METHOD" in mock.sent[-1]


def test_handler_returns_data(setup):
    bridge, mock = setup
    bridge.register_handler("m", lambda p: {"value": 42})
    bridge.process_message(msg("Request", {"method": "m", "request_id": "1", "params": {}}))
    assert "Success" in mock.sent[-1] and "42" in mock.sent[-1]


def test_handler_throws_rejected(setup):
    bridge, mock = setup

    def boom(p):
        raise RuntimeError("boom")

    bridge.register_handler("m", boom)
    bridge.process_message(msg("Request", {"method": "m", "request_id": "1", "params": {}}))
    assert "REJECTED" in mock.sent[-1] and "boom" in mock.sent[-1]


def test_typed_params(setup):
    bridge, mock = setup
    bridge.register_handler("add", lambda p: p["a"] + p["b"])
    bridge.process_message(msg("Request", {"method": "add", "request_id": "1", "params": {"a": 10, "b": 20}}))
    assert "30" in mock.sent[-1]


# --- sending requests ---

def test_send_success(setup):
    bridge, _ = setup
    handshake(bridge, ["jsMethod"])
    fut = bridge.send("jsMethod")
    bridge.process_message(msg("Result", {"type": "Success", "data": "test result", "request_id": "1"}))
    assert fut.result(timeout=1) == "test result"


def test_send_error(setup):
    bridge, _ = setup
    handshake(bridge, ["jsMethod"])
    fut = bridge.send("jsMethod")
    bridge.process_message(msg("Result", {
        "type": "Error",
        "error": {"error_type": "REJECTED", "error_message": "failed"},
        "request_id": "1",
    }))
    with pytest.raises(BridgeException) as exc:
        fut.result(timeout=1)
    assert exc.value.error_type == BridgeErrorType.REJECTED
    assert exc.value.message == "failed"


def test_send_timeout(setup):
    bridge, _ = setup
    handshake(bridge, ["jsMethod"])
    fut = bridge.send("jsMethod", None, 50)
    with pytest.raises(BridgeException) as exc:
        fut.result(timeout=1)
    assert exc.value.error_type == BridgeErrorType.METHOD_EXECUTION_TIMEOUT


def test_send_before_init(setup):
    bridge, _ = setup
    with pytest.raises(BridgeException) as exc:
        bridge.send("m")
    assert exc.value.error_type == BridgeErrorType.BRIDGE_NOT_AVAILABLE


def test_send_unsupported(setup):
    bridge, _ = setup
    handshake(bridge, ["other"])
    with pytest.raises(BridgeException) as exc:
        bridge.send("m")
    assert exc.value.error_type == BridgeErrorType.UNSUPPORTED_METHOD


# --- ignored messages ---

def test_empty(setup):
    bridge, mock = setup
    bridge.process_message("")
    assert mock.sent == []


def test_invalid_json(setup):
    bridge, mock = setup
    bridge.process_message("not json {")
    assert mock.sent == []


def test_non_bridge_event(setup):
    bridge, mock = setup
    bridge.process_message('{"type":"Other","data":{}}')
    assert mock.sent == []


# --- dispose ---

def test_dispose_disposes_browser(setup):
    bridge, mock = setup
    bridge.dispose()
    assert mock.disposed


def test_dispose_twice(setup):
    bridge, _ = setup
    bridge.dispose()
    bridge.dispose()
