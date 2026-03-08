import { BaseTransport } from '../BaseTransport';
import type { TransportListener, TransportUnsubscribe, TransportDetector } from '../types';

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

/**
 * Transport for React Native WebView
 * Used when web content is displayed inside a React Native app
 *
 * @example
 * ```typescript
 * import { ReactNativeTransport } from '@aspectly/transports/react-native';
 *
 * const transport = new ReactNativeTransport();
 * if (transport.isAvailable()) {
 *   transport.send(JSON.stringify({ type: 'hello' }));
 * }
 * ```
 */
export class ReactNativeTransport extends BaseTransport {
  readonly name = 'react-native';

  isAvailable(): boolean {
    const win = this.getWindow();
    return typeof win?.ReactNativeWebView?.postMessage === 'function';
  }

  send(message: string): void {
    const win = this.getWindow();
    if (!win?.ReactNativeWebView?.postMessage) {
      console.warn('[ReactNativeTransport] ReactNativeWebView.postMessage is not available');
      return;
    }
    // React Native WebView expects message wrapped in quotes (iOS quirk)
    win.ReactNativeWebView.postMessage(`'${message}'`);
  }

  subscribe(listener: TransportListener): TransportUnsubscribe {
    const win = this.getWindow();
    if (!win) {
      return () => {};
    }

    // React Native sends messages via window.postMessage
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
export const reactNativeDetector: TransportDetector = {
  name: 'react-native',
  priority: 90, // Second priority
  detect: () => {
    return typeof window !== 'undefined' &&
           typeof window.ReactNativeWebView?.postMessage === 'function';
  },
  createTransport: () => new ReactNativeTransport(),
};
