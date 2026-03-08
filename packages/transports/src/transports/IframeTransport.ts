import { BaseTransport } from '../BaseTransport';
import type { TransportListener, TransportUnsubscribe, TransportDetector } from '../types';

/**
 * Transport for iframe/window.postMessage communication
 * Used when web content is displayed inside an iframe
 *
 * @example
 * ```typescript
 * import { IframeTransport } from '@aspectly/transports/iframe';
 *
 * const transport = new IframeTransport();
 * if (transport.isAvailable()) {
 *   transport.send(JSON.stringify({ type: 'hello' }));
 * }
 * ```
 */
export class IframeTransport extends BaseTransport {
  readonly name = 'iframe';
  private readonly targetOrigin: string;

  /**
   * Create an iframe transport
   * @param targetOrigin Origin to send messages to (default: '*')
   */
  constructor(targetOrigin: string = '*') {
    super();
    this.targetOrigin = targetOrigin;
  }

  isAvailable(): boolean {
    const win = this.getWindow();
    if (!win) return false;
    // Check if we're inside an iframe (parent !== self)
    return win.parent !== win;
  }

  send(message: string): void {
    const win = this.getWindow();
    if (!win) {
      console.warn('[IframeTransport] Window is not available');
      return;
    }
    if (win.parent === win) {
      console.warn('[IframeTransport] Not inside an iframe');
      return;
    }
    win.parent.postMessage(message, this.targetOrigin);
  }

  subscribe(listener: TransportListener): TransportUnsubscribe {
    const win = this.getWindow();
    if (!win) {
      return () => {};
    }

    const handler = (event: MessageEvent): void => {
      // Optionally filter by origin here if targetOrigin !== '*'
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
export const iframeDetector: TransportDetector = {
  name: 'iframe',
  priority: 80, // Lowest priority - fallback
  detect: () => {
    return typeof window !== 'undefined' && window.parent !== window;
  },
  createTransport: () => new IframeTransport(),
};
