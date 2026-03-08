/**
 * Low-level bridge core handling platform-specific message passing
 * Now delegates to @aspectly/transports for platform detection
 */

import { detectTransport, type Transport } from '@aspectly/transports';

export type Event = unknown;

interface BridgeCoreEvent {
  type: string;
  event: Event;
}

export type BridgeCoreListener = (event: Event) => void;

/**
 * BridgeCore handles the low-level platform detection and message serialization.
 * It provides static methods for wrapping events, creating listeners, and sending messages.
 *
 * Platform detection is now handled by @aspectly/transports which supports:
 * - CefSharp (Chromium Embedded Framework for .NET)
 * - React Native WebView
 * - Iframe (window.parent.postMessage)
 * - Custom transports via TransportRegistry
 */
export class BridgeCore {
  private static BRIDGE_EVENT_TYPE = 'BridgeEvent';
  private static transport: Transport | null = null;

  private static isJSONObject = (str: string): boolean => {
    return str.startsWith('{') && str.endsWith('}');
  };

  /**
   * Get the current transport (lazy initialization)
   */
  private static getTransport(): Transport {
    if (!BridgeCore.transport) {
      BridgeCore.transport = detectTransport();
    }
    return BridgeCore.transport;
  }

  /**
   * Set a custom transport (useful for testing or manual configuration)
   */
  public static setTransport(transport: Transport): void {
    BridgeCore.transport = transport;
  }

  /**
   * Reset transport to auto-detect on next use
   */
  public static resetTransport(): void {
    BridgeCore.transport = null;
  }

  /**
   * Get the name of the current transport
   */
  public static getTransportName(): string {
    return BridgeCore.getTransport().name;
  }

  /**
   * Wraps an event in the bridge protocol format
   */
  public static wrapBridgeEvent = (event: Event): string => {
    return JSON.stringify({
      event,
      type: BridgeCore.BRIDGE_EVENT_TYPE,
    });
  };

  /**
   * Creates a listener wrapper that parses incoming messages
   */
  static wrapListener =
    (listener: BridgeCoreListener) =>
    (data?: string): void => {
      if (typeof data !== 'string') {
        return;
      }
      if (!data) {
        return;
      }
      let processedData = data;
      // iOS wraps JSON with additional quotes
      if (processedData.startsWith("'") && processedData.endsWith("'")) {
        processedData = processedData.substring(1, processedData.length - 1);
      }
      if (!BridgeCore.isJSONObject(processedData)) {
        return;
      }
      try {
        const eventData: BridgeCoreEvent = JSON.parse(processedData);
        if (!eventData || eventData.type !== BridgeCore.BRIDGE_EVENT_TYPE) {
          return;
        }
        listener(eventData.event);
      } catch {
        // Ignore parse errors
      }
    };

  /**
   * Sends an event to the parent context using the detected transport
   */
  static sendEvent = (event: Event): void => {
    const bridgeEvent = BridgeCore.wrapBridgeEvent(event);
    const transport = BridgeCore.getTransport();
    transport.send(bridgeEvent);
  };

  /**
   * Subscribes to incoming messages via the detected transport
   * @returns Cleanup function to unsubscribe
   */
  static subscribe = (listener: BridgeCoreListener): VoidFunction => {
    const transport = BridgeCore.getTransport();
    const wrappedListener = BridgeCore.wrapListener(listener);
    return transport.subscribe(wrappedListener);
  };
}
