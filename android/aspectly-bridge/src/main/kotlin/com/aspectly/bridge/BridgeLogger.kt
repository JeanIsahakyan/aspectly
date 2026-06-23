package com.aspectly.bridge

/**
 * Simple logging interface for [BridgeHost].
 * Implement this to integrate with your logging framework.
 */
interface BridgeLogger {
    fun debug(message: String)
    fun info(message: String)
    fun warn(message: String)
    fun error(message: String, error: Throwable? = null)
}

/** Default logger implementation that writes to standard output. */
object ConsoleLogger : BridgeLogger {
    override fun debug(message: String) = println("[DEBUG] $message")
    override fun info(message: String) = println("[INFO] $message")
    override fun warn(message: String) = println("[WARN] $message")
    override fun error(message: String, error: Throwable?) {
        println("[ERROR] $message")
        if (error != null) println("  Error: $error")
    }
}

/** Null logger that discards all messages (no-op). */
object NullLogger : BridgeLogger {
    override fun debug(message: String) {}
    override fun info(message: String) {}
    override fun warn(message: String) {}
    override fun error(message: String, error: Throwable?) {}
}
