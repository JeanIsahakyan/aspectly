import type { Transport, TransportDetector } from './types';
import { cefSharpDetector } from './transports/CefSharpTransport';
import { reactNativeDetector } from './transports/ReactNativeTransport';
import { iframeDetector } from './transports/IframeTransport';
import { windowDetector } from './transports/WindowTransport';
import { postMessageDetector } from './transports/PostMessageTransport';
import { NullTransport } from './transports/NullTransport';

/**
 * Registry for transport detectors
 * Manages auto-detection of the current environment
 */
class TransportRegistryClass {
  private detectors: TransportDetector[] = [];
  private cachedTransport: Transport | null = null;

  constructor() {
    // Register built-in detectors
    this.register(cefSharpDetector);
    this.register(reactNativeDetector);
    this.register(iframeDetector);
    this.register(windowDetector);
    this.register(postMessageDetector);
  }

  /**
   * Register a custom transport detector
   * @param detector The detector to register
   */
  register(detector: TransportDetector): void {
    // Remove existing detector with same name
    this.detectors = this.detectors.filter(d => d.name !== detector.name);
    this.detectors.push(detector);
    // Sort by priority (descending)
    this.detectors.sort((a, b) => b.priority - a.priority);
    // Clear cache when detectors change
    this.cachedTransport = null;
  }

  /**
   * Unregister a transport detector by name
   * @param name Name of the detector to remove
   */
  unregister(name: string): void {
    this.detectors = this.detectors.filter(d => d.name !== name);
    this.cachedTransport = null;
  }

  /**
   * Get all registered detectors
   */
  getDetectors(): readonly TransportDetector[] {
    return this.detectors;
  }

  /**
   * Detect and return the appropriate transport for the current environment
   * Results are cached for performance
   * @param forceRedetect Force re-detection (ignores cache)
   */
  detect(forceRedetect = false): Transport {
    if (this.cachedTransport && !forceRedetect) {
      return this.cachedTransport;
    }

    for (const detector of this.detectors) {
      try {
        if (detector.detect()) {
          this.cachedTransport = detector.createTransport();
          return this.cachedTransport;
        }
      } catch (error) {
        console.warn(`[TransportRegistry] Detector "${detector.name}" threw an error:`, error);
      }
    }

    // No transport detected, return NullTransport
    this.cachedTransport = new NullTransport();
    return this.cachedTransport;
  }

  /**
   * Clear the cached transport (useful for testing)
   */
  clearCache(): void {
    this.cachedTransport = null;
  }

  /**
   * Reset registry to default state (built-in detectors only)
   */
  reset(): void {
    this.detectors = [];
    this.cachedTransport = null;
    this.register(cefSharpDetector);
    this.register(reactNativeDetector);
    this.register(iframeDetector);
    this.register(windowDetector);
    this.register(postMessageDetector);
  }
}

/**
 * Global transport registry instance
 */
export const TransportRegistry = new TransportRegistryClass();

/**
 * Convenience function to detect transport
 */
export const detectTransport = (forceRedetect = false): Transport => {
  return TransportRegistry.detect(forceRedetect);
};

/**
 * Convenience function to register a custom detector
 */
export const registerTransport = (detector: TransportDetector): void => {
  TransportRegistry.register(detector);
};
