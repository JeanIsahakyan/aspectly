import { BaseTransport } from '../BaseTransport';
import type { TransportListener, TransportUnsubscribe } from '../types';

/**
 * Null transport - used when no transport is available
 * All operations are no-ops. Useful for SSR or testing.
 */
export class NullTransport extends BaseTransport {
  readonly name = 'null';

  isAvailable(): boolean {
    // Always "available" as a fallback, but does nothing
    return true;
  }

  send(_message: string): void {
    // No-op
    if (process.env.NODE_ENV === 'development') {
      console.warn('[NullTransport] No transport available, message not sent');
    }
  }

  subscribe(_listener: TransportListener): TransportUnsubscribe {
    // No-op
    return () => {};
  }
}
