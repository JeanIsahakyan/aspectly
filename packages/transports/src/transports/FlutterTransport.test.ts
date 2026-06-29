import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FlutterTransport, flutterDetector, FLUTTER_CHANNEL_NAME } from './FlutterTransport';

interface FlutterWindow extends Window {
  AspectlyFlutter?: { postMessage: (message: string) => void };
}

const testWindow = window as FlutterWindow;

describe('FlutterTransport', () => {
  let transport: FlutterTransport;
  let original: FlutterWindow['AspectlyFlutter'];
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    transport = new FlutterTransport();
    original = testWindow.AspectlyFlutter;
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    testWindow.AspectlyFlutter = original;
    consoleWarnSpy.mockRestore();
  });

  it('should have name property equal to "flutter"', () => {
    expect(transport.name).toBe('flutter');
  });

  it('should expose FLUTTER_CHANNEL_NAME', () => {
    expect(FLUTTER_CHANNEL_NAME).toBe('AspectlyFlutter');
  });

  it('should return false when AspectlyFlutter not present', () => {
    testWindow.AspectlyFlutter = undefined;
    expect(transport.isAvailable()).toBe(false);
  });

  it('should return false when postMessage not a function', () => {
    testWindow.AspectlyFlutter = {} as any;
    expect(transport.isAvailable()).toBe(false);
  });

  it('should return true when postMessage exists', () => {
    testWindow.AspectlyFlutter = { postMessage: vi.fn() };
    expect(transport.isAvailable()).toBe(true);
  });

  it('should call AspectlyFlutter.postMessage with message when sending', () => {
    const mockPostMessage = vi.fn();
    testWindow.AspectlyFlutter = { postMessage: mockPostMessage };

    transport.send('test message');

    expect(mockPostMessage).toHaveBeenCalledWith('test message');
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });

  it('should warn when AspectlyFlutter not available during send', () => {
    testWindow.AspectlyFlutter = undefined;

    transport.send('test message');

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[FlutterTransport] window.AspectlyFlutter.postMessage is not available'
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

describe('flutterDetector', () => {
  let original: FlutterWindow['AspectlyFlutter'];

  beforeEach(() => {
    original = testWindow.AspectlyFlutter;
  });

  afterEach(() => {
    testWindow.AspectlyFlutter = original;
  });

  it('should have name property equal to "flutter"', () => {
    expect(flutterDetector.name).toBe('flutter');
  });

  it('should have priority of 84', () => {
    expect(flutterDetector.priority).toBe(84);
  });

  it('should detect() return false when AspectlyFlutter not present', () => {
    testWindow.AspectlyFlutter = undefined;
    expect(flutterDetector.detect()).toBe(false);
  });

  it('should detect() return true when postMessage exists', () => {
    testWindow.AspectlyFlutter = { postMessage: vi.fn() };
    expect(flutterDetector.detect()).toBe(true);
  });

  it('should createTransport() return FlutterTransport instance', () => {
    const created = flutterDetector.createTransport();
    expect(created).toBeInstanceOf(FlutterTransport);
    expect(created.name).toBe('flutter');
  });
});
