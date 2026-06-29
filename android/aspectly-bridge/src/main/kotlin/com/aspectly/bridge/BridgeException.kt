package com.aspectly.bridge

import com.aspectly.bridge.protocol.BridgeErrorType

/**
 * Exception type for bridge protocol errors. The Kotlin equivalent of .NET's
 * `BridgeException` / Swift's `BridgeError`.
 */
class BridgeException(
    val errorType: BridgeErrorType,
    message: String? = null,
    cause: Throwable? = null,
) : Exception(message ?: errorType.value, cause)
