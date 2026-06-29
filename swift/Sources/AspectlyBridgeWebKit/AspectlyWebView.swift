import Foundation
import SwiftUI
import WebKit
import AspectlyBridge

/// Owns a `WKWebView`, its `WKWebViewBrowserBridge`, and a `BridgeHost`, and
/// publishes the load/initialization state for SwiftUI. This is the Swift
/// equivalent of the `useAspectlyWebView` hook's `[bridge, loaded]` return.
///
/// ```swift
/// @StateObject private var model = AspectlyWebViewModel(url: URL(string: "https://app.example.com")!)
///
/// var body: some View {
///     AspectlyWebView(model: model)
///         .onChange(of: model.isLoaded) { loaded in
///             guard loaded else { return }
///             Task {
///                 try await model.bridge.initialize(handlers: [
///                     "getDeviceInfo": { _ in DeviceInfo(platform: "iOS") }
///                 ])
///             }
///         }
/// }
/// ```
@MainActor
public final class AspectlyWebViewModel: ObservableObject {
    /// The underlying web view (you usually do not need to touch this directly).
    public let webView: WKWebView

    /// The bridge host used to register handlers and call JS methods.
    public let bridge: BridgeHost

    /// Whether the web view has finished loading the page (`onLoad` equivalent).
    /// This does *not* mean the bridge handshake is complete — call
    /// `bridge.initialize(...)` once this becomes `true`.
    @Published public private(set) var isLoaded = false

    /// Whether the bridge handshake has completed.
    @Published public private(set) var isInitialized = false

    private let url: URL
    private let browserBridge: WKWebViewBrowserBridge
    private let navigationDelegate: NavigationDelegate

    /// Create a model that loads `url`.
    /// - Parameters:
    ///   - url: The page to load.
    ///   - configuration: Optional `WKWebViewConfiguration`.
    ///   - logger: Optional bridge logger.
    ///   - timeoutMs: Default request/handler timeout.
    public init(
        url: URL,
        configuration: WKWebViewConfiguration? = nil,
        logger: BridgeLogger = NullLogger.shared,
        timeoutMs: Int = BridgeHost.defaultTimeoutMs
    ) {
        self.url = url
        let webView = WKWebView(frame: .zero, configuration: configuration ?? WKWebViewConfiguration())
        self.webView = webView
        let browserBridge = WKWebViewBrowserBridge(webView: webView)
        self.browserBridge = browserBridge
        self.bridge = BridgeHost(browserBridge: browserBridge, logger: logger, timeoutMs: timeoutMs)
        self.navigationDelegate = NavigationDelegate()

        navigationDelegate.onFinish = { [weak self] in
            self?.isLoaded = true
        }
        webView.navigationDelegate = navigationDelegate

        bridge.onInitialized = { [weak self] in
            Task { @MainActor in self?.isInitialized = true }
        }
    }

    /// Load the configured URL. Called automatically when the view appears.
    public func load() {
        if url.isFileURL {
            webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        } else {
            webView.load(URLRequest(url: url))
        }
    }

    deinit {
        bridge.dispose()
    }

    private final class NavigationDelegate: NSObject, WKNavigationDelegate {
        var onFinish: (() -> Void)?

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            onFinish?()
        }
    }
}

#if os(iOS) || os(tvOS) || os(visionOS)

/// A SwiftUI view hosting the Aspectly-enabled `WKWebView`.
public struct AspectlyWebView: UIViewRepresentable {
    @ObservedObject private var model: AspectlyWebViewModel

    public init(model: AspectlyWebViewModel) {
        self._model = ObservedObject(wrappedValue: model)
    }

    public func makeUIView(context: Context) -> WKWebView {
        if model.webView.url == nil {
            model.load()
        }
        return model.webView
    }

    public func updateUIView(_ uiView: WKWebView, context: Context) {}
}

#elseif os(macOS)

/// A SwiftUI view hosting the Aspectly-enabled `WKWebView`.
public struct AspectlyWebView: NSViewRepresentable {
    @ObservedObject private var model: AspectlyWebViewModel

    public init(model: AspectlyWebViewModel) {
        self._model = ObservedObject(wrappedValue: model)
    }

    public func makeNSView(context: Context) -> WKWebView {
        if model.webView.url == nil {
            model.load()
        }
        return model.webView
    }

    public func updateNSView(_ nsView: WKWebView, context: Context) {}
}

#endif
