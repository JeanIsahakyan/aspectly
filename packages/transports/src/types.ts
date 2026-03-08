/**
 * Message listener callback type
 */
export type TransportListener = (message: string) => void;

/**
 * Cleanup function returned by subscribe
 */
export type TransportUnsubscribe = () => void;

/**
 * Transport interface - defines how messages are sent and received
 * between different environments (CefSharp, React Native, iframe, etc.)
 */
export interface Transport {
  /**
   * Unique name of the transport (e.g., 'cefsharp', 'react-native', 'iframe')
   */
  readonly name: string;

  /**
   * Check if this transport is available in the current environment
   */
  isAvailable(): boolean;

  /**
   * Send a message to the parent/host context
   * @param message Serialized message string (usually JSON)
   */
  send(message: string): void;

  /**
   * Subscribe to incoming messages from the parent/host context
   * @param listener Callback function for incoming messages
   * @returns Cleanup function to unsubscribe
   */
  subscribe(listener: TransportListener): TransportUnsubscribe;
}

/**
 * Transport factory function type
 */
export type TransportFactory = () => Transport;

/**
 * Transport detector - used for auto-detection
 */
export interface TransportDetector {
  /**
   * Name of the transport this detector is for
   */
  readonly name: string;

  /**
   * Priority for detection order (higher = checked first)
   * Default priorities: CefSharp=100, ReactNative=90, Iframe=80
   */
  readonly priority: number;

  /**
   * Check if this transport is available
   */
  detect(): boolean;

  /**
   * Create the transport instance
   */
  createTransport(): Transport;
}
