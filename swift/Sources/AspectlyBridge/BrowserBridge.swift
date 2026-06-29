import Foundation

/// Abstraction for browser message passing.
///
/// Implement this protocol to support different web views (WKWebView, Android
/// WebView wrappers, custom embeddings, mocks for testing). The Swift
/// equivalent of .NET's `IBrowserBridge`.
public protocol BrowserBridge: AnyObject {
    /// Whether the browser is initialized and ready for communication.
    var isReady: Bool { get }

    /// Invoked when a message is received from JavaScript.
    /// `BridgeHost` assigns this closure when it is constructed.
    var onMessage: ((String) -> Void)? { get set }

    /// Send a message to JavaScript by executing a script.
    /// - Parameter script: The JavaScript code to execute.
    func executeScript(_ script: String) async throws

    /// Release any resources and detach from the underlying web view.
    func dispose()
}
