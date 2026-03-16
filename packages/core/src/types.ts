/**
 * Event types used in bridge communication protocol
 */
export enum BridgeEventType {
  /** Request to invoke a method on the other side */
  Request = 'Request',
  /** Response to a request */
  Result = 'Result',
  /** Initialization handshake */
  Init = 'Init',
  /** Response to initialization */
  InitResult = 'InitResult',
}

/**
 * Result types for bridge responses
 */
export enum BridgeResultType {
  /** Successful response */
  Success = 'Success',
  /** Error response */
  Error = 'Error',
}

/**
 * Error types that can occur during bridge communication
 */
export enum BridgeErrorType {
  /** Handler took longer than timeout (default: 100s) */
  METHOD_EXECUTION_TIMEOUT = 'METHOD_EXECUTION_TIMEOUT',
  /** Method is not registered on the receiving side */
  UNSUPPORTED_METHOD = 'UNSUPPORTED_METHOD',
  /** Handler threw an error */
  REJECTED = 'REJECTED',
  /** Bridge is not initialized or unavailable */
  BRIDGE_NOT_AVAILABLE = 'BRIDGE_NOT_AVAILABLE',
}

/**
 * Error data returned when a bridge call fails
 */
export interface BridgeResultError {
  error_type: BridgeErrorType;
  error_message?: string;
}

/**
 * Successful result data (any object)
 */
export type BridgeResultSuccess = object;

/**
 * Union type for result data
 */
export type BridgeResultData =
  | BridgeResultError
  | undefined
  | BridgeResultSuccess;

/**
 * Result event sent back after processing a request
 */
export interface BridgeResultEvent {
  type?: BridgeResultType;
  method?: string;
  request_id?: string;
  data?: BridgeResultData;
  error?: BridgeResultError;
}

/**
 * Request event sent to invoke a method
 */
export interface BridgeRequestEvent {
  method: string;
  params: object;
  request_id?: string;
}

/**
 * Initialization event with available methods
 */
export interface BridgeInitEvent {
  methods: string[];
}

/**
 * Initialization result (success/failure)
 */
export type BridgeInitResultEvent = boolean;

/**
 * Union of all possible bridge data payloads
 */
export type BridgeData =
  | BridgeResultEvent
  | BridgeInitEvent
  | BridgeInitResultEvent
  | BridgeRequestEvent;

/**
 * Complete bridge event with type and data
 */
export interface BridgeEvent {
  type: BridgeEventType;
  data: BridgeData;
}

/**
 * Handler function for processing incoming requests
 */
export type BridgeHandler<TParams = object, TResult = unknown> = (
  params: TParams
) => Promise<TResult>;

/**
 * Map of method names to their handlers
 */
export interface BridgeHandlers {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: BridgeHandler<any, any>;
}

/**
 * Listener function for bridge result events
 */
export type BridgeListener = (result: BridgeResultEvent) => void;

/**
 * Options for bridge initialization
 */
export interface BridgeOptions {
  /** Timeout for method execution in milliseconds (default: 100000) */
  timeout?: number;
}
