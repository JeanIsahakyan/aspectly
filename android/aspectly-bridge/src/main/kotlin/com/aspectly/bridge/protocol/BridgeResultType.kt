package com.aspectly.bridge.protocol

/**
 * Result types for bridge responses.
 * Values match the `@aspectly/core` strings exactly.
 */
enum class BridgeResultType(val value: String) {
    /** Method executed successfully. */
    SUCCESS("Success"),

    /** Method execution failed. */
    ERROR("Error");

    companion object {
        fun fromValue(value: String): BridgeResultType? = entries.firstOrNull { it.value == value }
    }
}
