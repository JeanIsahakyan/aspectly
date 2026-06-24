from .protocol import BridgeErrorType


class BridgeException(Exception):
    """Exception type for bridge protocol errors.

    The Python equivalent of .NET's ``BridgeException`` / Swift's ``BridgeError``.
    """

    def __init__(self, error_type, message=None):
        self.error_type = error_type
        self.message = message if message is not None else error_type
        super().__init__(self.message)

    def __repr__(self):
        return "BridgeException(%s): %s" % (self.error_type, self.message)
