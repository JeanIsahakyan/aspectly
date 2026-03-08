namespace Aspectly.Bridge;

/// <summary>
/// Interface for type-safe bridge handlers.
/// Implement this interface to create handlers that can be registered with BridgeHost.
/// </summary>
/// <typeparam name="TParams">The type of parameters the handler accepts.</typeparam>
/// <typeparam name="TResult">The type of result the handler returns.</typeparam>
public interface IBridgeHandler<TParams, TResult>
{
    /// <summary>
    /// The method name that JavaScript will use to call this handler.
    /// </summary>
    string MethodName { get; }

    /// <summary>
    /// Handles the request with the given parameters.
    /// </summary>
    /// <param name="parameters">Deserialized parameters from JavaScript.</param>
    /// <returns>The result to send back to JavaScript.</returns>
    Task<TResult> HandleAsync(TParams parameters);
}
