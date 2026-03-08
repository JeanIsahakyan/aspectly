import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CefSharpTransport, cefSharpDetector } from './CefSharpTransport';

interface CefSharpWindow extends Window {
  CefSharp?: {
    PostMessage: (message: string) => void;
    BindObjectAsync: (...args: unknown[]) => Promise<void>;
  };
}

const testWindow = window as CefSharpWindow;

describe('CefSharpTransport', () => {
  let transport: CefSharpTransport;
  let originalCefSharp: typeof testWindow.CefSharp;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    transport = new CefSharpTransport();
    originalCefSharp = testWindow.CefSharp;
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    testWindow.CefSharp = originalCefSharp;
    consoleWarnSpy.mockRestore();
  });

  it('should have name property equal to "cefsharp"', () => {
    expect(transport.name).toBe('cefsharp');
  });

  it('should return false when CefSharp not present', () => {
    testWindow.CefSharp = undefined;
    expect(transport.isAvailable()).toBe(false);
  });

  it('should return false when CefSharp.PostMessage not a function', () => {
    testWindow.CefSharp = {} as any;
    expect(transport.isAvailable()).toBe(false);
  });

  it('should return true when CefSharp.PostMessage exists', () => {
    testWindow.CefSharp = {
      PostMessage: vi.fn(),
      BindObjectAsync: vi.fn(),
    };
    expect(transport.isAvailable()).toBe(true);
  });

  it('should call CefSharp.PostMessage with message when sending', () => {
    const mockPostMessage = vi.fn();
    testWindow.CefSharp = {
      PostMessage: mockPostMessage,
      BindObjectAsync: vi.fn(),
    };

    transport.send('test message');

    expect(mockPostMessage).toHaveBeenCalledWith('test message');
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });

  it('should warn when CefSharp not available during send', () => {
    testWindow.CefSharp = undefined;

    transport.send('test message');

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[CefSharpTransport] CefSharp.PostMessage is not available'
    );
  });

  it('should warn when CefSharp.PostMessage not available during send', () => {
    testWindow.CefSharp = {} as any;

    transport.send('test message');

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[CefSharpTransport] CefSharp.PostMessage is not available'
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

describe('cefSharpDetector', () => {
  let originalCefSharp: typeof testWindow.CefSharp;

  beforeEach(() => {
    originalCefSharp = testWindow.CefSharp;
  });

  afterEach(() => {
    testWindow.CefSharp = originalCefSharp;
  });

  it('should have name property equal to "cefsharp"', () => {
    expect(cefSharpDetector.name).toBe('cefsharp');
  });

  it('should have priority of 100', () => {
    expect(cefSharpDetector.priority).toBe(100);
  });

  it('should detect() return false when CefSharp not present', () => {
    testWindow.CefSharp = undefined;
    expect(cefSharpDetector.detect()).toBe(false);
  });

  it('should detect() return true when CefSharp.PostMessage exists', () => {
    testWindow.CefSharp = {
      PostMessage: vi.fn(),
      BindObjectAsync: vi.fn(),
    };
    expect(cefSharpDetector.detect()).toBe(true);
  });

  it('should createTransport() return CefSharpTransport instance', () => {
    const transport = cefSharpDetector.createTransport();
    expect(transport).toBeInstanceOf(CefSharpTransport);
    expect(transport.name).toBe('cefsharp');
  });
});
