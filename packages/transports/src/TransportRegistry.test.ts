import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TransportRegistry, detectTransport, registerTransport } from './TransportRegistry';
import type { TransportDetector } from './types';
import { NullTransport } from './transports/NullTransport';

describe('TransportRegistry', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset registry to clean state before each test
    TransportRegistry.reset();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    TransportRegistry.reset();
    consoleWarnSpy.mockRestore();
  });

  it('should have built-in detectors registered by default', () => {
    const detectors = TransportRegistry.getDetectors();
    expect(detectors.length).toBe(5);

    const names = detectors.map(d => d.name);
    expect(names).toContain('cefsharp');
    expect(names).toContain('react-native');
    expect(names).toContain('iframe');
    expect(names).toContain('window');
    expect(names).toContain('postmessage');
  });

  it('should sort detectors by priority (descending)', () => {
    const detectors = TransportRegistry.getDetectors();

    // Should be sorted: cefsharp (100), react-native (90), iframe (80), window (70), postmessage (10)
    expect(detectors[0].name).toBe('cefsharp');
    expect(detectors[0].priority).toBe(100);
    expect(detectors[1].name).toBe('react-native');
    expect(detectors[1].priority).toBe(90);
    expect(detectors[2].name).toBe('iframe');
    expect(detectors[2].priority).toBe(80);
    expect(detectors[3].name).toBe('window');
    expect(detectors[3].priority).toBe(70);
    expect(detectors[4].name).toBe('postmessage');
    expect(detectors[4].priority).toBe(10);
  });

  it('should register new detector and sort by priority', () => {
    const customDetector: TransportDetector = {
      name: 'custom',
      priority: 95,
      detect: () => false,
      createTransport: () => new NullTransport(),
    };

    TransportRegistry.register(customDetector);
    const detectors = TransportRegistry.getDetectors();

    expect(detectors.length).toBe(6);
    // Should be: cefsharp (100), custom (95), react-native (90), iframe (80), window (70), postmessage (10)
    expect(detectors[1].name).toBe('custom');
    expect(detectors[1].priority).toBe(95);
  });

  it('should replace existing detector with same name', () => {
    const customDetector1: TransportDetector = {
      name: 'custom',
      priority: 50,
      detect: () => false,
      createTransport: () => new NullTransport(),
    };

    const customDetector2: TransportDetector = {
      name: 'custom',
      priority: 110,
      detect: () => true,
      createTransport: () => new NullTransport(),
    };

    TransportRegistry.register(customDetector1);
    expect(TransportRegistry.getDetectors().length).toBe(6);

    TransportRegistry.register(customDetector2);
    expect(TransportRegistry.getDetectors().length).toBe(6); // Still 6, not 7

    const detectors = TransportRegistry.getDetectors();
    const customDetector = detectors.find(d => d.name === 'custom');
    expect(customDetector?.priority).toBe(110); // Updated priority
  });

  it('should unregister detector by name', () => {
    TransportRegistry.unregister('iframe');
    const detectors = TransportRegistry.getDetectors();

    expect(detectors.length).toBe(4);
    expect(detectors.map(d => d.name)).not.toContain('iframe');
  });

  it('should return readonly array from getDetectors', () => {
    const detectors = TransportRegistry.getDetectors();
    expect(Array.isArray(detectors)).toBe(true);
    // TypeScript enforces readonly, but we can verify it's an array
    expect(detectors.length).toBeGreaterThan(0);
  });

  it('should detect and return first matching transport', () => {
    // Create a detector that always matches
    const mockTransport = new NullTransport();
    const customDetector: TransportDetector = {
      name: 'custom',
      priority: 200, // Highest priority
      detect: () => true,
      createTransport: () => mockTransport,
    };

    TransportRegistry.register(customDetector);
    const transport = TransportRegistry.detect();

    expect(transport).toBe(mockTransport);
    expect(transport.name).toBe('null'); // NullTransport
  });

  it('should cache detection result', () => {
    const createTransportMock = vi.fn(() => new NullTransport());
    const customDetector: TransportDetector = {
      name: 'custom',
      priority: 200,
      detect: () => true,
      createTransport: createTransportMock,
    };

    TransportRegistry.register(customDetector);

    const transport1 = TransportRegistry.detect();
    const transport2 = TransportRegistry.detect();

    expect(transport1).toBe(transport2); // Same instance
    expect(createTransportMock).toHaveBeenCalledTimes(1); // Only called once
  });

  it('should force re-detection when forceRedetect is true', () => {
    const createTransportMock = vi.fn(() => new NullTransport());
    const customDetector: TransportDetector = {
      name: 'custom',
      priority: 200,
      detect: () => true,
      createTransport: createTransportMock,
    };

    TransportRegistry.register(customDetector);

    TransportRegistry.detect(); // First call
    TransportRegistry.detect(true); // Force re-detect

    expect(createTransportMock).toHaveBeenCalledTimes(2); // Called twice
  });

  it('should return NullTransport when no detector matches', () => {
    // Unregister all built-in detectors
    TransportRegistry.unregister('cefsharp');
    TransportRegistry.unregister('react-native');
    TransportRegistry.unregister('iframe');
    TransportRegistry.unregister('postmessage');

    const transport = TransportRegistry.detect();

    expect(transport).toBeInstanceOf(NullTransport);
    expect(transport.name).toBe('null');
  });

  it('should handle errors in detector gracefully', () => {
    const faultyDetector: TransportDetector = {
      name: 'faulty',
      priority: 200,
      detect: () => {
        throw new Error('Detector error');
      },
      createTransport: () => new NullTransport(),
    };

    TransportRegistry.register(faultyDetector);

    // Should not throw, should warn and continue
    const transport = TransportRegistry.detect();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[TransportRegistry] Detector "faulty" threw an error:',
      expect.any(Error)
    );
    // Should fall back to next detector or NullTransport
    expect(transport).toBeDefined();
  });

  it('should clear cached transport when clearCache is called', () => {
    const createTransportMock = vi.fn(() => new NullTransport());
    const customDetector: TransportDetector = {
      name: 'custom',
      priority: 200,
      detect: () => true,
      createTransport: createTransportMock,
    };

    TransportRegistry.register(customDetector);

    TransportRegistry.detect(); // First call, caches result
    TransportRegistry.clearCache();
    TransportRegistry.detect(); // Second call after clearing cache

    expect(createTransportMock).toHaveBeenCalledTimes(2); // Called twice
  });

  it('should clear cache when registering new detector', () => {
    const detector1: TransportDetector = {
      name: 'detector1',
      priority: 200,
      detect: () => true,
      createTransport: () => new NullTransport(),
    };

    TransportRegistry.register(detector1);
    TransportRegistry.detect(); // Cache result

    const detector2: TransportDetector = {
      name: 'detector2',
      priority: 150,
      detect: () => false,
      createTransport: () => new NullTransport(),
    };

    TransportRegistry.register(detector2); // Should clear cache

    // Cache should be cleared, so next detect() will re-run
    // We can verify this indirectly by checking that detection happens again
    expect(() => TransportRegistry.detect()).not.toThrow();
  });

  it('should clear cache when unregistering detector', () => {
    TransportRegistry.detect(); // Cache result
    TransportRegistry.unregister('iframe'); // Should clear cache

    // Cache should be cleared
    expect(() => TransportRegistry.detect()).not.toThrow();
  });

  it('should reset to built-in detectors only', () => {
    const customDetector: TransportDetector = {
      name: 'custom',
      priority: 200,
      detect: () => false,
      createTransport: () => new NullTransport(),
    };

    TransportRegistry.register(customDetector);
    expect(TransportRegistry.getDetectors().length).toBe(6);

    TransportRegistry.reset();
    const detectors = TransportRegistry.getDetectors();

    expect(detectors.length).toBe(5);
    expect(detectors.map(d => d.name)).toEqual(['cefsharp', 'react-native', 'iframe', 'window', 'postmessage']);
  });

  it('should clear cache when reset is called', () => {
    TransportRegistry.detect(); // Cache result
    TransportRegistry.reset(); // Should clear cache

    expect(() => TransportRegistry.detect()).not.toThrow();
  });
});

