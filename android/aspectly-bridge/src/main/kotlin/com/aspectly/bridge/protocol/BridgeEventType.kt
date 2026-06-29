package com.aspectly.bridge.protocol

/**
 * Event types for the Aspectly bridge protocol.
 * Values match the `@aspectly/core` strings exactly.
 */
enum class BridgeEventType(val value: String) {
    /** Initialization message - exchange supported methods. */
    INIT("Init"),

    /** Initialization result - confirm initialization success/failure. */
    INIT_RESULT("InitResult"),

    /** Request message - method invocation with params and request_id. */
    REQUEST("Request"),

    /** Result message - response with success/error data. */
    RESULT("Result");

    companion object {
        fun fromValue(value: String): BridgeEventType? = entries.firstOrNull { it.value == value }
    }
}
