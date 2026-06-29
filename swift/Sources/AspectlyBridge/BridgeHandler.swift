import Foundation

/// A handler closure registered with `BridgeHost`. Receives the raw request
/// params and returns an `Encodable` result (or `nil`).
public typealias RawBridgeHandler = (JSONValue) async throws -> Encodable?

/// Protocol for type-safe bridge handlers.
///
/// Implement this protocol to create handlers that can be registered with
/// `BridgeHost`. The Swift equivalent of .NET's `IBridgeHandler<TParams, TResult>`.
public protocol BridgeHandler {
    /// Parameters the handler accepts (decoded from the JS request).
    associatedtype Params: Decodable
    /// Result the handler returns (encoded back to JS).
    associatedtype Result: Encodable

    /// The method name that JavaScript will use to call this handler.
    var methodName: String { get }

    /// Handle the request with the given parameters.
    /// - Parameter params: Deserialized parameters from JavaScript.
    /// - Returns: The result to send back to JavaScript.
    func handle(_ params: Params) async throws -> Result
}
