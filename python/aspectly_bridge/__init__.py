"""Aspectly bridge for Python — type-safe, bidirectional communication between
native Python (WebKitGTK) and JavaScript via the Aspectly protocol."""

from .bridge_host import BridgeHost, DEFAULT_TIMEOUT_MS
from .browser_bridge import BrowserBridge, BridgeLogger, NullLogger, ConsoleLogger
from .errors import BridgeException
from .protocol import BridgeErrorType, BridgeEventType, BridgeResultType

__all__ = [
    "BridgeHost",
    "DEFAULT_TIMEOUT_MS",
    "BrowserBridge",
    "BridgeLogger",
    "NullLogger",
    "ConsoleLogger",
    "BridgeException",
    "BridgeErrorType",
    "BridgeEventType",
    "BridgeResultType",
]

__version__ = "2.1.0"
