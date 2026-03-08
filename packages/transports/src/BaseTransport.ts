import type { Transport, TransportListener, TransportUnsubscribe } from './types';

/**
 * Abstract base class for transports
 * Provides common functionality for message handling
 */
export abstract class BaseTransport implements Transport {
  abstract readonly name: string;

  abstract isAvailable(): boolean;
  abstract send(message: string): void;
  abstract subscribe(listener: TransportListener): TransportUnsubscribe;

  /**
   * Helper to check if window is defined (for SSR safety)
   */
  protected hasWindow(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * Helper to safely get window object
   */
  protected getWindow(): Window | null {
    return this.hasWindow() ? window : null;
  }
}
