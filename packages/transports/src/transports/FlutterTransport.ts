import { BaseTransport } from '../BaseTransport';
import type { TransportListener, TransportUnsubscribe, TransportDetector } from '../types';

/** The JavaScript channel name injected by the native Flutter host. */
export const FLUTTER_CHANNEL_NAME = 'AspectlyFlutter';

interface FlutterChannel {
  postMessage: (message: string) => void;
}

declare global {
  interface Window {
    AspectlyFlutter?: FlutterChannel;
  }
}

/**
 * Transport for native Flutter hosts (Dart) using a `webview_flutter`
 * JavaScript channel. Used when web content is displayed inside a Flutter app
 * that embeds the Aspectly Dart bridge.
 *
 * - JS → native: `window.AspectlyFlutter.postMessage(message)` (delivered to the
 *   `JavaScriptChannel` named `AspectlyFlutter`).
 * - native → JS: native runs `window.postMessage(...)`, received via the
 *   `message` event.
 *
 * @example
 * ```typescript
 * import { FlutterTransport } from '@aspectly/transports/flutter';
 *
 * const transport = new FlutterTransport();
 * if (transport.isAvailable()) {
 *   transport.send(JSON.stringify({ type: 'hello' }));
 * }
 * ```
 */
export class FlutterTransport extends BaseTransport {
  readonly name = 'flutter';

  isAvailable(): boolean {
    const win = this.getWindow();
    return typeof win?.AspectlyFlutter?.postMessage === 'function';
  }

  send(message: string): void {
    const win = this.getWindow();
    if (typeof win?.AspectlyFlutter?.postMessage !== 'function') {
      console.warn(
        '[FlutterTransport] window.AspectlyFlutter.postMessage is not available'
      );
      return;
    }
    win.AspectlyFlutter.postMessage(message);
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
export const flutterDetector: TransportDetector = {
  name: 'flutter',
  priority: 84, // Below Android, above iframe
  detect: () => {
    return (
      typeof window !== 'undefined' &&
      typeof window.AspectlyFlutter?.postMessage === 'function'
    );
  },
  createTransport: () => new FlutterTransport(),
};
