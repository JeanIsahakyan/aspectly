import type { BridgeHandler, BridgeHandlers, BridgeListener } from './types';
import type { BridgeInternal } from './BridgeInternal';

/**
 * BridgeBase provides the public API for bridge communication.
 * It wraps BridgeInternal and exposes a clean interface for consumers.
 */
export class BridgeBase {
  protected bridge: BridgeInternal;

  constructor(bridge: BridgeInternal) {
    this.bridge = bridge;
  }

  /**
   * Check if a method is supported by the other side
   * @param method Method name to check
   */
  public supports = (method: string): boolean => this.bridge.supports(method);

  /**
   * Check if the bridge is available (initialized)
   */
  public isAvailable = (): boolean => this.bridge.isAvailable();

  /**
   * Send a request to invoke a method on the other side
   * @param method Method name to invoke
   * @param params Parameters to pass
   * @returns Promise resolving with the result
   */
  public send = <TResult = unknown>(
    method: string,
    params: object = {}
  ): Promise<TResult> => {
    return this.bridge.send<TResult>(method, params);
  };

  /**
   * Subscribe to all result events
   * @param listener Callback for result events
   * @returns Subscription index
   */
  public subscribe = (listener: BridgeListener): number => {
    return this.bridge.subscribe(listener);
  };

  /**
   * Unsubscribe from result events
   * @param listener The listener to remove
   */
  public unsubscribe = (listener: BridgeListener): void => {
    return this.bridge.unsubscribe(listener);
  };

  /**
   * Register a single handler for a method.
   * Can be called before or after init().
   * @param method Method name to handle
   * @param handler Async function to handle the method
   */
  public registerHandler = (method: string, handler: BridgeHandler): void => {
    this.bridge.registerHandler(method, handler);
  };

  /**
   * Remove a previously registered handler.
   * @param method Method name to remove
   */
  public unregisterHandler = (method: string): void => {
    this.bridge.unregisterHandler(method);
  };

  /**
   * Initialize the bridge with handlers
   * @param handlers Map of method names to handler functions
   * @returns Promise resolving when initialization is complete
   */
  public init = (handlers?: BridgeHandlers): Promise<boolean> =>
    this.bridge.init(handlers);

  /**
   * Reset bridge state for a new connection context
   */
  public reset = (): void => this.bridge.reset();
}