describe('detectTransport convenience function', () => {
  beforeEach(() => {
    TransportRegistry.reset();
  });

  afterEach(() => {
    TransportRegistry.reset();
  });

  it('should call TransportRegistry.detect()', () => {
    const detectSpy = vi.spyOn(TransportRegistry, 'detect');

    detectTransport();

    expect(detectSpy).toHaveBeenCalledWith(false);
    detectSpy.mockRestore();
  });

  it('should pass forceRedetect parameter', () => {
    const detectSpy = vi.spyOn(TransportRegistry, 'detect');

    detectTransport(true);

    expect(detectSpy).toHaveBeenCalledWith(true);
    detectSpy.mockRestore();
  });

  it('should return a Transport instance', () => {
    const transport = detectTransport();
    expect(transport).toBeDefined();
    expect(typeof transport.name).toBe('string');
    expect(typeof transport.isAvailable).toBe('function');
    expect(typeof transport.send).toBe('function');
    expect(typeof transport.subscribe).toBe('function');
  });
});

describe('registerTransport convenience function', () => {
  beforeEach(() => {
    TransportRegistry.reset();
  });

  afterEach(() => {
    TransportRegistry.reset();
  });

  it('should call TransportRegistry.register()', () => {
    const registerSpy = vi.spyOn(TransportRegistry, 'register');
    const customDetector: TransportDetector = {
      name: 'custom',
      priority: 100,
      detect: () => false,
      createTransport: () => new NullTransport(),
    };

    registerTransport(customDetector);

    expect(registerSpy).toHaveBeenCalledWith(customDetector);
    registerSpy.mockRestore();
  });

  it('should actually register the detector', () => {
    const customDetector: TransportDetector = {
      name: 'custom',
      priority: 100,
      detect: () => false,
      createTransport: () => new NullTransport(),
    };

    registerTransport(customDetector);

    const detectors = TransportRegistry.getDetectors();
    expect(detectors.map(d => d.name)).toContain('custom');
  });
});
