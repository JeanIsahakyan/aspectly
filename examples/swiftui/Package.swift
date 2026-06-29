// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "AspectlyExample",
    platforms: [
        .macOS(.v11),
        .iOS(.v14),
    ],
    dependencies: [
        .package(name: "AspectlyBridge", path: "../.."),
    ],
    targets: [
        .executableTarget(
            name: "AspectlyExample",
            dependencies: [
                .product(name: "AspectlyBridge", package: "AspectlyBridge"),
                .product(name: "AspectlyBridgeWebKit", package: "AspectlyBridge"),
            ],
            path: "Sources/AspectlyExample",
            resources: [
                .copy("Resources/web"),
            ]
        ),
        .executableTarget(
            name: "AspectlySmokeTest",
            dependencies: [
                .product(name: "AspectlyBridge", package: "AspectlyBridge"),
                .product(name: "AspectlyBridgeWebKit", package: "AspectlyBridge"),
            ],
            path: "Sources/AspectlySmokeTest"
        ),
    ]
)
