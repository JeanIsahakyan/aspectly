import Foundation
import WebKit
import AspectlyBridge

/// `BrowserBridge` implementation for `WKWebView`, available on both iOS and
/// macOS. The Swift equivalent of .NET's `CefSharpBrowserBridge` /
/// `WebView2BrowserBridge`.
///
/// Message passing:
/// - JS → native: `window.webkit.messageHandlers.<name>.postMessage(message)`
///   delivered via `WKScriptMessageHandler`.
/// - native → JS: `webView.evaluateJavaScript("window.postMessage(...)")`.
///
/// Instances are expected to be created and used on the main thread (the
/// `WKWebView` requirement); `@unchecked Sendable` reflects that confinement.
public final class WKWebViewBrowserBridge: NSObject, BrowserBridge, @unchecked Sendable {
    /// The default `WKScriptMessageHandler` name. The JS-side WebKit transport
    /// looks for `window.webkit.messageHandlers.aspectly`.
    public static let defaultHandlerName = "aspectly"

    private weak var webView: WKWebView?
    private let handlerName: String
    private var disposed = false

    public var onMessage: ((String) -> Void)?

    public var isReady: Bool { webView != nil }

    /// Create a bridge for the given web view.
    /// - Parameters:
    ///   - webView: The `WKWebView` to bind to.
    ///   - handlerName: The script message handler name (default `"aspectly"`).
    public init(webView: WKWebView, handlerName: String = WKWebViewBrowserBridge.defaultHandlerName) {
        self.webView = webView
        self.handlerName = handlerName
        super.init()
        // `add(_:name:)` must run on the main thread.
        let controller = webView.configuration.userContentController
        controller.add(MessageHandlerProxy(self), name: handlerName)
    }

    fileprivate func receive(_ body: Any) {
        if let string = body as? String {
            onMessage?(string)
        }
    }

    public func executeScript(_ script: String) async throws {
        try await evaluate(script)
    }

    @MainActor
    private func evaluate(_ script: String) async throws {
        guard let webView = webView else {
            throw BridgeError(.bridgeNotAvailable, "WebView was deallocated")
        }
        // The script is wrapped by `BridgeHost` in an IIFE returning `true`, so
        // the async `evaluateJavaScript` returns a serializable value and does
        // not raise the "unsupported result type" error.
        _ = try await webView.evaluateJavaScript(script)
    }

    public func dispose() {
        if disposed { return }
        disposed = true
        onMessage = nil
        let name = handlerName
        let removeHandler: () -> Void = { [weak self] in
            guard let self = self else { return }
            self.webView?.configuration.userContentController
                .removeScriptMessageHandler(forName: name)
        }
        if Thread.isMainThread {
            removeHandler()
        } else {
            DispatchQueue.main.async(execute: removeHandler)
        }
    }
}

/// Weak proxy so the user content controller does not retain the bridge,
/// avoiding a retain cycle (`WKUserContentController` strongly holds handlers).
private final class MessageHandlerProxy: NSObject, WKScriptMessageHandler {
    private weak var bridge: WKWebViewBrowserBridge?

    init(_ bridge: WKWebViewBrowserBridge) {
        self.bridge = bridge
        super.init()
    }

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        bridge?.receive(message.body)
    }
}
