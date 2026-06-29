import { BaseTransport } from '../BaseTransport';
import type { TransportListener, TransportUnsubscribe, TransportDetector } from '../types';

/** The WKWebView script message handler name registered by the native host. */
export const WEBKIT_HANDLER_NAME = 'aspectly';

interface WebKitMessageHandler {
  postMessage: (message: unknown) => void;
}

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: Record<string, WebKitMessageHandler | undefined>;
    };
  }
}

/**
 * Transport for native WKWebView hosts on iOS and macOS (Swift / SwiftUI).
 * Used when web content is displayed inside an app that embeds the Aspectly
 * Swift `WKWebViewBrowserBridge`.
 *
 * - JS → native: `window.webkit.messageHandlers.aspectly.postMessage(message)`
 * - native → JS: native injects `window.postMessage(...)`, received via the
 *   `message` event.
 *
 * @example
 * ```typescript
 * import { WebKitTransport } from '@aspectly/transports/webkit';
 *
 * const transport = new WebKitTransport();
 * if (transport.isAvailable()) {
 *   transport.send(JSON.stringify({ type: 'hello' }));
 * }
 * ```
 */
export class WebKitTransport extends BaseTransport {
  readonly name = 'webkit';

  isAvailable(): boolean {
    const win = this.getWindow();
    return (
      typeof win?.webkit?.messageHandlers?.[WEBKIT_HANDLER_NAME]?.postMessage ===
      'function'
    );
  }

  send(message: string): void {
    const win = this.getWindow();
    const handler = win?.webkit?.messageHandlers?.[WEBKIT_HANDLER_NAME];
    if (typeof handler?.postMessage !== 'function') {
      console.warn(
        '[WebKitTransport] window.webkit.messageHandlers.aspectly.postMessage is not available'
      );
      return;
    }
    handler.postMessage(message);
  }

  subscribe(listener: TransportListener): TransportUnsubscribe {
    const win = this.getWindow();
    if (!win) {
      return () => {};
    }

    // The native side delivers messages via window.postMessage.
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
export const webKitDetector: TransportDetector = {
  name: 'webkit',
  priority: 95, // Above React Native, below CefSharp
  detect: () => {
    return (
      typeof window !== 'undefined' &&
      typeof window.webkit?.messageHandlers?.[WEBKIT_HANDLER_NAME]
        ?.postMessage === 'function'
    );
  },
  createTransport: () => new WebKitTransport(),
};
