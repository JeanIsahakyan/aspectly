// Main exports
export { AspectlyBridge } from './AspectlyBridge';
export { BridgeBase } from './BridgeBase';
export { BridgeInternal } from './BridgeInternal';
export { BridgeCore } from './BridgeCore';

// Re-export transports for convenience
export {
  detectTransport,
  registerTransport,
  TransportRegistry,
  CefSharpTransport,
  ReactNativeTransport,
  IframeTransport,
  NullTransport,
} from '@aspectly/transports';

export type {
  Transport,
  TransportDetector,
  TransportListener,
  TransportUnsubscribe,
} from '@aspectly/transports';

// Type exports
export type {
  BridgeEvent,
  BridgeData,
  BridgeHandler,
  BridgeHandlers,
  BridgeListener,
  BridgeOptions,
  BridgeRequestEvent,
  BridgeResultEvent,
  BridgeResultError,
  BridgeResultSuccess,
  BridgeResultData,
  BridgeInitEvent,
  BridgeInitResultEvent,
} from './types';

export {
  BridgeEventType,
  BridgeResultType,
  BridgeErrorType,
} from './types';
