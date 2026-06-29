# Aspectly Android Example

An Android application demonstrating bidirectional communication between native
Kotlin and JavaScript using `AndroidWebViewBrowserBridge` with `WebView`.

## Requirements

- Android Studio (or Android SDK + `gradle`)
- Android API 21+ device or emulator

## Running the Example

```bash
cd examples/android
gradle :app:installDebug    # build and install on a connected device/emulator
```

Or open `examples/android` in Android Studio and run the `app` configuration.

The example uses a [Gradle composite build](https://docs.gradle.org/current/userguide/composite_builds.html)
(`includeBuild("../../android")`) so it consumes the Aspectly Android library
directly from this repository — no publishing required.

## What This Example Shows

### Kotlin Side (`MainActivity.kt`)

Registers handlers that JavaScript can call, then initializes the bridge:

```kotlin
val browserBridge = AndroidWebViewBrowserBridge(webView)
val bridge = BridgeHost(browserBridge)

bridge.registerHandler("ping") { _ -> "pong" }
bridge.registerTypedHandler<EchoParams>("echo") { p -> p.message }
bridge.registerTypedHandler<AddParams>("add") { p -> p.a + p.b }

// In WebViewClient.onPageFinished:
bridge.initialize()
val result: GreetResult = bridge.send("greet", GreetParams("Android"))
```

### JavaScript Side (`app/src/main/assets/web/index.html`)

Uses the `@aspectly/core` browser bundle (`aspectly.js`):

```html
<script src="aspectly.js"></script>
<script>
  window.aspectlyBridge.init({
    greet: async (params) => ({ message: `Hello, ${params.name}!` }),
    getTime: async () => ({ time: new Date().toISOString() }),
    calculate: async (params) => ({ sum: params.a + params.b, product: params.a * params.b }),
  });

  const result = await window.aspectlyBridge.send('ping');
  console.log(result); // "pong"
</script>
```

## Project Structure

```
examples/android/
├── settings.gradle.kts        # composite build -> ../../android
├── build.gradle.kts
└── app/
    ├── build.gradle.kts
    └── src/main/
        ├── AndroidManifest.xml
        ├── kotlin/com/aspectly/example/MainActivity.kt
        └── assets/web/
            ├── index.html       # Demo page
            └── aspectly.js      # @aspectly/core browser bundle (IIFE)
```

## Regenerating the browser bundle

`aspectly.js` is a standalone IIFE bundle of `@aspectly/core` (with the Android
transport inlined). To regenerate it after changing the JS packages:

```bash
# from the repo root, after `pnpm build`
npx esbuild packages/core/src/browser.ts \
  --bundle --format=iife --platform=browser --target=es2018 \
  --outfile=examples/android/app/src/main/assets/web/aspectly.js
```
