import Foundation

/// Event types for the Aspectly bridge protocol.
/// Raw values match the `@aspectly/core` strings exactly.
public enum BridgeEventType: String, Codable {
    /// Initialization message - exchange supported methods.
    case `init` = "Init"
    /// Initialization result - confirm initialization success/failure.
    case initResult = "InitResult"
    /// Request message - method invocation with params and request_id.
    case request = "Request"
    /// Result message - response with success/error data.
    case result = "Result"
}
