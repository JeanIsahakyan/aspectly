import {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  CSSProperties,
  IframeHTMLAttributes,
} from 'react';
import {
  BridgeCore,
  BridgeInternal,
  BridgeBase,
  BridgeOptions,
} from '@aspectly/core';

/**
 * Options for the useAspectlyIframe hook
 */
export interface UseAspectlyIframeOptions extends BridgeOptions {
  /** URL to load in the iframe */
  url: string;
}

/**
 * Props for the iframe component
 */
export interface AspectlyIframeProps
  extends Omit<IframeHTMLAttributes<HTMLIFrameElement>, 'src' | 'onLoad'> {
  /** Optional error handler */
  onError?: (error: unknown) => void;
  /** Custom styles */
  style?: CSSProperties;
}

/**
 * Return type for useAspectlyIframe hook
 */
export type UseAspectlyIframeReturn = [
  /** Bridge instance for communication */
  bridge: BridgeBase,
  /** Whether the iframe has loaded */
  loaded: boolean,
  /** React component to render the iframe */
  IframeComponent: FunctionComponent<AspectlyIframeProps>
];

/**
 * React hook for embedding an iframe and communicating with it via Aspectly bridge.
 *
 * @example
 * ```tsx
 * import { useAspectlyIframe } from '@aspectly/web';
 *
 * function App() {
 *   const [bridge, loaded, Iframe] = useAspectlyIframe({
 *     url: 'https://example.com/widget'
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
 *   const handleClick = async () => {
 *     const result = await bridge.send('greet', { name: 'World' });
 *     console.log(result);
 *   };
 *
 *   return (
 *     <div>
 *       <Iframe style={{ width: '100%', height: 400 }} />
 *       <button onClick={handleClick}>Send Message</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useAspectlyIframe = ({
  url,
  timeout,
}: UseAspectlyIframeOptions): UseAspectlyIframeReturn => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState<boolean>(false);

  const bridge = useMemo(() => {
    return new BridgeInternal((event: object): void => {
      const bridgeEvent = BridgeCore.wrapBridgeEvent(event);
      iframeRef.current?.contentWindow?.postMessage(bridgeEvent, '*');
    }, { timeout });
  }, [timeout]);

  const publicBridge = useMemo(() => new BridgeBase(bridge), [bridge]);

  useEffect(() => {
    const wrappedListener = BridgeCore.wrapListener(
      bridge.handleCoreEvent as (event: unknown) => void
    );

    const handler = (event: MessageEvent): void => {
      if (
        iframeRef.current?.contentWindow &&
        event.source === iframeRef.current.contentWindow &&
        typeof event.data === 'string'
      ) {
        wrappedListener(event.data);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [bridge]);

  const onLoad = useCallback(() => setLoaded(true), []);

  const IframeComponent: FunctionComponent<AspectlyIframeProps> = useCallback(
    ({ style, ...props }: AspectlyIframeProps) => {
      return (
        <iframe
          {...props}
          onLoad={onLoad}
          ref={iframeRef}
          style={{
            border: 0,
            ...style,
          }}
          src={url}
        />
      );
    },
    [url, onLoad]
  );

  return [publicBridge, loaded, IframeComponent];
};
