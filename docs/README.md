# Aspectly Documentation

Welcome to the Aspectly framework documentation! This guide will help you understand and use Aspectly for seamless communication between React Native WebViews, web iframes, and applications.

## 📚 Documentation Index

### Getting Started
- **[Main README](../README.md)** - Quick start guide and overview
- **[Installation Guide](#installation)** - Setup and installation instructions

### Core Documentation
- **[API Reference](API.md)** - Complete API documentation for all classes and methods
- **[Examples](EXAMPLES.md)** - Comprehensive examples and use cases
- **[Architecture](ARCHITECTURE.md)** - Internal architecture and design decisions
- **[Migration Guide](MIGRATION.md)** - Migration from legacy packages
- **[Publishing Guide](PUBLISHING.md)** - Releasing and publishing packages across registries

### Per-Platform Guides
- **[Swift (iOS/macOS/visionOS)](../swift)** - `AspectlyBridge` / `AspectlyBridgeWebKit` for WKWebView + SwiftUI
- **[Android (Kotlin)](../android)** - `io.github.jeanisahakyan:aspectly-bridge(-webview)` for Android WebView
- **[Dart (Flutter)](../dart)** - `aspectly_bridge` wrapping `webview_flutter`
- **[Python (Linux/WebKitGTK)](../python)** - `aspectly-bridge` for WebKitGTK / WKWebView-style hosts
- **[.NET (Windows)](../dotnet)** - `Aspectly.Bridge.CefSharp` / `Aspectly.Bridge.WebView2`

### Additional Resources
- **[Contributing Guide](../CONTRIBUTING.md)** - How to contribute to the project
- **[Code of Conduct](../CODE_OF_CONDUCT.md)** - Community guidelines

## 🚀 Quick Navigation

### For React Native Developers
1. Start with the [Main README](../README.md) for basic setup
2. Check [Examples](EXAMPLES.md) for React Native WebView communication patterns
3. Refer to [API Reference](API.md) for detailed method documentation

### For Web Developers
1. Read the [Main README](../README.md) for iframe communication setup
2. See [Examples](EXAMPLES.md) for web iframe communication patterns
3. Use [API Reference](API.md) for web-specific API details

### For Contributors
1. Review [Architecture](ARCHITECTURE.md) to understand the codebase
2. Check [Contributing Guide](../CONTRIBUTING.md) for development guidelines
3. Examine the example app in the `/examples` directory

## 📖 Documentation Structure

```
docs/
├── README.md          # This file - documentation index
├── API.md            # Complete API reference
├── EXAMPLES.md       # Usage examples and patterns
├── ARCHITECTURE.md   # Internal architecture guide
├── MIGRATION.md      # Migration guide from legacy packages
└── PUBLISHING.md     # Releasing and publishing packages
```

## 🎯 Framework Goals

Aspectly is designed to solve the complex problem of communication between different environments:

- **React Native ↔ WebView**: Seamless communication between native apps and web content
- **Parent Window ↔ Iframe**: Reliable iframe communication in web applications
- **Cross-Platform**: Works consistently across iOS, Android, and Web platforms
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Error Resilience**: Robust error handling and recovery mechanisms

## 🔧 Key Features

- **Promise-based API**: Modern async/await patterns for clean code
- **Automatic Platform Detection**: Works in WebView, iframe, and browser environments
- **Request-Response Pattern**: Reliable message passing with response handling
- **Event System**: Subscribe to bridge events for monitoring and debugging
- **Error Handling**: Comprehensive error types and recovery mechanisms
- **TypeScript Support**: Full type safety and IntelliSense support

## 📱 Supported Platforms

Aspectly ships **8 platform families**, all at version **2.1.0**:

| Platform family | Package(s) | Registry | Install |
|---|---|---|---|
| Web (iframe/popup) | `@aspectly/core`, `@aspectly/web` | npm | `npm i @aspectly/web` |
| React Native | `@aspectly/react-native` | npm | `npm i @aspectly/react-native react-native-webview` |
| React Native Web/Expo | `@aspectly/react-native-web` | npm | `npm i @aspectly/react-native-web` |
| Transports | `@aspectly/transports` | npm | `npm i @aspectly/transports` |
| .NET CefSharp/WebView2 (Windows) | `Aspectly.Bridge.CefSharp`, `Aspectly.Bridge.WebView2` | NuGet | `dotnet add package Aspectly.Bridge.WebView2` |
| iOS/macOS/visionOS | `AspectlyBridge`, `AspectlyBridgeWebKit` | SwiftPM + CocoaPods | `.package(url: "…/aspectly.git", from: "2.1.0")` or `pod 'AspectlyBridgeWebKit'` |
| Android | `io.github.jeanisahakyan:aspectly-bridge(-webview)` | Maven Central | `implementation("io.github.jeanisahakyan:aspectly-bridge-webview:2.1.0")` |
| Flutter (Dart) | `aspectly_bridge` | pub.dev | `flutter pub add aspectly_bridge` (`aspectly_bridge: ^2.1.0`) |
| Linux/WebKitGTK (Python) | `aspectly-bridge` | PyPI | `pip install "aspectly-bridge[webkitgtk]"` |

> Note: WebKitGTK reuses the WebKit transport — the same `window.webkit.messageHandlers.aspectly` mechanism as WKWebView.

The JS transport layer auto-detects its host with the following priority order: `cefsharp` (100) > `webkit` (95) > `react-native` (90) > `android` (85) > `flutter` (84) > `iframe` (80) > `window` (70) > `postmessage` (10).

See the [per-platform guides](#per-platform-guides) for native setup: [Swift](../swift), [Android](../android), [Dart](../dart), [Python](../python), and [.NET](../dotnet).

## 🛠️ Common Use Cases

### E-commerce Applications
- Native payment processing with web checkout flows
- Product catalog in WebView with native cart management
- Cross-platform user authentication

### Content Management
- Rich text editing in WebView with native file operations
- Document preview with native sharing capabilities
- Media upload from web interface to native storage

### Analytics Dashboards
- Real-time data visualization in WebView
- Native data collection with web-based reporting
- Cross-platform analytics synchronization

### Communication Apps
- Web-based chat interface with native notifications
- File sharing between web and native components
- Real-time messaging with native push notifications

## 🔍 Finding What You Need

### I want to...
- **Get started quickly** → [Main README](../README.md)
- **Understand the API** → [API Reference](API.md)
- **See working examples** → [Examples](EXAMPLES.md)
- **Learn the internals** → [Architecture](ARCHITECTURE.md)
- **Contribute to the project** → [Contributing Guide](../CONTRIBUTING.md)

### I'm looking for...
- **React Native WebView setup** → [Examples - Basic WebView Communication](EXAMPLES.md#basic-webview-communication)
- **Web iframe communication** → [Examples - Web Iframe Communication](EXAMPLES.md#web-iframe-communication)
- **Error handling patterns** → [Examples - Error Handling Examples](EXAMPLES.md#error-handling-examples)
- **Performance optimization** → [Architecture - Performance Considerations](ARCHITECTURE.md#performance-considerations)

## 🤝 Getting Help

If you can't find what you're looking for in the documentation:

1. **Check the examples** - The [Examples](EXAMPLES.md) document covers most common scenarios
2. **Review the API** - The [API Reference](API.md) has detailed method documentation
3. **Examine the code** - The example app in `/examples` shows real-world usage
4. **Open an issue** - Create a GitHub issue for bugs or feature requests
5. **Start a discussion** - Use GitHub Discussions for questions and ideas

## 📝 Documentation Updates

This documentation is maintained alongside the codebase. When contributing:

1. Update relevant documentation files
2. Add examples for new features
3. Update API documentation for API changes
4. Keep the architecture documentation current

## 📄 License

This documentation is part of the Aspectly project and is licensed under the MIT License. See the [LICENSE](../LICENSE) file for details.

---

**Happy coding with Aspectly!**
