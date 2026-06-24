# Aspectly WebKitGTK Example (Python, Linux)

A Python GTK app demonstrating bidirectional communication between native Python
and JavaScript using `aspectly-bridge` with WebKitGTK.

## Requirements (Linux)

```bash
# Debian/Ubuntu
sudo apt install python3-gi gir1.2-gtk-3.0 gir1.2-webkit2-4.1
```

## Run

```bash
python3 examples/webkitgtk/main.py
```

## What it shows

- **Native Python → web (JS)**: the buttons at the top call `greet`, `getTime`,
  `calculate` in the web page; the result appears in the status label.
- **Web (JS) → native Python**: the buttons inside the WebView call the native
  `ping` / `echo` / `add` / `getSystemInfo` handlers (logged to the console via
  `ConsoleLogger`).

The Python side wraps a `WebKit2.WebView` in a `WebKitGTKBrowserBridge`,
registers handlers, and calls `bridge.initialize()` once the page finishes
loading. The web page uses the `@aspectly/core` browser bundle
(`web/aspectly.js`) and auto-detects the host via the **same** WebKit transport
as native iOS/macOS (`window.webkit.messageHandlers.aspectly`).

## Regenerating the browser bundle

```bash
# from the repo root, after `pnpm build`
npx esbuild packages/core/src/browser.ts \
  --bundle --format=iife --platform=browser --target=es2018 \
  --outfile=examples/webkitgtk/web/aspectly.js
```
