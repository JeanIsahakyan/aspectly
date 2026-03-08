# JavaScript / TypeScript API Reference

## @aspectly/core

### AspectlyBridge

Main entry point for embedded content (inside iframe/WebView).

```typescript
class AspectlyBridge extends BridgeBase {
  constructor(options?: BridgeOptions)
  destroy(): void  // cleanup transport subscriptions
}

interface BridgeOptions {
  timeout?: number  // default: 100000 (100s)
}
```

### BridgeBase

Public API layer. All hooks return a `BridgeBase` instance.

```typescript
class BridgeBase {
  constructor(bridge: BridgeInternal)
  init(handlers?: BridgeHandlers): Promise<boolean>
  send<TResult = unknown>(method: string, params?: object): Promise<TResult>
  supports(method: string): boolean
  isAvailable(): boolean
  subscribe(listener: BridgeListener): number
  unsubscribe(listener: BridgeListener): void
  reset(): void  // clear pending requests, supported methods, availability
}
```

### BridgeInternal

Core business logic. Not typically used directly — use AspectlyBridge or hooks instead.

```typescript
class BridgeInternal {
  constructor(sendEvent: (event: BridgeEvent) => void, options?: BridgeOptions)
  init(handlers?: BridgeHandlers): Promise<boolean>
  send<TResult = unknown>(method: string, params: object): Promise<TResult>
  supports(method: string): boolean
  isAvailable(): boolean
  subscribe(listener: BridgeListener): number
  unsubscribe(listener: BridgeListener): void
  handleCoreEvent(event: BridgeEvent): void
  handleRequest(request: BridgeRequestEvent): void
  reset(): void
}
```

### BridgeCore

Low-level platform detection and message serialization. Delegates to `@aspectly/transports`.

```typescript
class BridgeCore {
  static setTransport(transport: Transport): void
  static resetTransport(): void
  static getTransportName(): string
  static wrapBridgeEvent(event: Event): string
  static wrapListener(listener: BridgeCoreListener): (data?: string) => void
  static sendEvent(event: Event): void
  static subscribe(listener: BridgeCoreListener): VoidFunction
}
```

### Types

```typescript
// Enums
enum BridgeEventType {
  Request = 'Request',
  Result = 'Result',
  Init = 'Init',
  InitResult = 'InitResult',
}

enum BridgeResultType {
  Success = 'Success',
  Error = 'Error',
}

enum BridgeErrorType {
  METHOD_EXECUTION_TIMEOUT = 'METHOD_EXECUTION_TIMEOUT',
  UNSUPPORTED_METHOD = 'UNSUPPORTED_METHOD',
  REJECTED = 'REJECTED',
  BRIDGE_NOT_AVAILABLE = 'BRIDGE_NOT_AVAILABLE',
}

// Handler types
type BridgeHandler<TParams = object, TResult = unknown> = (params: TParams) => Promise<TResult>

interface BridgeHandlers {
  [key: string]: BridgeHandler<any, any>
}

type BridgeListener = (result: BridgeResultEvent) => void

// Event types
interface BridgeResultEvent {
  type?: BridgeResultType
  method?: string
  request_id?: string
  data?: BridgeResultData
}

interface BridgeRequestEvent {
  method: string
  params: object
  request_id?: string
}

interface BridgeInitEvent {
  methods: string[]
}

interface BridgeResultError {
  error_type: BridgeErrorType
  error_message?: string
}

type BridgeResultSuccess = object
type BridgeResultData = BridgeResultError | undefined | BridgeResultSuccess
type BridgeInitResultEvent = boolean

type BridgeEvent = {
  type: BridgeEventType
  data: BridgeData
}
```

### Browser Global

When using `@aspectly/core/browser` via script tag:

```html
<script src="@aspectly/core/browser"></script>
<script>
  // window.aspectlyBridge is auto-created
  window.aspectlyBridge.init({ ... });
</script>
```

---

## @aspectly/web

### useAspectlyIframe

```typescript
import { useAspectlyIframe } from '@aspectly/web';

function useAspectlyIframe(options: UseAspectlyIframeOptions): UseAspectlyIframeReturn

interface UseAspectlyIframeOptions extends BridgeOptions {
  url: string       // URL to load in the iframe
  timeout?: number   // handler execution timeout
}

type UseAspectlyIframeReturn = [
  bridge: BridgeBase,
  loaded: boolean,
  IframeComponent: FunctionComponent<AspectlyIframeProps>
]

interface AspectlyIframeProps extends Omit<IframeHTMLAttributes<HTMLIFrameElement>, 'src' | 'onLoad'> {
  onError?: (error: unknown) => void
  style?: CSSProperties
}
```

