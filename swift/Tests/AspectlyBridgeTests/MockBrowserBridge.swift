import Foundation
@testable import AspectlyBridge

/// In-memory `BrowserBridge` for unit tests. Captures scripts sent to JS and
/// lets tests feed messages back as if they came from JS.
final class MockBrowserBridge: BrowserBridge {
    var isReady = true
    var onMessage: ((String) -> Void)?
    private(set) var sentScripts: [String] = []
    var disposed = false

    private let queue = DispatchQueue(label: "mock.browser.bridge")

    func executeScript(_ script: String) async throws {
        queue.sync { sentScripts.append(script) }
    }

    func dispose() {
        disposed = true
    }

    /// Snapshot of scripts captured so far (thread-safe).
    func scripts() -> [String] {
        queue.sync { sentScripts }
    }

    /// Simulate a message arriving from JavaScript.
    func receive(_ message: String) {
        onMessage?(message)
    }
}

// MARK: - Test helpers

enum BridgeTestSupport {
    /// Build a serialized bridge message wrapper.
    static func message(_ type: BridgeEventType, data: JSONValue) -> String {
        let wrapper: JSONValue = .object([
            "type": .string("BridgeEvent"),
            "event": .object([
                "type": .string(type.rawValue),
                "data": data,
            ]),
        ])
        return (try? wrapper.jsonString()) ?? ""
    }

    /// Parse a script sent by `BridgeHost` back into the bridge event wrapper.
    static func parseSentScript(_ script: String) -> JSONValue? {
        guard let start = script.range(of: "window.postMessage(")?.upperBound,
              let end = script.range(of: ", '*')", range: start..<script.endIndex)?.lowerBound else {
            return nil
        }
        let literal = String(script[start..<end])
        guard let literalData = literal.data(using: .utf8),
              let innerJson = try? JSONDecoder().decode(String.self, from: literalData),
              let wrapper = try? JSONValue(jsonString: innerJson) else {
            return nil
        }
        return wrapper
    }

    /// Poll until `condition` is true or the timeout elapses.
    static func wait(
        timeout: TimeInterval = 3,
        _ condition: @escaping () -> Bool
    ) async {
        let deadline = Date().addingTimeInterval(timeout)
        while !condition() && Date() < deadline {
            try? await Task.sleep(nanoseconds: 5_000_000)
        }
    }
}
