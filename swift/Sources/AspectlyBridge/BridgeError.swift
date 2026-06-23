import Foundation

/// Error type for bridge protocol errors. The Swift equivalent of .NET's
/// `BridgeException`.
public struct BridgeError: Error, Equatable, CustomStringConvertible {
    /// The type of bridge error that occurred.
    public let errorType: BridgeErrorType

    /// Human-readable error message.
    public let message: String

    public init(_ errorType: BridgeErrorType, _ message: String? = nil) {
        self.errorType = errorType
        self.message = message ?? errorType.rawValue
    }

    public var description: String { message }
}

extension BridgeError: LocalizedError {
    public var errorDescription: String? { message }
}
