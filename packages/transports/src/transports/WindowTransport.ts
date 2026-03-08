import { BaseTransport } from '../BaseTransport';
import type { TransportListener, TransportUnsubscribe, TransportDetector } from '../types';

/**
 * Transport for popup windows opened via window.open()
 * Used when web content is displayed in a child window
 *
 * @example
 * ```typescript
 * // In child window (opened via window.open())
 * import { WindowTransport } from '@aspectly/transports/window';
 *
 * const transport = new WindowTransport();
 * if (transport.isAvailable()) {
 *   transport.send(JSON.stringify({ type: 'hello' }));
 * }
 * ```
 */
export class WindowTransport extends BaseTransport {
  readonly name = 'window';
  private readonly targetOrigin: string;

  /**
   * Create a window transport
   * @param targetOrigin Origin to send messages to (default: '*')
   */
  constructor(targetOrigin: string = '*') {
    super();
    this.targetOrigin = targetOrigin;
  }

  isAvailable(): boolean {
    const win = this.getWindow();
    if (!win) return false;
    return win.opener !== null && !win.opener.closed;
  }

  send(message: string): void {
    const win = this.getWindow();
    if (!win) {
      console.warn('[WindowTransport] Window is not available');
      return;
    }
    if (!win.opener || win.opener.closed) {
      console.warn('[WindowTransport] Opener window is not available');
      return;
    }
    win.opener.postMessage(message, this.targetOrigin);
  }

  subscribe(listener: TransportListener): TransportUnsubscribe {
    const win = this.getWindow();
    if (!win) {
      return () => {};
    }

    const handler = (event: MessageEvent): void => {
      if (typeof event.data === 'string') {
        listener(event.data);
      }
    };

    win.addEventListener('message', handler);
    return () => win.removeEventListener('message', handler);
  }
}

/**
 * Detector for auto-detection registry
 */
export const windowDetector: TransportDetector = {
  name: 'window',
  priority: 70, // Below iframe (80), above postmessage (10)
  detect: () => {
    try {
      return typeof window !== 'undefined' &&
        window.opener != null &&
        !window.opener.closed;
    } catch {
      return false;
    }
  },
  createTransport: () => new WindowTransport(),
};
