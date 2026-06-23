package com.aspectly.bridge.protocol

/**
 * Error types for bridge protocol errors.
 * Values match the `@aspectly/core` `error_type` strings exactly.
 */
enum class BridgeErrorType(val value: String) {
    /** Method execution exceeded timeout. */
    METHOD_EXECUTION_TIMEOUT("METHOD_EXECUTION_TIMEOUT"),

    /** Method is not supported/registered. */
    UNSUPPORTED_METHOD("UNSUPPORTED_METHOD"),

    /** Method execution was rejected (handler threw an exception). */
    REJECTED("REJECTED"),

    /** Bridge is not available or not initialized. */
    BRIDGE_NOT_AVAILABLE("BRIDGE_NOT_AVAILABLE");

    companion object {
        fun fromValue(value: String): BridgeErrorType? = entries.firstOrNull { it.value == value }
    }
}
