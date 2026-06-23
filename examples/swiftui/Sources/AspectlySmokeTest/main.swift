import Foundation
import WebKit
import AspectlyBridge
import AspectlyBridgeWebKit

#if canImport(AppKit)
import AppKit
#elseif canImport(UIKit)
import UIKit
#endif

// A headless, app-hosted runtime smoke test for the WKWebView bridge.
// It hosts a real NSApplication (macOS) / UIApplication (iOS) so the WebKit
// web-content process runs, performs the handshake over the WebKit transport,
// and exercises calls in both directions. Prints "SMOKE PASS"/"SMOKE FAIL".
//
// macOS:  swift run AspectlySmokeTest <path-to-index.html>
// iOS:    launched on the simulator with `web/index.html` bundled in the app.

setbuf(stdout, nil)

private struct GreetParams: Encodable { let name: String }
private struct GreetResult: Decodable { let message: String }
private struct CalcParams: Encodable { let a: Int; let b: Int }
private struct CalcResult: Decodable { let sum: Int; let product: Int }
private struct TimeResult: Decodable { let time: String }
private struct EchoParams: Decodable { let message: String }
private struct AddParams: Decodable { let a: Int; let b: Int }
private struct SmokeSystemInfo: Encodable { let platform: String; let osVersion: String }

private func report(_ message: String) {
    print(message)
    NSLog("%@", message) // also goes to the unified log (visible via `simctl spawn ... log`)
}

private func runSmoke(webView: WKWebView, bridge: BridgeHost) {
    // Timeout guard.
    Task.detached {
        try? await Task.sleep(nanoseconds: 60_000_000_000)
        report("SMOKE FAIL: timed out")
        exit(3)
    }
    Task { @MainActor in
        do {
            try await bridge.initialize()
            report("SMOKE: initialized=\(bridge.isInitialized) jsMethods=\(bridge.supportedMethods)")

            let greet: GreetResult = try await bridge.send("greet", params: GreetParams(name: "Native"))
            report("SMOKE: native->JS greet -> \(greet.message)")
            let calc: CalcResult = try await bridge.send("calculate", params: CalcParams(a: 2, b: 40))
            report("SMOKE: native->JS calculate -> sum=\(calc.sum) product=\(calc.product)")

            _ = try await webView.evaluateJavaScript(
                "window.aspectlyBridge.send('ping').then(function(r){window.__pong=JSON.stringify(r);},function(){window.__pong='ERR';}); null"
            )
            var pong: String?
            for _ in 0..<200 {
                if let value = try await webView.evaluateJavaScript("(window.__pong || null)") as? String {
                    pong = value
                    break
                }
                try await Task.sleep(nanoseconds: 50_000_000)
            }
            report("SMOKE: JS->native ping -> \(pong ?? "nil")")

            guard bridge.isInitialized,
                  greet.message.contains("Hello, Native"),
                  calc.sum == 42, calc.product == 80,
                  pong == "\"pong\"" else {
                report("SMOKE FAIL: unexpected results")
                exit(1)
            }
            report("SMOKE PASS")
            // Exit (for scripted/CI runs) only when asked; otherwise stay open so
            // the connected web view remains visible on the device/simulator.
            if ProcessInfo.processInfo.environment["ASPECTLY_SMOKE_EXIT"] == "1" {
                exit(0)
            }
        } catch {
            report("SMOKE FAIL: \(error)")
            exit(1)
        }
    }
}

/// Runs the smoke test once the page has finished loading (so the native `Init`
/// is sent while the JS bridge is listening).
final class SmokeCoordinator: NSObject, WKNavigationDelegate {
    private let bridge: BridgeHost
    private var started = false

    init(bridge: BridgeHost) {
        self.bridge = bridge
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard !started else { return }
        started = true
        runSmoke(webView: webView, bridge: bridge)
    }
}

private func makeBridge(for webView: WKWebView) -> (BridgeHost, SmokeCoordinator) {
    let browserBridge = WKWebViewBrowserBridge(webView: webView)
    let bridge = BridgeHost(browserBridge: browserBridge)
    // Register the same native handlers the macOS/Android examples expose, so
    // the JS demo page lists ping / echo / add / getSystemInfo.
    bridge.registerHandler("ping") { _ in "pong" }
    bridge.registerHandler("echo") { (p: EchoParams) in p.message }
    bridge.registerHandler("add") { (p: AddParams) in p.a + p.b }
    bridge.registerHandler("getSystemInfo") { _ -> SmokeSystemInfo in
        #if canImport(UIKit)
        let platform = "iOS"
        #else
        let platform = "macOS"
        #endif
        return SmokeSystemInfo(platform: platform, osVersion: ProcessInfo.processInfo.operatingSystemVersionString)
    }
    let coordinator = SmokeCoordinator(bridge: bridge)
    webView.navigationDelegate = coordinator
    return (bridge, coordinator)
}

