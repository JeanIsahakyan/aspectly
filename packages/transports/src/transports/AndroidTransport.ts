import { BaseTransport } from '../BaseTransport';
import type { TransportListener, TransportUnsubscribe, TransportDetector } from '../types';

/** The `@JavascriptInterface` name injected by the native Android host. */
export const ANDROID_INTERFACE_NAME = 'AspectlyAndroid';

interface AndroidBridgeInterface {
  postMessage: (message: string) => void;
}

declare global {
  interface Window {
    AspectlyAndroid?: AndroidBridgeInterface;
  }
}

/**
 * Transport for native Android WebView hosts (Kotlin / Java).
 * Used when web content is displayed inside an app that embeds the Aspectly
 * Android `AndroidWebViewBrowserBridge`.
 *
 * - JS → native: `window.AspectlyAndroid.postMessage(message)` (delivered to a
 *   `@JavascriptInterface` method).
 * - native → JS: native injects `window.postMessage(...)`, received via the
 *   `message` event.
 *
 * @example
 * ```typescript
 * import { AndroidTransport } from '@aspectly/transports/android';
 *
 * const transport = new AndroidTransport();
 * if (transport.isAvailable()) {
 *   transport.send(JSON.stringify({ type: 'hello' }));
 * }
 * ```
 */
export class AndroidTransport extends BaseTransport {
  readonly name = 'android';

  isAvailable(): boolean {
    const win = this.getWindow();
    return typeof win?.AspectlyAndroid?.postMessage === 'function';
  }

  send(message: string): void {
    const win = this.getWindow();
    if (typeof win?.AspectlyAndroid?.postMessage !== 'function') {
      console.warn(
        '[AndroidTransport] window.AspectlyAndroid.postMessage is not available'
      );
      return;
    }
    win.AspectlyAndroid.postMessage(message);
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
export const androidDetector: TransportDetector = {
  name: 'android',
  priority: 85, // Below React Native, above iframe
  detect: () => {
    return (
      typeof window !== 'undefined' &&
      typeof window.AspectlyAndroid?.postMessage === 'function'
    );
  },
  createTransport: () => new AndroidTransport(),
};
