using System.Text.Json.Serialization;

namespace Aspectly.Bridge.Protocol;

/// <summary>
/// Error types for bridge protocol errors.
/// Values match @aspectly/core error_type strings exactly.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum BridgeErrorType
{
    /// <summary>
    /// Method execution exceeded timeout.
    /// </summary>
    METHOD_EXECUTION_TIMEOUT,

    /// <summary>
    /// Method is not supported/registered.
    /// </summary>
    UNSUPPORTED_METHOD,

    /// <summary>
    /// Method execution was rejected (handler threw an exception).
    /// </summary>
    REJECTED,

    /// <summary>
    /// Bridge is not available or not initialized.
    /// </summary>
    BRIDGE_NOT_AVAILABLE
}
