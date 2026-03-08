import { describe, it, expect } from 'vitest';
import { BaseTransport } from './BaseTransport';
import type { TransportListener, TransportUnsubscribe } from './types';

/**
 * Concrete test implementation of BaseTransport
 */
class TestTransport extends BaseTransport {
  readonly name = 'test';

  isAvailable(): boolean {
    return this.hasWindow();
  }

  send(_message: string): void {
    // No-op for testing
  }

  subscribe(_listener: TransportListener): TransportUnsubscribe {
    return () => {};
  }
}

describe('BaseTransport', () => {
  it('should have hasWindow() return true in jsdom environment', () => {
    const transport = new TestTransport();
    expect(transport.isAvailable()).toBe(true);
  });

  it('should have getWindow() return window object in jsdom environment', () => {
    const transport = new TestTransport();
    // Using any to access protected method for testing
    const win = (transport as any).getWindow();
    expect(win).toBe(window);
  });

  it('should require abstract name property', () => {
    const transport = new TestTransport();
    expect(transport.name).toBe('test');
  });

  it('should require abstract isAvailable method', () => {
    const transport = new TestTransport();
    expect(typeof transport.isAvailable).toBe('function');
    expect(typeof transport.isAvailable()).toBe('boolean');
  });

  it('should require abstract send method', () => {
    const transport = new TestTransport();
    expect(typeof transport.send).toBe('function');
    expect(() => transport.send('test')).not.toThrow();
  });

  it('should require abstract subscribe method', () => {
    const transport = new TestTransport();
    expect(typeof transport.subscribe).toBe('function');
    const unsubscribe = transport.subscribe(() => {});
    expect(typeof unsubscribe).toBe('function');
  });
});
