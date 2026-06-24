from abc import ABC, abstractmethod


class BrowserBridge(ABC):
    """Abstraction for browser message passing.

    Implement this for any web view (WebKitGTK, a mock for testing, etc.).
    The Python equivalent of .NET's ``IBrowserBridge``.

    ``BridgeHost`` assigns ``on_message`` (a callable taking the message string)
    when it is constructed.
    """

    on_message = None

    @property
    @abstractmethod
    def is_ready(self):
        """Whether the browser is ready for communication."""

    @abstractmethod
    def execute_script(self, script):
        """Send a message to JavaScript by executing ``script``."""

    @abstractmethod
    def dispose(self):
        """Release resources and detach from the underlying web view."""


class BridgeLogger(ABC):
    """Simple logging interface for ``BridgeHost``."""

    @abstractmethod
    def debug(self, message):
        ...

    @abstractmethod
    def info(self, message):
        ...

    @abstractmethod
    def warn(self, message):
        ...

    @abstractmethod
    def error(self, message, error=None):
        ...


class NullLogger(BridgeLogger):
    """Discards all log messages."""

    def debug(self, message):
        pass

    def info(self, message):
        pass

    def warn(self, message):
        pass

    def error(self, message, error=None):
        pass


class ConsoleLogger(BridgeLogger):
    """Prints log messages to stdout."""

    def debug(self, message):
        print("[DEBUG] %s" % message)

    def info(self, message):
        print("[INFO] %s" % message)

    def warn(self, message):
        print("[WARN] %s" % message)

    def error(self, message, error=None):
        print("[ERROR] %s" % message)
        if error is not None:
            print("  Error: %s" % error)
