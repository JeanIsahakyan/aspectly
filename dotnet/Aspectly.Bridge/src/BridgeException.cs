using Aspectly.Bridge.Protocol;

namespace Aspectly.Bridge;

/// <summary>
/// Exception type for bridge protocol errors.
/// </summary>
public class BridgeException : Exception
{
    /// <summary>
    /// The type of bridge error that occurred.
    /// </summary>
    public BridgeErrorType ErrorType { get; }

    /// <summary>
    /// Creates a new BridgeException with the specified error type and message.
    /// </summary>
    /// <param name="errorType">The type of error.</param>
    /// <param name="message">Optional error message.</param>
    public BridgeException(BridgeErrorType errorType, string? message = null)
        : base(message ?? errorType.ToString())
    {
        ErrorType = errorType;
    }

    /// <summary>
    /// Creates a new BridgeException with an inner exception.
    /// </summary>
    /// <param name="errorType">The type of error.</param>
    /// <param name="message">Error message.</param>
    /// <param name="innerException">The inner exception.</param>
    public BridgeException(BridgeErrorType errorType, string message, Exception innerException)
        : base(message, innerException)
    {
        ErrorType = errorType;
    }
}
