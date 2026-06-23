# Aspectly Swift / SwiftUI Example

A SwiftUI application demonstrating bidirectional communication between native
Swift and JavaScript using `AspectlyBridge` with `WKWebView`. Works on **macOS
and iOS**.

## Requirements

- macOS 11+ / iOS 14+
- Swift 5.9+ (Xcode 15+)

## Running the Example

### macOS (Swift Package Manager)

```bash
cd examples/swiftui
swift run
```

### iOS / macOS (Xcode)

Open the package in Xcode and run:

```bash
cd examples/swiftui
open Package.swift
```

Select the `AspectlyExample` scheme. To run on an iOS simulator, drop
`ContentView.swift` into an iOS app target (the same code works unchanged).

## What This Example Shows

### Swift Side (`ContentView.swift`)

Registers handlers that JavaScript can call, then initializes the bridge:

```swift
let model = AspectlyWebViewModel(url: indexHtmlURL)

// Register handlers
model.bridge.registerHandler("ping") { _ in "pong" }
model.bridge.registerHandler("echo") { (p: EchoParams) in p.message }
model.bridge.registerHandler("add") { (p: AddParams) in p.a + p.b }

// Initialize and wait for JS
try await model.bridge.initialize()

// Call JS methods
let result: GreetResult = try await model.bridge.send("greet", params: GreetParams(name: "Swift"))
```

### JavaScript Side (`Resources/web/index.html`)

Uses the `@aspectly/core` browser bundle (`aspectly.js`):

```html
<script src="aspectly.js"></script>
<script>
  // Initialize with handlers that Swift can call
  window.aspectlyBridge.init({
    greet: async (params) => ({ message: `Hello, ${params.name}!` }),
    getTime: async () => ({ time: new Date().toISOString() }),
    calculate: async (params) => ({ sum: params.a + params.b, product: params.a * params.b }),
  });

  // Call Swift methods
  const result = await window.aspectlyBridge.send('ping');
  console.log(result); // "pong"
</script>
```

## Project Structure

```
examples/swiftui/
├── Package.swift
└── Sources/AspectlyExample/
    ├── AspectlyExampleApp.swift     # @main SwiftUI App
    ├── ContentView.swift            # Bridge setup, handlers, JS calls
    └── Resources/web/
        ├── index.html               # Demo page
        └── aspectly.js              # @aspectly/core browser bundle (IIFE)
```

## Regenerating the browser bundle

`aspectly.js` is a standalone IIFE bundle of `@aspectly/core` (with the WebKit
transport inlined). To regenerate it after changing the JS packages:

```bash
# from the repo root, after `pnpm build`
npx esbuild packages/core/src/browser.ts \
  --bundle --format=iife --platform=browser --target=es2018 \
  --outfile=examples/swiftui/Sources/AspectlyExample/Resources/web/aspectly.js
```

## Features Demonstrated

1. **Handler Registration** — both Swift and JS register methods the other side can call
2. **Type-Safe Parameters** — using `Codable` structs for request/response DTOs
3. **Async/await** — all calls are asynchronous
4. **Event Logging** — real-time logging of bridge communication
5. **Status Indicator** — visual feedback for connection state
