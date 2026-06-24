/// Event types for the Aspectly bridge protocol.
/// Values match the `@aspectly/core` strings exactly.
class BridgeEventType {
  static const String init = 'Init';
  static const String initResult = 'InitResult';
  static const String request = 'Request';
  static const String result = 'Result';
}

/// Result types for bridge responses.
class BridgeResultType {
  static const String success = 'Success';
  static const String error = 'Error';
}

/// Error types for bridge protocol errors.
/// Values match the `@aspectly/core` `error_type` strings exactly.
class BridgeErrorType {
  static const String methodExecutionTimeout = 'METHOD_EXECUTION_TIMEOUT';
  static const String unsupportedMethod = 'UNSUPPORTED_METHOD';
  static const String rejected = 'REJECTED';
  static const String bridgeNotAvailable = 'BRIDGE_NOT_AVAILABLE';
}
