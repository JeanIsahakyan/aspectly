import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IframeTransport, iframeDetector } from './IframeTransport';

describe('IframeTransport', () => {
  let transport: IframeTransport;
  let originalParent: Window;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    transport = new IframeTransport();
    originalParent = window.parent;
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    Object.defineProperty(window, 'parent', {
      value: originalParent,
      writable: true,
      configurable: true,
    });
    consoleWarnSpy.mockRestore();
  });

  it('should have name property equal to "iframe"', () => {
    expect(transport.name).toBe('iframe');
  });

  it('should have default targetOrigin of "*"', () => {
    // Access private property for testing
    expect((transport as any).targetOrigin).toBe('*');
  });

  it('should accept custom targetOrigin in constructor', () => {
    const customTransport = new IframeTransport('https://example.com');
    expect((customTransport as any).targetOrigin).toBe('https://example.com');
  });

  it('should return false when not in iframe (parent === window)', () => {
    Object.defineProperty(window, 'parent', {
      value: window,
      writable: true,
      configurable: true,
    });
    expect(transport.isAvailable()).toBe(false);
  });

  it('should return true when in iframe (parent !== window)', () => {
    const mockParent = { ...window, isParent: true };
    Object.defineProperty(window, 'parent', {
      value: mockParent,
      writable: true,
      configurable: true,
    });
    expect(transport.isAvailable()).toBe(true);
  });

  it('should call window.parent.postMessage with message and targetOrigin', () => {
    const mockPostMessage = vi.fn();
    const mockParent = { postMessage: mockPostMessage };
    Object.defineProperty(window, 'parent', {
      value: mockParent,
      writable: true,
      configurable: true,
    });

    transport.send('test message');

    expect(mockPostMessage).toHaveBeenCalledWith('test message', '*');
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });

  it('should use custom targetOrigin when sending', () => {
    const customTransport = new IframeTransport('https://example.com');
    const mockPostMessage = vi.fn();
    const mockParent = { postMessage: mockPostMessage };
    Object.defineProperty(window, 'parent', {
      value: mockParent,
      writable: true,
      configurable: true,
    });

    customTransport.send('test message');

    expect(mockPostMessage).toHaveBeenCalledWith('test message', 'https://example.com');
  });

  it('should warn when not in iframe during send', () => {
    Object.defineProperty(window, 'parent', {
      value: window,
      writable: true,
      configurable: true,
    });

    transport.send('test message');

    expect(consoleWarnSpy).toHaveBeenCalledWith('[IframeTransport] Not inside an iframe');
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

    const event1 = new MessageEvent('message', { data: 123 });
    const event2 = new MessageEvent('message', { data: { foo: 'bar' } });
    const event3 = new MessageEvent('message', { data: null });

    window.dispatchEvent(event1);
    window.dispatchEvent(event2);
    window.dispatchEvent(event3);

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

  it('should not receive messages after unsubscribing', () => {
    const listener = vi.fn();
    const unsubscribe = transport.subscribe(listener);

    const event1 = new MessageEvent('message', { data: 'before unsubscribe' });
    window.dispatchEvent(event1);

    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();

    const event2 = new MessageEvent('message', { data: 'after unsubscribe' });
    window.dispatchEvent(event2);

    expect(listener).toHaveBeenCalledTimes(1); // Still 1, not 2
  });
});

describe('iframeDetector', () => {
  let originalParent: Window;

  beforeEach(() => {
    originalParent = window.parent;
  });

  afterEach(() => {
    Object.defineProperty(window, 'parent', {
      value: originalParent,
      writable: true,
      configurable: true,
    });
  });

  it('should have name property equal to "iframe"', () => {
    expect(iframeDetector.name).toBe('iframe');
  });

  it('should have priority of 80', () => {
    expect(iframeDetector.priority).toBe(80);
  });

  it('should detect() return false when not in iframe', () => {
    Object.defineProperty(window, 'parent', {
      value: window,
      writable: true,
      configurable: true,
    });
    expect(iframeDetector.detect()).toBe(false);
  });

  it('should detect() return true when in iframe', () => {
    const mockParent = { ...window, isParent: true };
    Object.defineProperty(window, 'parent', {
      value: mockParent,
      writable: true,
      configurable: true,
    });
    expect(iframeDetector.detect()).toBe(true);
  });

  it('should createTransport() return IframeTransport instance', () => {
    const transport = iframeDetector.createTransport();
    expect(transport).toBeInstanceOf(IframeTransport);
    expect(transport.name).toBe('iframe');
  });
});
