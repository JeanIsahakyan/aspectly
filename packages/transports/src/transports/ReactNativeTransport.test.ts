import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReactNativeTransport, reactNativeDetector } from './ReactNativeTransport';

interface ReactNativeWindow extends Window {
  ReactNativeWebView?: {
    postMessage: (message: string) => void;
  };
}

const testWindow = window as ReactNativeWindow;

describe('ReactNativeTransport', () => {
  let transport: ReactNativeTransport;
  let originalRNW: typeof testWindow.ReactNativeWebView;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    transport = new ReactNativeTransport();
    originalRNW = testWindow.ReactNativeWebView;
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    testWindow.ReactNativeWebView = originalRNW;
    consoleWarnSpy.mockRestore();
  });

  it('should have name property equal to "react-native"', () => {
    expect(transport.name).toBe('react-native');
  });

  it('should return false when ReactNativeWebView not present', () => {
    testWindow.ReactNativeWebView = undefined;
    expect(transport.isAvailable()).toBe(false);
  });

  it('should return false when ReactNativeWebView.postMessage not a function', () => {
    testWindow.ReactNativeWebView = {} as any;
    expect(transport.isAvailable()).toBe(false);
  });

  it('should return true when ReactNativeWebView.postMessage exists', () => {
    testWindow.ReactNativeWebView = {
      postMessage: vi.fn(),
    };
    expect(transport.isAvailable()).toBe(true);
  });

  it('should call ReactNativeWebView.postMessage with quoted message (iOS quirk)', () => {
    const mockPostMessage = vi.fn();
    testWindow.ReactNativeWebView = {
      postMessage: mockPostMessage,
    };

    transport.send('test message');

    // iOS quirk: message is wrapped in quotes
    expect(mockPostMessage).toHaveBeenCalledWith("'test message'");
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });

  it('should handle JSON messages with proper quoting', () => {
    const mockPostMessage = vi.fn();
    testWindow.ReactNativeWebView = {
      postMessage: mockPostMessage,
    };

    const jsonMessage = JSON.stringify({ type: 'test', data: 'foo' });
    transport.send(jsonMessage);

    expect(mockPostMessage).toHaveBeenCalledWith(`'${jsonMessage}'`);
  });

  it('should warn when ReactNativeWebView not available during send', () => {
    testWindow.ReactNativeWebView = undefined;

    transport.send('test message');

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[ReactNativeTransport] ReactNativeWebView.postMessage is not available'
    );
  });

  it('should warn when ReactNativeWebView.postMessage not available during send', () => {
    testWindow.ReactNativeWebView = {} as any;

    transport.send('test message');

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[ReactNativeTransport] ReactNativeWebView.postMessage is not available'
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

describe('reactNativeDetector', () => {
  let originalRNW: typeof testWindow.ReactNativeWebView;

  beforeEach(() => {
    originalRNW = testWindow.ReactNativeWebView;
  });

  afterEach(() => {
    testWindow.ReactNativeWebView = originalRNW;
  });

  it('should have name property equal to "react-native"', () => {
    expect(reactNativeDetector.name).toBe('react-native');
  });

  it('should have priority of 90', () => {
    expect(reactNativeDetector.priority).toBe(90);
  });

  it('should detect() return false when ReactNativeWebView not present', () => {
    testWindow.ReactNativeWebView = undefined;
    expect(reactNativeDetector.detect()).toBe(false);
  });

  it('should detect() return true when ReactNativeWebView.postMessage exists', () => {
    testWindow.ReactNativeWebView = {
      postMessage: vi.fn(),
    };
    expect(reactNativeDetector.detect()).toBe(true);
  });

  it('should createTransport() return ReactNativeTransport instance', () => {
    const transport = reactNativeDetector.createTransport();
    expect(transport).toBeInstanceOf(ReactNativeTransport);
    expect(transport.name).toBe('react-native');
  });
});