### useAspectlyWindow

```typescript
import { useAspectlyWindow } from '@aspectly/web';

function useAspectlyWindow(options: UseAspectlyWindowOptions): UseAspectlyWindowReturn

interface UseAspectlyWindowOptions extends BridgeOptions {
  url: string        // URL to open in the popup
  features?: string  // window features (e.g., 'width=800,height=600')
  target?: string    // window target (default: '_blank')
  timeout?: number
}

type UseAspectlyWindowReturn = [
  bridge: BridgeBase,
  loaded: boolean,
  open: () => void,    // open the popup
  close: () => void,   // close the popup
  isOpen: boolean      // whether popup is currently open
]
```

Re-exports from @aspectly/core: `AspectlyBridge`, `BridgeBase`, `BridgeErrorType`, `BridgeEventType`, `BridgeResultType`, and all types.

---

## @aspectly/react-native

### useAspectlyWebView

```typescript
import { useAspectlyWebView } from '@aspectly/react-native';

function useAspectlyWebView(options: UseAspectlyWebViewOptions): UseAspectlyWebViewReturn

interface UseAspectlyWebViewOptions extends BridgeOptions {
  url: string
  timeout?: number
}

type UseAspectlyWebViewReturn = [
  bridge: BridgeBase,
  loaded: boolean,
  WebViewComponent: FunctionComponent<AspectlyWebViewProps>
]

interface AspectlyWebViewProps extends Omit<WebViewProps, 'source' | 'onMessage' | 'onLoad' | 'ref'> {
  onError?: (error: unknown) => void
}
```

Peer dependencies: `react`, `react-native`, `react-native-webview`.

---

## @aspectly/react-native-web

Same `useAspectlyWebView` API as `@aspectly/react-native`. Platform-specific:
- **Web**: renders iframe via IframeTransport
- **Native (iOS/Android)**: re-exports from `@aspectly/react-native`

Uses `.native.ts` / `.ts` file convention for platform resolution.

```typescript
// Web-specific props (extends iframe attributes)
interface AspectlyWebViewProps {
  onError?: (error: unknown) => void
  style?: CSSProperties
  className?: string
  title?: string
  sandbox?: string
  allow?: string
}
```

---

## @aspectly/transports

### Transport Interface

```typescript
interface Transport {
  readonly name: string
  isAvailable(): boolean
  send(message: string): void
  subscribe(listener: TransportListener): TransportUnsubscribe
}

type TransportListener = (message: string) => void
type TransportUnsubscribe = () => void
```

### Built-in Transports

| Transport | Name | Priority | Detection |
|-----------|------|----------|-----------|
| CefSharpTransport | `'cefsharp'` | 100 | `window.CefSharp.PostMessage` |
| ReactNativeTransport | `'react-native'` | 90 | `window.ReactNativeWebView.postMessage` |
| IframeTransport | `'iframe'` | 80 | `window.parent !== window` |
| WindowTransport | `'window'` | 70 | `window.addEventListener('message')` |
| PostMessageTransport | `'postmessage'` | 10 | `window.postMessage` |
| NullTransport | `'null'` | - | Always available (no-op fallback) |

### BaseTransport

```typescript
abstract class BaseTransport implements Transport {
  abstract readonly name: string
  abstract isAvailable(): boolean
  abstract send(message: string): void
  abstract subscribe(listener: TransportListener): TransportUnsubscribe
  protected hasWindow(): boolean   // SSR-safe window check
  protected getWindow(): Window | null
}
```

### TransportRegistry

```typescript
class TransportRegistryClass {
  register(detector: TransportDetector): void
  unregister(name: string): void
  getDetectors(): readonly TransportDetector[]
  detect(forceRedetect?: boolean): Transport
  clearCache(): void
  reset(): void
}

const TransportRegistry: TransportRegistryClass

// Convenience functions
function detectTransport(forceRedetect?: boolean): Transport
function registerTransport(detector: TransportDetector): void

interface TransportDetector {
  readonly name: string
  readonly priority: number  // higher = checked first
  detect(): boolean
  createTransport(): Transport
}
```

### Constructor Notes

- `IframeTransport(targetOrigin?: string)` — defaults to `'*'`
- `WindowTransport(targetOrigin?: string)` — defaults to `'*'`
- Other transports have no constructor arguments
