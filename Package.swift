// swift-tools-version:5.9
import PackageDescription

// Aspectly Swift bridge — iOS, macOS, and visionOS.
// The manifest lives at the repository root so the package can be consumed via
//   .package(url: "https://github.com/JeanIsahakyan/aspectly.git", from: "2.1.0")
// Sources and tests live under `swift/`.
let package = Package(
    name: "AspectlyBridge",
    platforms: [
        .iOS(.v14),
        .macOS(.v11),
        .visionOS(.v1),
    ],
    products: [
        // Core bridge library (Foundation only, no WebKit dependency).
        .library(name: "AspectlyBridge", targets: ["AspectlyBridge"]),
        // WKWebView browser bridge + SwiftUI integration.
        .library(name: "AspectlyBridgeWebKit", targets: ["AspectlyBridgeWebKit"]),
    ],
    targets: [
        .target(
            name: "AspectlyBridge",
            path: "swift/Sources/AspectlyBridge"
        ),
        .target(
            name: "AspectlyBridgeWebKit",
            dependencies: ["AspectlyBridge"],
            path: "swift/Sources/AspectlyBridgeWebKit"
        ),
        .testTarget(
            name: "AspectlyBridgeTests",
            dependencies: ["AspectlyBridge"],
            path: "swift/Tests/AspectlyBridgeTests"
        ),
    ]
)
