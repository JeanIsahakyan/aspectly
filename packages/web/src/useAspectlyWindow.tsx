import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BridgeCore,
  BridgeInternal,
  BridgeBase,
  BridgeOptions,
} from '@aspectly/core';

/**
 * Options for the useAspectlyWindow hook
 */
export interface UseAspectlyWindowOptions extends BridgeOptions {
  /** URL to open in the popup window */
  url: string;
  /** Window features string (e.g., 'width=800,height=600') */
  features?: string;
  /** Window target name (default: '_blank') */
  target?: string;
}

/**
 * Return type for useAspectlyWindow hook
 */
export type UseAspectlyWindowReturn = [
  /** Bridge instance for communication */
  bridge: BridgeBase,
  /** Whether the window has loaded */
  loaded: boolean,
  /** Open the popup window */
  open: () => void,
  /** Close the popup window */
  close: () => void,
  /** Whether the window is currently open */
  isOpen: boolean,
];

/**
 * React hook for opening a popup window and communicating with it via Aspectly bridge.
 *
 * @example
 * ```tsx
 * import { useAspectlyWindow } from '@aspectly/web';
 *
 * function App() {
 *   const [bridge, loaded, openWindow, closeWindow, isOpen] = useAspectlyWindow({
 *     url: 'https://example.com/popup',
 *     features: 'width=800,height=600',
 *   });
 *
 *   useEffect(() => {
 *     if (loaded) {
 *       bridge.init({
 *         getData: async () => ({ user: 'John' })
 *       });
 *     }
 *   }, [loaded, bridge]);
 *
 *   return (
 *     <div>
 *       <button onClick={openWindow}>Open Window</button>
 *       {isOpen && <button onClick={closeWindow}>Close Window</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export const useAspectlyWindow = ({
  url,
  features,
  target = '_blank',
  timeout,
}: UseAspectlyWindowOptions): UseAspectlyWindowReturn => {
  const windowRef = useRef<Window | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const bridge = useMemo(() => {
    return new BridgeInternal((event: object): void => {
      const bridgeEvent = BridgeCore.wrapBridgeEvent(event);
      if (windowRef.current && !windowRef.current.closed) {
        windowRef.current.postMessage(bridgeEvent, '*');
      }
    }, { timeout });
  }, [timeout]);

  const publicBridge = useMemo(() => new BridgeBase(bridge), [bridge]);

  useEffect(() => {
    const handler = (event: MessageEvent): void => {
      if (
        windowRef.current &&
        event.source === windowRef.current &&
        typeof event.data === 'string'
      ) {
        const wrappedListener = BridgeCore.wrapListener(
          bridge.handleCoreEvent as (event: unknown) => void
        );
        wrappedListener(event.data);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [bridge]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      if (windowRef.current?.closed) {
        windowRef.current = null;
        setIsOpen(false);
        setLoaded(false);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen]);

  const open = useCallback(() => {
    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.focus();
      return;
    }

    const newWindow = window.open(url, target, features);
    if (newWindow) {
      windowRef.current = newWindow;
      setIsOpen(true);
      setLoaded(false);

      const onLoad = () => {
        setLoaded(true);
      };

      // For same-origin windows, use the load event
      // For cross-origin, we rely on the child sending an init message
      try {
        newWindow.addEventListener('load', onLoad);
      } catch {
        // Cross-origin: can't add load listener, loaded will be set
        // when the child bridge sends its first init event
        setLoaded(true);
      }
    }
  }, [url, target, features]);

  const close = useCallback(() => {
    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.close();
    }
    windowRef.current = null;
    setIsOpen(false);
    setLoaded(false);
  }, []);

  return [publicBridge, loaded, open, close, isOpen];
};