#if canImport(AppKit)

let arguments = CommandLine.arguments
guard arguments.count >= 2 else {
    FileHandle.standardError.write(Data("usage: AspectlySmokeTest <path-to-index.html>\n".utf8))
    exit(2)
}
let indexURL = URL(fileURLWithPath: arguments[1])

let app = NSApplication.shared
app.setActivationPolicy(.accessory)

let webView = WKWebView(frame: NSRect(x: 0, y: 0, width: 400, height: 400))
let window = NSWindow(
    contentRect: NSRect(x: 0, y: 0, width: 400, height: 400),
    styleMask: [.borderless], backing: .buffered, defer: false
)
window.contentView = webView
let (bridge, coordinator) = makeBridge(for: webView)
_ = (bridge, coordinator) // retained for the lifetime of the process

webView.loadFileURL(indexURL, allowingReadAccessTo: indexURL.deletingLastPathComponent())
app.run()

#elseif canImport(UIKit)

/// iOS demo screen: native Swift buttons that call INTO the web (native -> JS),
/// a result label, and the WKWebView (whose own buttons call native -> JS -> ...
/// i.e. JS -> native). Demonstrates both directions on the simulator.
final class SmokeViewController: UIViewController {
    private let webView = WKWebView(frame: .zero)
    private var bridge: BridgeHost!
    private var coordinator: SmokeCoordinator!
    private let resultLabel = UILabel()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground

        let (bridge, coordinator) = makeBridge(for: webView)
        self.bridge = bridge
        self.coordinator = coordinator

        let title = UILabel()
        title.text = "Native (Swift) → call into the web (JS):"
        title.font = .boldSystemFont(ofSize: 15)

        resultLabel.numberOfLines = 0
        resultLabel.font = .monospacedSystemFont(ofSize: 12, weight: .regular)
        resultLabel.textColor = .secondaryLabel
        resultLabel.text = "Tap a button — the result from JS appears here."

        let controls = UIStackView(arrangedSubviews: [
            title,
            button("Call greet() in web", #selector(callGreet)),
            button("Call getTime() in web", #selector(callGetTime)),
            button("Call calculate(5, 3) in web", #selector(callCalculate)),
            resultLabel,
        ])
        controls.axis = .vertical
        controls.spacing = 8
        controls.alignment = .fill
        controls.translatesAutoresizingMaskIntoConstraints = false
        webView.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(controls)
        view.addSubview(webView)
        let guide = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            controls.topAnchor.constraint(equalTo: guide.topAnchor, constant: 12),
            controls.leadingAnchor.constraint(equalTo: guide.leadingAnchor, constant: 16),
            controls.trailingAnchor.constraint(equalTo: guide.trailingAnchor, constant: -16),
            webView.topAnchor.constraint(equalTo: controls.bottomAnchor, constant: 12),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])

        guard let indexURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "web")
            ?? Bundle.main.url(forResource: "index", withExtension: "html") else {
            report("SMOKE FAIL: index.html not found in bundle")
            exit(2)
        }
        webView.loadFileURL(indexURL, allowingReadAccessTo: indexURL.deletingLastPathComponent())
    }

    private func button(_ titleText: String, _ action: Selector) -> UIButton {
        let button = UIButton(type: .system)
        button.setTitle(titleText, for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 15, weight: .medium)
        button.contentHorizontalAlignment = .leading
        button.addTarget(self, action: action, for: .touchUpInside)
        return button
    }

    private func show(_ text: String) {
        resultLabel.textColor = .label
        resultLabel.text = text
    }

    @objc private func callGreet() {
        Task { @MainActor in
            do {
                let result: GreetResult = try await bridge.send("greet", params: GreetParams(name: "iOS"))
                show("native → JS  greet(name: \"iOS\")\n→ \(result.message)")
            } catch { show("Error: \(error)") }
        }
    }

    @objc private func callGetTime() {
        Task { @MainActor in
            do {
                let result: TimeResult = try await bridge.send("getTime")
                show("native → JS  getTime()\n→ \(result.time)")
            } catch { show("Error: \(error)") }
        }
    }

    @objc private func callCalculate() {
        Task { @MainActor in
            do {
                let result: CalcResult = try await bridge.send("calculate", params: CalcParams(a: 5, b: 3))
                show("native → JS  calculate(a: 5, b: 3)\n→ sum=\(result.sum), product=\(result.product)")
            } catch { show("Error: \(error)") }
        }
    }
}

final class SmokeAppDelegate: NSObject, UIApplicationDelegate {
    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        let window = UIWindow(frame: UIScreen.main.bounds)
        window.rootViewController = SmokeViewController()
        window.makeKeyAndVisible()
        self.window = window
        return true
    }
}

UIApplicationMain(
    CommandLine.argc,
    CommandLine.unsafeArgv,
    nil,
    NSStringFromClass(SmokeAppDelegate.self)
)

#endif
