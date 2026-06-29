import Foundation

/// Error types for bridge protocol errors.
/// Raw values match the `@aspectly/core` `error_type` strings exactly.
public enum BridgeErrorType: String, Codable {
    /// Method execution exceeded timeout.
    case methodExecutionTimeout = "METHOD_EXECUTION_TIMEOUT"
    /// Method is not supported/registered.
    case unsupportedMethod = "UNSUPPORTED_METHOD"
    /// Method execution was rejected (handler threw an exception).
    case rejected = "REJECTED"
    /// Bridge is not available or not initialized.
    case bridgeNotAvailable = "BRIDGE_NOT_AVAILABLE"
}
