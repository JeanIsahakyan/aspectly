import { BaseTransport } from '../BaseTransport';
import type { TransportListener, TransportUnsubscribe, TransportDetector } from '../types';

/**
 * Fallback transport for browser environments.
 * Listens for window.postMessage events, allowing parent windows
 * to receive messages from child iframes.
 */
export class PostMessageTransport extends BaseTransport {
  readonly name = 'postmessage';

  isAvailable(): boolean {
    return typeof this.getWindow()?.addEventListener === 'function';
  }

  send(message: string): void {
    const win = this.getWindow();
    if (!win) return;
    win.postMessage(message, '*');
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
export const postMessageDetector: TransportDetector = {
  name: 'postmessage',
  priority: 10, // Lowest priority — fallback for any browser environment
  detect: () => {
    return typeof window !== 'undefined' &&
           typeof window.addEventListener === 'function';
  },
  createTransport: () => new PostMessageTransport(),
};
