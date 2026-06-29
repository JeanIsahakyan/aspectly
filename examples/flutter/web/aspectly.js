"use strict";
(() => {
  // packages/transports/dist/index.mjs
  var BaseTransport = class {
    /**
     * Helper to check if window is defined (for SSR safety)
     */
    hasWindow() {
      return typeof window !== "undefined";
    }
    /**
     * Helper to safely get window object
     */
    getWindow() {
      return this.hasWindow() ? window : null;
    }
  };
  var CefSharpTransport = class extends BaseTransport {
    constructor() {
      super(...arguments);
      this.name = "cefsharp";
    }
    isAvailable() {
      var _a;
      const win = this.getWindow();
      return typeof ((_a = win == null ? void 0 : win.CefSharp) == null ? void 0 : _a.PostMessage) === "function";
    }
    send(message) {
      var _a;
      const win = this.getWindow();
      if (!((_a = win == null ? void 0 : win.CefSharp) == null ? void 0 : _a.PostMessage)) {
        console.warn("[CefSharpTransport] CefSharp.PostMessage is not available");
        return;
      }
      win.CefSharp.PostMessage(message);
    }
    subscribe(listener) {
      const win = this.getWindow();
      if (!win) {
        return () => {
        };
      }
      const handler = (event) => {
        if (typeof event.data === "string") {
          listener(event.data);
        }
      };
      win.addEventListener("message", handler);
      return () => win.removeEventListener("message", handler);
    }
  };
  var cefSharpDetector = {
    name: "cefsharp",
    priority: 100,
    // Highest priority - check first
    detect: () => {
      var _a;
      return typeof window !== "undefined" && typeof ((_a = window.CefSharp) == null ? void 0 : _a.PostMessage) === "function";
    },
    createTransport: () => new CefSharpTransport()
  };
  var WEBKIT_HANDLER_NAME = "aspectly";
  var WebKitTransport = class extends BaseTransport {
    constructor() {
      super(...arguments);
      this.name = "webkit";
    }
    isAvailable() {
      var _a, _b, _c;
      const win = this.getWindow();
      return typeof ((_c = (_b = (_a = win == null ? void 0 : win.webkit) == null ? void 0 : _a.messageHandlers) == null ? void 0 : _b[WEBKIT_HANDLER_NAME]) == null ? void 0 : _c.postMessage) === "function";
    }
    send(message) {
      var _a, _b;
      const win = this.getWindow();
      const handler = (_b = (_a = win == null ? void 0 : win.webkit) == null ? void 0 : _a.messageHandlers) == null ? void 0 : _b[WEBKIT_HANDLER_NAME];
      if (typeof (handler == null ? void 0 : handler.postMessage) !== "function") {
        console.warn(
          "[WebKitTransport] window.webkit.messageHandlers.aspectly.postMessage is not available"
        );
        return;
      }
      handler.postMessage(message);
    }
    subscribe(listener) {
      const win = this.getWindow();
      if (!win) {
        return () => {
        };
      }
      const handler = (event) => {
        if (typeof event.data === "string") {
          listener(event.data);
        }
      };
      win.addEventListener("message", handler);
      return () => win.removeEventListener("message", handler);
    }
  };
  var webKitDetector = {
    name: "webkit",
    priority: 95,
    // Above React Native, below CefSharp
    detect: () => {
      var _a, _b, _c;
      return typeof window !== "undefined" && typeof ((_c = (_b = (_a = window.webkit) == null ? void 0 : _a.messageHandlers) == null ? void 0 : _b[WEBKIT_HANDLER_NAME]) == null ? void 0 : _c.postMessage) === "function";
    },
    createTransport: () => new WebKitTransport()
  };
  var AndroidTransport = class extends BaseTransport {
    constructor() {
      super(...arguments);
      this.name = "android";
    }
    isAvailable() {
      var _a;
      const win = this.getWindow();
      return typeof ((_a = win == null ? void 0 : win.AspectlyAndroid) == null ? void 0 : _a.postMessage) === "function";
    }
    send(message) {
      var _a;
      const win = this.getWindow();
      if (typeof ((_a = win == null ? void 0 : win.AspectlyAndroid) == null ? void 0 : _a.postMessage) !== "function") {
        console.warn(
          "[AndroidTransport] window.AspectlyAndroid.postMessage is not available"
        );
        return;
      }
      win.AspectlyAndroid.postMessage(message);
    }
    subscribe(listener) {
      const win = this.getWindow();
      if (!win) {
        return () => {
        };
      }
      const handler = (event) => {
        if (typeof event.data === "string") {
          listener(event.data);
        }
      };
      win.addEventListener("message", handler);
      return () => win.removeEventListener("message", handler);
    }
  };
  var androidDetector = {
    name: "android",
    priority: 85,
    // Below React Native, above iframe
    detect: () => {
      var _a;
      return typeof window !== "undefined" && typeof ((_a = window.AspectlyAndroid) == null ? void 0 : _a.postMessage) === "function";
    },
    createTransport: () => new AndroidTransport()
  };
  var FlutterTransport = class extends BaseTransport {
    constructor() {
      super(...arguments);
      this.name = "flutter";
    }
    isAvailable() {
      var _a;
      const win = this.getWindow();
      return typeof ((_a = win == null ? void 0 : win.AspectlyFlutter) == null ? void 0 : _a.postMessage) === "function";
    }
    send(message) {
      var _a;
      const win = this.getWindow();
      if (typeof ((_a = win == null ? void 0 : win.AspectlyFlutter) == null ? void 0 : _a.postMessage) !== "function") {
        console.warn(
          "[FlutterTransport] window.AspectlyFlutter.postMessage is not available"
        );
        return;
      }
      win.AspectlyFlutter.postMessage(message);
    }
    subscribe(listener) {
      const win = this.getWindow();
      if (!win) {
        return () => {
        };
      }
      const handler = (event) => {
        if (typeof event.data === "string") {
          listener(event.data);
        }
      };
      win.addEventListener("message", handler);
      return () => win.removeEventListener("message", handler);
    }
  };
  var flutterDetector = {
    name: "flutter",
    priority: 84,
    // Below Android, above iframe
    detect: () => {
      var _a;
      return typeof window !== "undefined" && typeof ((_a = window.AspectlyFlutter) == null ? void 0 : _a.postMessage) === "function";
    },
    createTransport: () => new FlutterTransport()
  };
  var ReactNativeTransport = class extends BaseTransport {
    constructor() {
      super(...arguments);
      this.name = "react-native";
    }
    isAvailable() {
      var _a;
      const win = this.getWindow();
      return typeof ((_a = win == null ? void 0 : win.ReactNativeWebView) == null ? void 0 : _a.postMessage) === "function";
    }
    send(message) {
      var _a;
      const win = this.getWindow();
      if (!((_a = win == null ? void 0 : win.ReactNativeWebView) == null ? void 0 : _a.postMessage)) {
        console.warn("[ReactNativeTransport] ReactNativeWebView.postMessage is not available");
        return;
      }
      win.ReactNativeWebView.postMessage(`'${message}'`);
    }
    subscribe(listener) {
      const win = this.getWindow();
      if (!win) {
        return () => {
        };
      }
      const handler = (event) => {
        if (typeof event.data === "string") {
          listener(event.data);
        }
      };
      win.addEventListener("message", handler);
      return () => win.removeEventListener("message", handler);
    }
  };
  var reactNativeDetector = {
    name: "react-native",
    priority: 90,
    // Second priority
    detect: () => {
      var _a;
      return typeof window !== "undefined" && typeof ((_a = window.ReactNativeWebView) == null ? void 0 : _a.postMessage) === "function";
    },
    createTransport: () => new ReactNativeTransport()
  };
  var IframeTransport = class extends BaseTransport {
    /**
     * Create an iframe transport
     * @param targetOrigin Origin to send messages to (default: '*')
     */
    constructor(targetOrigin = "*") {
      super();
      this.name = "iframe";
      this.targetOrigin = targetOrigin;
    }
    isAvailable() {
      const win = this.getWindow();
      if (!win) return false;
      return win.parent !== win;
    }
    send(message) {
      const win = this.getWindow();
      if (!win) {
        console.warn("[IframeTransport] Window is not available");
        return;
      }
      if (win.parent === win) {
        console.warn("[IframeTransport] Not inside an iframe");
        return;
      }
      win.parent.postMessage(message, this.targetOrigin);
    }
    subscribe(listener) {
      const win = this.getWindow();
      if (!win) {
        return () => {
        };
      }
      const handler = (event) => {
        if (typeof event.data === "string") {
          listener(event.data);
        }
      };
      win.addEventListener("message", handler);
      return () => win.removeEventListener("message", handler);
    }
  };
  var iframeDetector = {
    name: "iframe",
    priority: 80,
    // Lowest priority - fallback
    detect: () => {
      return typeof window !== "undefined" && window.parent !== window;
    },
    createTransport: () => new IframeTransport()
  };
  var WindowTransport = class extends BaseTransport {
    /**
     * Create a window transport
     * @param targetOrigin Origin to send messages to (default: '*')
     */
    constructor(targetOrigin = "*") {
      super();
      this.name = "window";
      this.targetOrigin = targetOrigin;
    }
    isAvailable() {
      const win = this.getWindow();
      if (!win) return false;
      return win.opener !== null && !win.opener.closed;
    }
    send(message) {
      const win = this.getWindow();
      if (!win) {
        console.warn("[WindowTransport] Window is not available");
        return;
      }
      if (!win.opener || win.opener.closed) {
        console.warn("[WindowTransport] Opener window is not available");
        return;
      }
      win.opener.postMessage(message, this.targetOrigin);
    }
    subscribe(listener) {
      const win = this.getWindow();
      if (!win) {
        return () => {
        };
      }
      const handler = (event) => {
        if (typeof event.data === "string") {
          listener(event.data);
        }
      };
      win.addEventListener("message", handler);
      return () => win.removeEventListener("message", handler);
    }
  };
  var windowDetector = {
    name: "window",
    priority: 70,
    // Below iframe (80), above postmessage (10)
    detect: () => {
      try {
        return typeof window !== "undefined" && window.opener != null && !window.opener.closed;
      } catch (e) {
        return false;
      }
    },
    createTransport: () => new WindowTransport()
  };
  var PostMessageTransport = class extends BaseTransport {
    constructor() {
      super(...arguments);
      this.name = "postmessage";
    }
    isAvailable() {
      var _a;
      return typeof ((_a = this.getWindow()) == null ? void 0 : _a.addEventListener) === "function";
    }
    send(message) {
      const win = this.getWindow();
      if (!win) return;
      win.postMessage(message, "*");
    }
    subscribe(listener) {
      const win = this.getWindow();
      if (!win) {
        return () => {
        };
      }
      const handler = (event) => {
        if (typeof event.data === "string") {
          listener(event.data);
        }
      };
      win.addEventListener("message", handler);
      return () => win.removeEventListener("message", handler);
    }
  };
  var postMessageDetector = {
    name: "postmessage",
    priority: 10,
    // Lowest priority — fallback for any browser environment
    detect: () => {
      return typeof window !== "undefined" && typeof window.addEventListener === "function";
    },
    createTransport: () => new PostMessageTransport()
  };
  var NullTransport = class extends BaseTransport {
    constructor() {
      super(...arguments);
      this.name = "null";
    }
    isAvailable() {
      return true;
    }
    send(_message) {
      if (true) {
        console.warn("[NullTransport] No transport available, message not sent");
      }
    }
    subscribe(_listener) {
      return () => {
      };
    }
  };
  var TransportRegistryClass = class {
    constructor() {
      this.detectors = [];
      this.cachedTransport = null;
      this.register(cefSharpDetector);
      this.register(webKitDetector);
      this.register(androidDetector);
      this.register(flutterDetector);
      this.register(reactNativeDetector);
      this.register(iframeDetector);
      this.register(windowDetector);
      this.register(postMessageDetector);
    }
    /**
     * Register a custom transport detector
     * @param detector The detector to register
     */
    register(detector) {
      this.detectors = this.detectors.filter((d) => d.name !== detector.name);
      this.detectors.push(detector);
      this.detectors.sort((a, b) => b.priority - a.priority);
      this.cachedTransport = null;
    }
    /**
     * Unregister a transport detector by name
     * @param name Name of the detector to remove
     */
    unregister(name) {
      this.detectors = this.detectors.filter((d) => d.name !== name);
      this.cachedTransport = null;
    }
    /**
     * Get all registered detectors
     */
    getDetectors() {
      return this.detectors;
    }
    /**
     * Detect and return the appropriate transport for the current environment
     * Results are cached for performance
     * @param forceRedetect Force re-detection (ignores cache)
     */
    detect(forceRedetect = false) {
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
      this.cachedTransport = new NullTransport();
      return this.cachedTransport;
    }
    /**
     * Clear the cached transport (useful for testing)
     */
    clearCache() {
      this.cachedTransport = null;
    }
    /**
     * Reset registry to default state (built-in detectors only)
     */
    reset() {
      this.detectors = [];
      this.cachedTransport = null;
      this.register(cefSharpDetector);
      this.register(webKitDetector);
      this.register(androidDetector);
      this.register(flutterDetector);
      this.register(reactNativeDetector);
      this.register(iframeDetector);
      this.register(windowDetector);
      this.register(postMessageDetector);
    }
  };
  var TransportRegistry = new TransportRegistryClass();
  var detectTransport = (forceRedetect = false) => {
    return TransportRegistry.detect(forceRedetect);
  };

  // packages/core/src/BridgeCore.ts
  var _BridgeCore = class _BridgeCore {
    /**
     * Get the current transport (lazy initialization)
     */
    static getTransport() {
      if (!_BridgeCore.transport) {
        _BridgeCore.transport = detectTransport();
      }
      return _BridgeCore.transport;
    }
    /**
     * Set a custom transport (useful for testing or manual configuration)
     */
    static setTransport(transport) {
      _BridgeCore.transport = transport;
    }
    /**
     * Reset transport to auto-detect on next use
     */
    static resetTransport() {
      _BridgeCore.transport = null;
    }
    /**
     * Get the name of the current transport
     */
    static getTransportName() {
      return _BridgeCore.getTransport().name;
    }
  };
  _BridgeCore.BRIDGE_EVENT_TYPE = "BridgeEvent";
  _BridgeCore.transport = null;
  _BridgeCore.isJSONObject = (str) => {
    return str.startsWith("{") && str.endsWith("}");
  };
  /**
   * Wraps an event in the bridge protocol format
   */
  _BridgeCore.wrapBridgeEvent = (event) => {
    return JSON.stringify({
      event,
      type: _BridgeCore.BRIDGE_EVENT_TYPE
    });
  };
  /**
   * Creates a listener wrapper that parses incoming messages
   */
  _BridgeCore.wrapListener = (listener) => (data) => {
    if (typeof data !== "string") {
      return;
    }
    if (!data) {
      return;
    }
    let processedData = data;
    if (processedData.startsWith("'") && processedData.endsWith("'")) {
      processedData = processedData.substring(1, processedData.length - 1);
    }
    if (!_BridgeCore.isJSONObject(processedData)) {
      return;
    }
    try {
      const eventData = JSON.parse(processedData);
      if (!eventData || eventData.type !== _BridgeCore.BRIDGE_EVENT_TYPE) {
        return;
      }
      listener(eventData.event);
    } catch (e) {
    }
  };
  /**
   * Sends an event to the parent context using the detected transport
   */
  _BridgeCore.sendEvent = (event) => {
    const bridgeEvent = _BridgeCore.wrapBridgeEvent(event);
    const transport = _BridgeCore.getTransport();
    transport.send(bridgeEvent);
  };
  /**
   * Subscribes to incoming messages via the detected transport
   * @returns Cleanup function to unsubscribe
   */
  _BridgeCore.subscribe = (listener) => {
    const transport = _BridgeCore.getTransport();
    const wrappedListener = _BridgeCore.wrapListener(listener);
    return transport.subscribe(wrappedListener);
  };
  var BridgeCore = _BridgeCore;

  // packages/core/src/BridgeInternal.ts
  var internalEvent = (type, data) => ({
    type,
    data
  });
  var internalResultEvent = (data) => internalEvent("Result" /* Result */, data);
  var DEFAULT_TIMEOUT = 1e5;
  var BridgeInternal = class {
    constructor(sendEvent, options) {
      this.requests = [];
      this.handlers = {};
      this.available = false;
      this.supportedMethods = [];
      this.listeners = [];
      this.initResultReceived = false;
      /**
       * Reset bridge state for a new connection context.
       * Call this when the remote side has changed (e.g., new popup window).
       */
      this.reset = () => {
        this.handlers = {};
        this.available = false;
        this.supportedMethods = [];
        this.initPromise = void 0;
        this.initResultReceived = false;
      };
      /**
       * Register a single handler for a method.
       * Can be called before or after init().
       */
      this.registerHandler = (method, handler) => {
        this.handlers[method] = handler;
      };
      /**
       * Remove a previously registered handler.
       */
      this.unregisterHandler = (method) => {
        delete this.handlers[method];
      };
      /**
       * Subscribe to all result events
       */
      this.subscribe = (listener) => {
        return this.listeners.push(listener);
      };
      /**
       * Unsubscribe from result events
       */
      this.unsubscribe = (listener) => {
        this.listeners = this.listeners.filter(
          (oldListener) => oldListener !== listener
        );
      };
      this.checkDiff = (a, b) => {
        return a.filter((x) => !b.includes(x)).length > 0 || b.filter((x) => !a.includes(x)).length > 0;
      };
      /**
       * Initialize the bridge with handlers
       * @param handlers Map of method names to handler functions
       * @returns Promise that resolves when the other side acknowledges
       */
      this.init = (handlers = {}) => {
        const oldMethods = Object.keys(this.handlers);
        const newMethods = Object.keys(handlers);
        this.handlers = handlers;
        if (!this.checkDiff(oldMethods, newMethods)) {
          return Promise.resolve(true);
        }
        return new Promise((resolve, reject) => {
          this.initPromise = { resolve, reject };
          this.sendEvent(
            internalEvent("Init" /* Init */, {
              methods: newMethods
            })
          );
        });
      };
      /**
       * Handle incoming bridge events
       */
      this.handleCoreEvent = (event) => {
        const { type, data } = event;
        switch (type) {
          case "Init" /* Init */:
            this.handleInit(data);
            break;
          case "InitResult" /* InitResult */:
            this.handleInitResult(data);
            break;
          case "Request" /* Request */:
            this.handleRequest(data);
            break;
          case "Result" /* Result */:
            this.handleResult(data);
            break;
        }
      };
      /**
       * Handle incoming requests and execute the appropriate handler
       */
      this.handleRequest = (request) => {
        const { method, params, request_id } = request;
        new Promise((resolve, reject) => {
          let timeout = false;
          if (!Object.prototype.hasOwnProperty.call(this.handlers, method)) {
            reject({
              error_type: "UNSUPPORTED_METHOD" /* UNSUPPORTED_METHOD */,
              error: new Error(`Handler for \xAB${method}\xBB is not registered`)
            });
            return;
          }
          const timer = setTimeout(() => {
            timeout = true;
            reject({
              error_type: "METHOD_EXECUTION_TIMEOUT" /* METHOD_EXECUTION_TIMEOUT */,
              error: new Error("Execution timeout exceeded")
            });
          }, this.timeout);
          const handler = this.handlers[method];
          if (!handler) {
            reject({
              error_type: "UNSUPPORTED_METHOD" /* UNSUPPORTED_METHOD */,
              error: new Error(`Handler for \xAB${method}\xBB is undefined`)
            });
            return;
          }
          handler(params).then((result) => {
            if (timeout) {
              return;
            }
            clearTimeout(timer);
            resolve(result);
          }).catch((error) => {
            if (timeout) {
              return;
            }
            clearTimeout(timer);
            reject({
              error_type: "REJECTED" /* REJECTED */,
              error
            });
          });
        }).then((data) => {
          this.sendEvent(
            internalResultEvent({
              type: "Success" /* Success */,
              data,
              method,
              request_id
            })
          );
        }).catch(
          ({
            error_type,
            error
          }) => {
            this.sendEvent(
              internalResultEvent({
                type: "Error" /* Error */,
                request_id,
                method,
                data: {
                  error_message: error.message,
                  error_type
                }
              })
            );
          }
        );
      };
      this.handleResult = (result) => {
        this.handleRequestResult(result);
        this.listeners.forEach((listener) => listener(result));
      };
      this.handleRequestResult = (result) => {
        if (!result || !Object.prototype.hasOwnProperty.call(result, "request_id")) {
          return;
        }
        if (!Object.prototype.hasOwnProperty.call(result, "type")) {
          console.warn("unknown result", result);
          return;
        }
        const { request_id, data, type } = result;
        const request = this.requests[Number(request_id)];
        if (!request) {
          return;
        }
        if (type === "Success" /* Success */) {
          request.resolve(data);
          return;
        }
        if (type === "Error" /* Error */) {
          request.reject(data || result.error);
        }
      };
      this.handleInit = (data) => {
        this.available = true;
        this.supportedMethods = data.methods;
        this.sendEvent(internalEvent("InitResult" /* InitResult */, true));
        this.initResultReceived = true;
        this.tryResolveInit();
      };
      this.handleInitResult = (success) => {
        var _a;
        if (success) {
          this.initResultReceived = true;
          this.tryResolveInit();
        } else {
          (_a = this.initPromise) == null ? void 0 : _a.reject();
        }
      };
      this.tryResolveInit = () => {
        var _a;
        if (this.initResultReceived && this.available) {
          (_a = this.initPromise) == null ? void 0 : _a.resolve(true);
        }
      };
      /**
       * Send a request to the other side
       * @param method Method name to invoke
       * @param params Parameters to pass to the method
       * @returns Promise that resolves with the result
       */
      this.send = (method, params) => new Promise((resolve, reject) => {
        const request_id = (this.requests.push({ resolve, reject }) - 1).toString();
        if (!this.isAvailable()) {
          this.handleCoreEvent(
            internalResultEvent({
              type: "Error" /* Error */,
              request_id,
              method,
              data: {
                error_message: "Bridge is not available",
                error_type: "BRIDGE_NOT_AVAILABLE" /* BRIDGE_NOT_AVAILABLE */
              }
            })
          );
          return;
        }
        this.sendEvent(
          internalEvent("Request" /* Request */, {
            method,
            params,
            request_id
          })
        );
      });
      /**
       * Check if a method is supported by the other side
       */
      this.supports = (method) => this.supportedMethods.includes(method);
      /**
       * Check if the bridge is available (initialized)
       */
      this.isAvailable = () => this.available;
      var _a;
      this.sendEvent = sendEvent;
      this.timeout = (_a = options == null ? void 0 : options.timeout) != null ? _a : DEFAULT_TIMEOUT;
    }
  };

  // packages/core/src/BridgeBase.ts
  var BridgeBase = class {
    constructor(bridge) {
      /**
       * Check if a method is supported by the other side
       * @param method Method name to check
       */
      this.supports = (method) => this.bridge.supports(method);
      /**
       * Check if the bridge is available (initialized)
       */
      this.isAvailable = () => this.bridge.isAvailable();
      /**
       * Send a request to invoke a method on the other side
       * @param method Method name to invoke
       * @param params Parameters to pass
       * @returns Promise resolving with the result
       */
      this.send = (method, params = {}) => {
        return this.bridge.send(method, params);
      };
      /**
       * Subscribe to all result events
       * @param listener Callback for result events
       * @returns Subscription index
       */
      this.subscribe = (listener) => {
        return this.bridge.subscribe(listener);
      };
      /**
       * Unsubscribe from result events
       * @param listener The listener to remove
       */
      this.unsubscribe = (listener) => {
        return this.bridge.unsubscribe(listener);
      };
      /**
       * Register a single handler for a method.
       * Can be called before or after init().
       * @param method Method name to handle
       * @param handler Async function to handle the method
       */
      this.registerHandler = (method, handler) => {
        this.bridge.registerHandler(method, handler);
      };
      /**
       * Remove a previously registered handler.
       * @param method Method name to remove
       */
      this.unregisterHandler = (method) => {
        this.bridge.unregisterHandler(method);
      };
      /**
       * Initialize the bridge with handlers
       * @param handlers Map of method names to handler functions
       * @returns Promise resolving when initialization is complete
       */
      this.init = (handlers) => this.bridge.init(handlers);
      /**
       * Reset bridge state for a new connection context
       */
      this.reset = () => this.bridge.reset();
      this.bridge = bridge;
    }
  };

  // packages/core/src/AspectlyBridge.ts
  var AspectlyBridge = class extends BridgeBase {
    constructor(options) {
      const bridge = new BridgeInternal(BridgeCore.sendEvent, options);
      super(bridge);
      /**
       * Cleanup bridge subscriptions
       */
      this.destroy = () => {
        this.cleanupSubscription();
      };
      this.cleanupSubscription = BridgeCore.subscribe(
        bridge.handleCoreEvent
      );
    }
  };

  // packages/core/src/browser.ts
  if (typeof window !== "undefined") {
    window.aspectlyBridge = new AspectlyBridge();
  }
})();
