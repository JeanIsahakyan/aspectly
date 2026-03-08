import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, render } from '@testing-library/react';
import React from 'react';
import { useAspectlyWebView } from './useAspectlyWebView';

// Mock @aspectly/core
vi.mock('@aspectly/core', () => ({
  BridgeCore: {
    wrapBridgeEvent: vi.fn((event) => JSON.stringify({ type: 'BridgeEvent', event })),
    wrapListener: vi.fn((listener) => (data?: string) => { if (data) listener(data); }),
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

// Mock react-native-webview
vi.mock('react-native-webview', () => ({
  WebView: vi.fn().mockReturnValue(null),
}));

describe('useAspectlyWebView (react-native)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hook return values', () => {
    it('should return bridge, loaded state, and WebViewComponent', () => {
      const { result } = renderHook(() =>
        useAspectlyWebView({ url: 'https://example.com' })
      );

      const [bridge, loaded, WebViewComponent] = result.current;

      expect(bridge).toBeDefined();
      expect(typeof loaded).toBe('boolean');
      expect(typeof WebViewComponent).toBe('function');
    });

    it('should initially have loaded as false', () => {
      const { result } = renderHook(() =>
        useAspectlyWebView({ url: 'https://example.com' })
      );

      const [, loaded] = result.current;
      expect(loaded).toBe(false);
    });
  });

  describe('bridge instance', () => {
    it('should have init method', () => {
      const { result } = renderHook(() =>
        useAspectlyWebView({ url: 'https://example.com' })
      );

      const [bridge] = result.current;
      expect(typeof bridge.init).toBe('function');
    });

    it('should have send method', () => {
      const { result } = renderHook(() =>
        useAspectlyWebView({ url: 'https://example.com' })
      );

      const [bridge] = result.current;
      expect(typeof bridge.send).toBe('function');
    });

    it('should have subscribe method', () => {
      const { result } = renderHook(() =>
        useAspectlyWebView({ url: 'https://example.com' })
      );

      const [bridge] = result.current;
      expect(typeof bridge.subscribe).toBe('function');
    });

    it('should have unsubscribe method', () => {
      const { result } = renderHook(() =>
        useAspectlyWebView({ url: 'https://example.com' })
      );

      const [bridge] = result.current;
      expect(typeof bridge.unsubscribe).toBe('function');
    });
  });

  describe('WebViewComponent', () => {
    it('should be a valid React component', () => {
      const { result } = renderHook(() =>
        useAspectlyWebView({ url: 'https://example.com' })
      );

      const [, , WebViewComponent] = result.current;
      expect(WebViewComponent).toBeDefined();
    });
  });

  describe('memoization', () => {
    it('should return same bridge instance across re-renders', () => {
      const { result, rerender } = renderHook(() =>
        useAspectlyWebView({ url: 'https://example.com' })
      );

      const firstBridge = result.current[0];
      rerender();
      const secondBridge = result.current[0];

      expect(firstBridge).toBe(secondBridge);
    });

    it('should return same component across re-renders with same url', () => {
      const { result, rerender } = renderHook(() =>
        useAspectlyWebView({ url: 'https://example.com' })
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
        useAspectlyWebView({ url: 'https://example.com', timeout: 5000 })
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('WebView configuration', () => {
    it('should WebViewComponent receive correct source.uri from url option', async () => {
      const { result } = renderHook(() =>
        useAspectlyWebView({ url: 'https://example.com/app' })
      );

      const [, , WebViewComponent] = result.current;

      // Render the component
      render(<WebViewComponent />);

      // Get the mock from the module
      const { WebView } = await import('react-native-webview');

      // Verify WebView was called with correct source
      expect(WebView).toHaveBeenCalledWith(
        expect.objectContaining({
          source: { uri: 'https://example.com/app' }
        }),
        expect.anything()
      );
    });

    it('should WebViewComponent have javaScriptEnabled=true', async () => {
      const { result } = renderHook(() =>
        useAspectlyWebView({ url: 'https://example.com' })
      );

      const [, , WebViewComponent] = result.current;

      render(<WebViewComponent />);

      const { WebView } = await import('react-native-webview');

      expect(WebView).toHaveBeenCalledWith(
        expect.objectContaining({
          javaScriptEnabled: true
        }),
        expect.anything()
      );
    });

    it('should WebViewComponent have mixedContentMode="always"', async () => {
      const { result } = renderHook(() =>
        useAspectlyWebView({ url: 'https://example.com' })
      );

      const [, , WebViewComponent] = result.current;

      render(<WebViewComponent />);

      const { WebView } = await import('react-native-webview');

      expect(WebView).toHaveBeenCalledWith(
        expect.objectContaining({
          mixedContentMode: 'always'
        }),
        expect.anything()
      );
    });
  });
});
