import { BaseTransport } from '../BaseTransport';
import type { TransportListener, TransportUnsubscribe, TransportDetector } from '../types';

declare global {
  interface Window {
    CefSharp?: {
      PostMessage: (message: string) => void;
      BindObjectAsync: (...args: unknown[]) => Promise<void>;
    };
  }
}

/**
 * Transport for CefSharp (Chromium Embedded Framework for .NET)
 * Used in desktop applications with embedded Chromium browsers
 *
 * @example
 * ```typescript
 * import { CefSharpTransport } from '@aspectly/transports/cefsharp';
 *
 * const transport = new CefSharpTransport();
 * if (transport.isAvailable()) {
 *   transport.send(JSON.stringify({ type: 'hello' }));
 * }
 * ```
 */
export class CefSharpTransport extends BaseTransport {
  readonly name = 'cefsharp';

  isAvailable(): boolean {
    const win = this.getWindow();
    return typeof win?.CefSharp?.PostMessage === 'function';
  }

  send(message: string): void {
    const win = this.getWindow();
    if (!win?.CefSharp?.PostMessage) {
      console.warn('[CefSharpTransport] CefSharp.PostMessage is not available');
      return;
    }
    win.CefSharp.PostMessage(message);
  }

  subscribe(listener: TransportListener): TransportUnsubscribe {
    const win = this.getWindow();
    if (!win) {
      return () => {};
    }

    // CefSharp sends messages via window.postMessage
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
export const cefSharpDetector: TransportDetector = {
  name: 'cefsharp',
  priority: 100, // Highest priority - check first
  detect: () => {
    return typeof window !== 'undefined' &&
           typeof window.CefSharp?.PostMessage === 'function';
  },
  createTransport: () => new CefSharpTransport(),
};
