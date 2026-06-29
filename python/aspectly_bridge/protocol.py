"""Protocol constants for the Aspectly bridge. Values match @aspectly/core."""


class BridgeEventType:
    INIT = "Init"
    INIT_RESULT = "InitResult"
    REQUEST = "Request"
    RESULT = "Result"


class BridgeResultType:
    SUCCESS = "Success"
    ERROR = "Error"


class BridgeErrorType:
    METHOD_EXECUTION_TIMEOUT = "METHOD_EXECUTION_TIMEOUT"
    UNSUPPORTED_METHOD = "UNSUPPORTED_METHOD"
    REJECTED = "REJECTED"
    BRIDGE_NOT_AVAILABLE = "BRIDGE_NOT_AVAILABLE"
