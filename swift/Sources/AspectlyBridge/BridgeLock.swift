import Foundation

/// A thin wrapper around `NSLock` that is safe to use from asynchronous
/// contexts (as long as the critical section itself does not `await`).
///
/// `NSLock.lock()` / `unlock()` are annotated as unavailable from async
/// contexts; wrapping them here keeps `BridgeHost`'s short, non-suspending
/// critical sections both correct and warning-free under strict concurrency.
final class BridgeLock {
    private let nsLock = NSLock()

    @inline(__always)
    func lock() {
        nsLock.lock()
    }

    @inline(__always)
    func unlock() {
        nsLock.unlock()
    }

    @inline(__always)
    func withLock<T>(_ body: () throws -> T) rethrows -> T {
        nsLock.lock()
        defer { nsLock.unlock() }
        return try body()
    }
}
