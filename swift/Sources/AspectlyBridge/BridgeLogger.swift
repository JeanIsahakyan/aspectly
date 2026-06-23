import Foundation

/// Simple logging interface for `BridgeHost`.
/// Implement this to integrate with your logging framework.
public protocol BridgeLogger {
    /// Log a debug message.
    func debug(_ message: String)
    /// Log an info message.
    func info(_ message: String)
    /// Log a warning message.
    func warn(_ message: String)
    /// Log an error message with an optional underlying error.
    func error(_ message: String, _ error: Error?)
}

public extension BridgeLogger {
    func error(_ message: String) {
        error(message, nil)
    }
}

/// Default logger implementation that writes to the console.
public struct ConsoleLogger: BridgeLogger {
    public static let shared = ConsoleLogger()

    public init() {}

    public func debug(_ message: String) {
        print("[DEBUG] \(message)")
    }

    public func info(_ message: String) {
        print("[INFO] \(message)")
    }

    public func warn(_ message: String) {
        print("[WARN] \(message)")
    }

    public func error(_ message: String, _ error: Error?) {
        print("[ERROR] \(message)")
        if let error = error {
            print("  Error: \(error)")
        }
    }
}

/// Null logger that discards all messages (no-op).
public struct NullLogger: BridgeLogger {
    public static let shared = NullLogger()

    public init() {}

    public func debug(_ message: String) {}
    public func info(_ message: String) {}
    public func warn(_ message: String) {}
    public func error(_ message: String, _ error: Error?) {}
}
