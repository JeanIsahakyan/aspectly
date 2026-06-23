import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AndroidTransport, androidDetector, ANDROID_INTERFACE_NAME } from './AndroidTransport';

interface AndroidWindow extends Window {
  AspectlyAndroid?: { postMessage: (message: string) => void };
}

const testWindow = window as AndroidWindow;

describe('AndroidTransport', () => {
  let transport: AndroidTransport;
  let originalInterface: AndroidWindow['AspectlyAndroid'];
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    transport = new AndroidTransport();
    originalInterface = testWindow.AspectlyAndroid;
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    testWindow.AspectlyAndroid = originalInterface;
    consoleWarnSpy.mockRestore();
  });

  it('should have name property equal to "android"', () => {
    expect(transport.name).toBe('android');
  });

  it('should expose ANDROID_INTERFACE_NAME', () => {
    expect(ANDROID_INTERFACE_NAME).toBe('AspectlyAndroid');
  });

  it('should return false when AspectlyAndroid not present', () => {
    testWindow.AspectlyAndroid = undefined;
    expect(transport.isAvailable()).toBe(false);
  });

  it('should return false when postMessage not a function', () => {
    testWindow.AspectlyAndroid = {} as any;
    expect(transport.isAvailable()).toBe(false);
  });

  it('should return true when postMessage exists', () => {
    testWindow.AspectlyAndroid = { postMessage: vi.fn() };
    expect(transport.isAvailable()).toBe(true);
  });

  it('should call AspectlyAndroid.postMessage with message when sending', () => {
    const mockPostMessage = vi.fn();
    testWindow.AspectlyAndroid = { postMessage: mockPostMessage };

    transport.send('test message');

    expect(mockPostMessage).toHaveBeenCalledWith('test message');
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });

  it('should warn when AspectlyAndroid not available during send', () => {
    testWindow.AspectlyAndroid = undefined;

    transport.send('test message');

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[AndroidTransport] window.AspectlyAndroid.postMessage is not available'
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

    window.dispatchEvent(new MessageEvent('message', { data: 'test data' }));

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

describe('androidDetector', () => {
  let originalInterface: AndroidWindow['AspectlyAndroid'];

  beforeEach(() => {
    originalInterface = testWindow.AspectlyAndroid;
  });

  afterEach(() => {
    testWindow.AspectlyAndroid = originalInterface;
  });

  it('should have name property equal to "android"', () => {
    expect(androidDetector.name).toBe('android');
  });

  it('should have priority of 85', () => {
    expect(androidDetector.priority).toBe(85);
  });

  it('should detect() return false when AspectlyAndroid not present', () => {
    testWindow.AspectlyAndroid = undefined;
    expect(androidDetector.detect()).toBe(false);
  });

  it('should detect() return true when postMessage exists', () => {
    testWindow.AspectlyAndroid = { postMessage: vi.fn() };
    expect(androidDetector.detect()).toBe(true);
  });

  it('should createTransport() return AndroidTransport instance', () => {
    const created = androidDetector.createTransport();
    expect(created).toBeInstanceOf(AndroidTransport);
    expect(created.name).toBe('android');
  });
});
