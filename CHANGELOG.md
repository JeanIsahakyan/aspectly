# Changelog

All notable changes to Aspectly Bridge are documented here.

## [2.0.14] - 2026-03-16

### Fixed
- **dotnet**: Remove premature `_initResultReceived` in `HandleInitAsync` that caused dockable panes to skip `InitializeAsync` entirely

## [2.0.13] - 2026-03-16

### Fixed
- **js**: `handleInit` sets `initResultReceived` for implicit confirmation — fixes cases where JS Init is sent before the other side is listening

## [2.0.12] - 2026-03-16

### Fixed
- **js**: Handle C# error format in `handleRequestResult` — checks both `data` and `result.error` fields
- **js**: Added `error` field to `BridgeResultEvent` type

## [2.0.11] - 2026-03-16

### Fixed
- **js/dotnet**: `init()` / `InitializeAsync()` now resolves only when both `Init` and `InitResult` are received (`tryResolveInit`). Guarantees `supports()` and `isAvailable()` work immediately after init resolves.

## [2.0.10] - 2026-03-16

### Fixed
- **js**: Handle C# error format in `handleRequestResult`

## [2.0.9] - 2026-03-16

### Fixed
- **ci**: Use `pnpm publish` to resolve `workspace:*` protocol before publishing to npm

## [2.0.8] - 2026-03-16

### Changed
- **dotnet**: `HandleInitAsync` now only sends `InitResult` (not `Init`), matching JS `handleInit` protocol
- **dotnet**: `InitializeAsync` now sends `Init` and awaits `InitResult` from JS (was fire-and-forget)
- **ci**: Switched npm publish from `NPM_TOKEN` to OIDC trusted publishing with provenance

### Added
- **js**: `registerHandler(method, handler)` and `unregisterHandler(method)` on `BridgeBase` and `BridgeInternal`
- **dotnet**: `InitializeAsync(handlers)` overload for combined handler registration + init
- **dotnet**: Handler execution timeout in `HandleRequestAsync` (default 100s, matching JS)
- **dotnet**: Configurable `timeoutMs` parameter in `BridgeHost` constructor

## [2.0.7] - 2026-03-11

### Added
- **dotnet**: Thread-safe WPF dispatcher support in `CefSharpBrowserBridge`
- **dotnet**: Auto-send `InitResult` on receiving `Init` from JS

## [2.0.6] - 2026-03-10

### Fixed
- **ci**: Allow landing deploy from `workflow_dispatch` trigger

## [2.0.5] - 2026-03-08

### Fixed
- **ci**: Stage only `package.json` files, never `.npmrc`
- Remove leaked `.npmrc` with npm token
- Add `.npmrc` to `.gitignore`
- Remove yarn configuration remnants

## [2.0.4] - 2026-03-08

### Fixed
- **ci**: Add `actions:write` permission and `EnableWindowsTargeting` for NuGet pack

## [2.0.3] - 2026-03-08

### Added
- **ci**: Publish .NET packages to NuGet on release

### Fixed
- **landing**: Fix widget/popup routing for GitHub Pages base path

## [2.0.2] - 2026-03-08

### Fixed
- **ci**: Trigger landing deploy via `workflow_dispatch` after release
- **ci**: Remove changeset publish workflow
- **landing**: Dedupe React to prevent duplicate instances

## [2.0.1] - 2026-03-08

### Fixed
- **ci**: Pull `--rebase` before pushing version bump
- **ci**: Deploy landing page on release with updated version

### Added
- **landing**: Inject package version at build time

## [2.0.0] - 2026-03-08

### Added
- Complete rewrite of the bridge protocol
- Bidirectional typed communication between .NET and JavaScript
- `@aspectly/core` — platform-agnostic bridge core with `AspectlyBridge`, `BridgeInternal`, `BridgeBase`
- `@aspectly/transports` — pluggable transport layer: CefSharp, React Native, iframe, window, null
- `@aspectly/react-native` — `useAspectlyWebView` hook for React Native WebView
- `@aspectly/react-native-web` — `useAspectlyWebView` hook for React Native Web (iframe fallback)
- `@aspectly/web` — `useAspectlyIframe` and `useAspectlyWindow` hooks
- `Aspectly.Bridge` — .NET core library with `BridgeHost`, typed handler registration, `SendAsync`
- `Aspectly.Bridge.CefSharp` — CefSharp WPF adapter (`CefSharpBrowserBridge`)
- `Aspectly.Bridge.WebView2` — WebView2 adapter (`WebView2BrowserBridge`)
- Init/InitResult handshake protocol
- Request/Response with request IDs and timeout
- Error types: `REJECTED`, `UNSUPPORTED_METHOD`, `METHOD_EXECUTION_TIMEOUT`, `BRIDGE_NOT_AVAILABLE`
- Landing page with live demo
- CI/CD: GitHub Actions for build, test, npm publish, NuGet publish, landing deploy
- Examples: dotnet CefSharp, React Native, web iframe

### Changed
- Protocol redesign from v1 — fully bidirectional with typed handlers
- Transport layer extracted to separate package with auto-detection

## [1.0.0] - 2025-12-05

Renamed from **Aspect** to **Aspectly**.

### Changed
- Rename Aspect to Aspectly across all packages and repository
- Update author name to Zhan Isaakian
- Update all repository URLs

### Added
- Monorepo structure with pnpm workspaces
- Comprehensive test suite with vitest
- CI/CD with GitHub Actions
- ESLint configuration

---

*Previously published as `@jeanisahakyan/chirp` (v0.1.x). The project was renamed twice: Chirp → Aspect → Aspectly.*

---

## [0.1.11] - 2023-03-11 (as Chirp / Aspect)

### Fixed
- Prevent unnecessary window init events

## [0.1.10] - 2023-03-11

### Fixed
- React Native Web detection fix

## [0.1.9] - 2023-03-11

### Fixed
- Browser version fixes

## [0.1.8] - 2022-11-20

### Fixed
- Version fix
- Codestyle fixes

## [0.1.7]

### Fixed
- Support `ReactNativeWebView.postMessage` for all platforms

## [0.1.6]

### Fixed
- Support `ReactNativeWebView.postMessage` for all platforms

## [0.1.5]

### Fixed
- Core error fixes

## [0.1.4]

### Added
- Browser version support (UMD bundle)

## [0.1.3]

### Added
- Initial public release as `@jeanisahakyan/chirp`

## [0.1.1] - 2022

### Added
- Initial commit — Chirp bridge core with React Native WebView support
- Platform detection: CefSharp, React Native WebView, browser
- Bidirectional message passing with JSON serialization
