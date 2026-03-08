'use strict';

var transports = require('@aspectly/transports');

// src/BridgeCore.ts
var _BridgeCore = class _BridgeCore {
  /**
   * Get the current transport (lazy initialization)
   */
  static getTransport() {
    if (!_BridgeCore.transport) {
      _BridgeCore.transport = transports.detectTransport();
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
  } catch {
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

// src/BridgeInternal.ts
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
        request.reject(data);
      }
    };
    this.handleInit = (data) => {
      this.available = true;
      this.supportedMethods = data.methods;
      this.sendEvent(internalEvent("InitResult" /* InitResult */, true));
    };
    this.handleInitResult = (success) => {
      if (success) {
        this.initPromise?.resolve(true);
      } else {
        this.initPromise?.reject();
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
    this.sendEvent = sendEvent;
    this.timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  }
};

// src/BridgeBase.ts
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
     * Initialize the bridge with handlers
     * @param handlers Map of method names to handler functions
     * @returns Promise resolving when initialization is complete
     */
    this.init = (handlers) => this.bridge.init(handlers);
    this.bridge = bridge;
  }
};

// src/AspectlyBridge.ts
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

// src/browser.ts
if (typeof window !== "undefined") {
  window.aspectlyBridge = new AspectlyBridge();
}

exports.AspectlyBridge = AspectlyBridge;
//# sourceMappingURL=browser.js.map
//# sourceMappingURL=browser.js.map