import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAspectlyIframe } from './useAspectlyIframe';

// Mock @aspectly/core
vi.mock('@aspectly/core', () => ({
  BridgeCore: {
    wrapBridgeEvent: vi.fn((event) => JSON.stringify({ type: 'BridgeEvent', event })),
    wrapListener: vi.fn((listener) => (data: string) => {
      try {
        const parsed = JSON.parse(data);
        if (parsed?.type === 'BridgeEvent') listener(parsed.event);
      } catch { /* ignore parse errors */ }
    }),
    subscribe: vi.fn().mockReturnValue(vi.fn()),
  },
  BridgeInternal: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(true),
    send: vi.fn().mockResolvedValue({}),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    supports: vi.fn(),
    isAvailable: vi.fn(),
    handleCoreEvent: vi.fn(),
  })),
  BridgeBase: vi.fn().mockImplementation((internal) => ({
    init: internal.init,
    send: internal.send,
    subscribe: internal.subscribe,
    unsubscribe: internal.unsubscribe,
    supports: internal.supports,
    isAvailable: internal.isAvailable,
  })),
}));

describe('useAspectlyIframe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hook return values', () => {
    it('should return bridge, loaded state, and component', () => {
      const { result } = renderHook(() =>
        useAspectlyIframe({ url: 'https://example.com' })
      );

      const [bridge, loaded, IframeComponent] = result.current;

      expect(bridge).toBeDefined();
      expect(typeof loaded).toBe('boolean');
      expect(typeof IframeComponent).toBe('function');
    });

    it('should initially have loaded as false', () => {
      const { result } = renderHook(() =>
        useAspectlyIframe({ url: 'https://example.com' })
      );

      const [, loaded] = result.current;
      expect(loaded).toBe(false);
    });
  });

  describe('bridge instance', () => {
    it('should have init method', () => {
      const { result } = renderHook(() =>
        useAspectlyIframe({ url: 'https://example.com' })
      );

      const [bridge] = result.current;
      expect(typeof bridge.init).toBe('function');
    });

    it('should have send method', () => {
      const { result } = renderHook(() =>
        useAspectlyIframe({ url: 'https://example.com' })
      );

      const [bridge] = result.current;
      expect(typeof bridge.send).toBe('function');
    });

    it('should have subscribe method', () => {
      const { result } = renderHook(() =>
        useAspectlyIframe({ url: 'https://example.com' })
      );

      const [bridge] = result.current;
      expect(typeof bridge.subscribe).toBe('function');
    });

    it('should have unsubscribe method', () => {
      const { result } = renderHook(() =>
        useAspectlyIframe({ url: 'https://example.com' })
      );

      const [bridge] = result.current;
      expect(typeof bridge.unsubscribe).toBe('function');
    });
  });

  describe('IframeComponent', () => {
    it('should be a valid React component', () => {
      const { result } = renderHook(() =>
        useAspectlyIframe({ url: 'https://example.com' })
      );

      const [, , IframeComponent] = result.current;
      expect(IframeComponent).toBeDefined();
      expect(IframeComponent.name).toBeDefined();
    });
  });

  describe('memoization', () => {
    it('should return same bridge instance across re-renders', () => {
      const { result, rerender } = renderHook(() =>
        useAspectlyIframe({ url: 'https://example.com' })
      );

      const firstBridge = result.current[0];
      rerender();
      const secondBridge = result.current[0];

      expect(firstBridge).toBe(secondBridge);
    });

    it('should return same component across re-renders with same url', () => {
      const { result, rerender } = renderHook(() =>
        useAspectlyIframe({ url: 'https://example.com' })
      );

      const firstComponent = result.current[2];
      rerender();
      const secondComponent = result.current[2];

      expect(firstComponent).toBe(secondComponent);
    });
  });

  describe('options', () => {
    it('should accept timeout option', () => {
      const { result } = renderHook(() =>
        useAspectlyIframe({ url: 'https://example.com', timeout: 5000 })
      );

      expect(result.current).toBeDefined();
    });
  });
});
