import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BridgeCore } from './BridgeCore';
import type { Transport } from '@aspectly/transports';

describe('BridgeCore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    BridgeCore.resetTransport();
  });

  describe('wrapBridgeEvent', () => {
    it('should wrap an event in the bridge protocol format', () => {
      const event = { method: 'test', params: { foo: 'bar' } };
      const wrapped = BridgeCore.wrapBridgeEvent(event);

      expect(typeof wrapped).toBe('string');
      const parsed = JSON.parse(wrapped);
      expect(parsed.type).toBe('BridgeEvent');
      expect(parsed.event).toEqual(event);
    });

    it('should handle complex nested objects', () => {
      const event = {
        method: 'test',
        params: {
          nested: { deep: { value: 123 } },
          array: [1, 2, 3],
        },
      };
      const wrapped = BridgeCore.wrapBridgeEvent(event);
      const parsed = JSON.parse(wrapped);
      expect(parsed.event).toEqual(event);
    });
  });

  describe('wrapListener', () => {
    it('should parse valid bridge events', () => {
      const listener = vi.fn();
      const wrappedListener = BridgeCore.wrapListener(listener);
      const event = { method: 'test' };
      const data = JSON.stringify({ type: 'BridgeEvent', event });

      wrappedListener(data);

      expect(listener).toHaveBeenCalledWith(event);
    });

    it('should ignore non-string data', () => {
      const listener = vi.fn();
      const wrappedListener = BridgeCore.wrapListener(listener);

      wrappedListener(undefined);
      wrappedListener(123 as unknown as string);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should ignore empty strings', () => {
      const listener = vi.fn();
      const wrappedListener = BridgeCore.wrapListener(listener);

      wrappedListener('');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle iOS wrapped JSON (with single quotes)', () => {
      const listener = vi.fn();
      const wrappedListener = BridgeCore.wrapListener(listener);
      const event = { method: 'test' };
      const data = `'${JSON.stringify({ type: 'BridgeEvent', event })}'`;

      wrappedListener(data);

      expect(listener).toHaveBeenCalledWith(event);
    });

    it('should ignore non-JSON data', () => {
      const listener = vi.fn();
      const wrappedListener = BridgeCore.wrapListener(listener);

      wrappedListener('not json');
      wrappedListener('[1, 2, 3]');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should ignore events with wrong type', () => {
      const listener = vi.fn();
      const wrappedListener = BridgeCore.wrapListener(listener);
      const data = JSON.stringify({ type: 'WrongType', event: {} });

      wrappedListener(data);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON gracefully', () => {
      const listener = vi.fn();
      const wrappedListener = BridgeCore.wrapListener(listener);

      wrappedListener('{invalid json}');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('sendEvent', () => {
    it('should send via the configured transport', () => {
      const mockTransport: Transport = {
        name: 'mock',
        isAvailable: () => true,
        send: vi.fn(),
        subscribe: vi.fn(),
      };
      BridgeCore.setTransport(mockTransport);

      const event = { method: 'test' };
      BridgeCore.sendEvent(event);

      expect(mockTransport.send).toHaveBeenCalledWith(expect.any(String));
    });

    it('should not throw with null transport (fallback)', () => {
      const event = { method: 'test' };
      expect(() => BridgeCore.sendEvent(event)).not.toThrow();
    });
  });

  describe('subscribe', () => {
    it('should subscribe via the configured transport', () => {
      const mockUnsubscribe = vi.fn();
      const mockTransport: Transport = {
        name: 'mock',
        isAvailable: () => true,
        send: vi.fn(),
        subscribe: vi.fn().mockReturnValue(mockUnsubscribe),
      };
      BridgeCore.setTransport(mockTransport);

      const listener = vi.fn();
      const unsubscribe = BridgeCore.subscribe(listener);

      expect(mockTransport.subscribe).toHaveBeenCalledWith(expect.any(Function));
      expect(typeof unsubscribe).toBe('function');
    });

    it('should return cleanup function from transport', () => {
      const mockUnsubscribe = vi.fn();
      const mockTransport: Transport = {
        name: 'mock',
        isAvailable: () => true,
        send: vi.fn(),
        subscribe: vi.fn().mockReturnValue(mockUnsubscribe),
      };
      BridgeCore.setTransport(mockTransport);

      const listener = vi.fn();
      const unsubscribe = BridgeCore.subscribe(listener);
      unsubscribe();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('transport management', () => {
    it('should allow setting a custom transport', () => {
      const mockTransport: Transport = {
        name: 'custom',
        isAvailable: () => true,
        send: vi.fn(),
        subscribe: vi.fn(),
      };
      BridgeCore.setTransport(mockTransport);

      expect(BridgeCore.getTransportName()).toBe('custom');
    });

    it('should reset transport to auto-detect', () => {
      const mockTransport: Transport = {
        name: 'custom',
        isAvailable: () => true,
        send: vi.fn(),
        subscribe: vi.fn(),
      };
      BridgeCore.setTransport(mockTransport);
      BridgeCore.resetTransport();

      // After reset, auto-detection will pick a default transport
      expect(BridgeCore.getTransportName()).not.toBe('custom');
    });
  });
});
