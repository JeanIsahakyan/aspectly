using System.Text.Json.Serialization;

namespace Aspectly.Bridge.Protocol;

/// <summary>
/// Event types for the Aspectly bridge protocol.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum BridgeEventType
{
    /// <summary>
    /// Initialization message - exchange supported methods.
    /// </summary>
    Init,

    /// <summary>
    /// Initialization result - confirm initialization success/failure.
    /// </summary>
    InitResult,

    /// <summary>
    /// Request message - method invocation with params and request_id.
    /// </summary>
    Request,

    /// <summary>
    /// Result message - response with success/error data.
    /// </summary>
    Result
}
