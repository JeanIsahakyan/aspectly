import Foundation

/// Result types for bridge responses.
/// Raw values match the `@aspectly/core` strings exactly.
public enum BridgeResultType: String, Codable {
    /// Method executed successfully.
    case success = "Success"
    /// Method execution failed.
    case error = "Error"
}
