import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebKitTransport, webKitDetector, WEBKIT_HANDLER_NAME } from './WebKitTransport';

interface WebKitWindow extends Window {
  webkit?: {
    messageHandlers?: Record<string, { postMessage: (message: unknown) => void } | undefined>;
  };
}

const testWindow = window as WebKitWindow;

function setHandler(postMessage?: (message: unknown) => void): void {
  testWindow.webkit = {
    messageHandlers: {
      [WEBKIT_HANDLER_NAME]: postMessage ? { postMessage } : undefined,
    },
  };
}

describe('WebKitTransport', () => {
  let transport: WebKitTransport;
  let originalWebkit: WebKitWindow['webkit'];
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    transport = new WebKitTransport();
    originalWebkit = testWindow.webkit;
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    testWindow.webkit = originalWebkit;
    consoleWarnSpy.mockRestore();
  });

  it('should have name property equal to "webkit"', () => {
    expect(transport.name).toBe('webkit');
  });

  it('should return false when webkit not present', () => {
    testWindow.webkit = undefined;
    expect(transport.isAvailable()).toBe(false);
  });

  it('should return false when aspectly handler not present', () => {
    testWindow.webkit = { messageHandlers: {} };
    expect(transport.isAvailable()).toBe(false);
  });

  it('should return true when aspectly handler exists', () => {
    setHandler(vi.fn());
    expect(transport.isAvailable()).toBe(true);
  });

  it('should call handler.postMessage with message when sending', () => {
    const mockPostMessage = vi.fn();
    setHandler(mockPostMessage);

    transport.send('test message');

    expect(mockPostMessage).toHaveBeenCalledWith('test message');
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });

  it('should warn when webkit not available during send', () => {
    testWindow.webkit = undefined;

    transport.send('test message');

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[WebKitTransport] window.webkit.messageHandlers.aspectly.postMessage is not available'
    );
  });

  it('should add message event listener when subscribing', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const listener = vi.fn();

    transport.subscribe(listener);

    expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });

  it('should call listener with string data from message event', () => {
    const listener = vi.fn();
    transport.subscribe(listener);

    const event = new MessageEvent('message', { data: 'test data' });
    window.dispatchEvent(event);

    expect(listener).toHaveBeenCalledWith('test data');
  });

  it('should not call listener with non-string data', () => {
    const listener = vi.fn();
    transport.subscribe(listener);

    window.dispatchEvent(new MessageEvent('message', { data: 123 }));
    window.dispatchEvent(new MessageEvent('message', { data: { foo: 'bar' } }));

    expect(listener).not.toHaveBeenCalled();
  });

  it('should remove event listener when cleanup function is called', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const listener = vi.fn();

    const unsubscribe = transport.subscribe(listener);
    unsubscribe();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});

describe('webKitDetector', () => {
  let originalWebkit: WebKitWindow['webkit'];

  beforeEach(() => {
    originalWebkit = testWindow.webkit;
  });

  afterEach(() => {
    testWindow.webkit = originalWebkit;
  });

  it('should have name property equal to "webkit"', () => {
    expect(webKitDetector.name).toBe('webkit');
  });

  it('should have priority of 95', () => {
    expect(webKitDetector.priority).toBe(95);
  });

  it('should detect() return false when webkit not present', () => {
    testWindow.webkit = undefined;
    expect(webKitDetector.detect()).toBe(false);
  });

  it('should detect() return true when aspectly handler exists', () => {
    setHandler(vi.fn());
    expect(webKitDetector.detect()).toBe(true);
  });

  it('should createTransport() return WebKitTransport instance', () => {
    const created = webKitDetector.createTransport();
    expect(created).toBeInstanceOf(WebKitTransport);
    expect(created.name).toBe('webkit');
  });
});
