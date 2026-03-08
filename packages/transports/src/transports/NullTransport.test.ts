import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NullTransport } from './NullTransport';

describe('NullTransport', () => {
  let transport: NullTransport;
  let originalNodeEnv: string | undefined;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    transport = new NullTransport();
    originalNodeEnv = process.env.NODE_ENV;
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    consoleWarnSpy.mockRestore();
  });

  it('should have name property equal to "null"', () => {
    expect(transport.name).toBe('null');
  });

  it('should have isAvailable() always return true', () => {
    expect(transport.isAvailable()).toBe(true);
  });

  it('should have send() be a no-op without errors', () => {
    expect(() => transport.send('test message')).not.toThrow();
  });

  it('should log warning in development mode when send() is called', () => {
    process.env.NODE_ENV = 'development';
    transport.send('test message');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[NullTransport] No transport available, message not sent'
    );
  });

  it('should not log warning in production mode when send() is called', () => {
    process.env.NODE_ENV = 'production';
    transport.send('test message');
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should have subscribe() return a cleanup function', () => {
    const listener = vi.fn();
    const unsubscribe = transport.subscribe(listener);
    expect(typeof unsubscribe).toBe('function');
  });

  it('should have subscribe() cleanup function be a no-op without errors', () => {
    const listener = vi.fn();
    const unsubscribe = transport.subscribe(listener);
    expect(() => unsubscribe()).not.toThrow();
  });

  it('should never call listener (messages are no-op)', () => {
    const listener = vi.fn();
    transport.subscribe(listener);
    // Since NullTransport doesn't actually receive messages, listener should never be called
    expect(listener).not.toHaveBeenCalled();
  });
});
