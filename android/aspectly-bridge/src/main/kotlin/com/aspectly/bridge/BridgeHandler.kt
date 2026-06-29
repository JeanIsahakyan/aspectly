package com.aspectly.bridge

import com.google.gson.Gson
import com.google.gson.JsonElement

/** A raw handler: receives the request params as a [JsonElement] and returns an encodable result. */
typealias RawBridgeHandler = suspend (JsonElement) -> Any?

/**
 * Interface for type-safe bridge handlers. The Kotlin equivalent of .NET's /
 * Swift's `BridgeHandler`.
 */
interface BridgeHandler<P, R> {
    /** The method name that JavaScript will use to call this handler. */
    val methodName: String

    /** Handle the request with the deserialized parameters. */
    suspend fun handle(params: P): R
}

/** Shared Gson instance used for bridge (de)serialization. */
object BridgeJson {
    val gson: Gson = Gson()
}
