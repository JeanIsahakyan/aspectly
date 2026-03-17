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

## [2.0.11] - 2026-03-16

### Fixed
- **js/dotnet**: `init()` / `InitializeAsync()` now resolves only when both `Init` and `InitResult` are received from the other side (`tryResolveInit`). Guarantees `supports()` and `isAvailable()` work immediately after init resolves.

## [2.0.10] - 2026-03-16

### Fixed
- **js**: Handle C# error format in `handleRequestResult` — C# sends errors with separate `error` field (`data=null`), now both formats handled

## [2.0.9] - 2026-03-16

### Fixed
- **ci**: Use `pnpm publish` to resolve `workspace:*` protocol before publishing to npm

## [2.0.8] - 2026-03-16

### Changed
- **dotnet**: `HandleInitAsync` now only sends `InitResult` (not `Init`), matching JS `handleInit` protocol
- **dotnet**: `InitializeAsync` now sends `Init` and awaits `InitResult` from JS side (was fire-and-forget)
- **ci**: Switched npm publish from `NPM_TOKEN` to OIDC trusted publishing with provenance

### Added
- **js**: `registerHandler(method, handler)` and `unregisterHandler(method)` on `BridgeBase` and `BridgeInternal`
- **dotnet**: `InitializeAsync(handlers)` overload for combined handler registration + init
- **dotnet**: Handler execution timeout in `HandleRequestAsync` (default 100s, matching JS)
- **dotnet**: Configurable `timeoutMs` parameter in `BridgeHost` constructor

## [2.0.7] - 2026-03-11

### Added
- **dotnet**: Thread-safe dispatcher support in `CefSharpBrowserBridge`
- **dotnet**: Auto-send `InitResult` on receiving `Init`

## [2.0.6] - 2026-03-10

### Fixed
- Package publishing improvements

## [2.0.5] - 2026-03-08

### Fixed
- Minor fixes and version bump

## [2.0.0] - 2026-03-08

### Added
- Complete rewrite of Aspectly Bridge protocol
- Bidirectional typed communication between .NET and JavaScript
- `@aspectly/core` — platform-agnostic bridge core
- `@aspectly/transports` — pluggable transport layer (CefSharp, React Native, iframe, window)
- `@aspectly/react-native` — React Native WebView hook
- `@aspectly/react-native-web` — React Native Web (iframe) hook
- `@aspectly/web` — iframe and popup window hooks
- `Aspectly.Bridge` — .NET core library
- `Aspectly.Bridge.CefSharp` — CefSharp WPF adapter
- `Aspectly.Bridge.WebView2` — WebView2 adapter

### Changed
- Protocol redesign with Init/InitResult handshake
- Type-safe handler registration
- Request/response with timeout support

## [1.0.0] - 2025-12-05

### Added
- Initial stable release

## [0.1.x] - 2022-2023

### Added
- Early development releases
