using System.Text.Json;
using System.Text.Json.Serialization;

namespace Aspectly.Bridge.Protocol;

/// <summary>
/// Init message payload - exchange supported methods.
/// Sent during bridge initialization to register available methods.
/// </summary>
public sealed class BridgeInitData
{
    /// <summary>
    /// List of method names this side supports.
    /// </summary>
    [JsonPropertyName("methods")]
    public string[] Methods { get; set; } = Array.Empty<string>();
}

/// <summary>
/// Request message payload - method invocation.
/// Sent when one side wants to call a method on the other.
/// </summary>
public sealed class BridgeRequestData
{
    /// <summary>
    /// The method name to invoke.
    /// </summary>
    [JsonPropertyName("method")]
    public string Method { get; set; } = string.Empty;

    /// <summary>
    /// Method parameters as a JSON element (can be any JSON object).
    /// </summary>
    [JsonPropertyName("params")]
    public JsonElement Params { get; set; }

    /// <summary>
    /// Unique request identifier for correlating responses.
    /// </summary>
    [JsonPropertyName("request_id")]
    public string RequestId { get; set; } = string.Empty;
}

/// <summary>
/// Error details for failed method execution.
/// </summary>
public sealed class BridgeResultError
{
    /// <summary>
    /// The type of error that occurred.
    /// </summary>
    [JsonPropertyName("error_type")]
    public BridgeErrorType ErrorType { get; set; }

    /// <summary>
    /// Human-readable error message (optional).
    /// </summary>
    [JsonPropertyName("error_message")]
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Result message payload - response to a request.
/// Contains either success data or error information.
/// </summary>
public sealed class BridgeResultData
{
    /// <summary>
    /// Whether the result is Success or Error.
    /// </summary>
    [JsonPropertyName("type")]
    public BridgeResultType Type { get; set; }

    /// <summary>
    /// Result data for successful execution (null for errors).
    /// </summary>
    [JsonPropertyName("data")]
    public JsonElement? Data { get; set; }

    /// <summary>
    /// Error details for failed execution (null for success).
    /// </summary>
    [JsonPropertyName("error")]
    public BridgeResultError? Error { get; set; }

    /// <summary>
    /// The method that was called.
    /// </summary>
    [JsonPropertyName("method")]
    public string? Method { get; set; }

    /// <summary>
    /// The request ID this result corresponds to.
    /// </summary>
    [JsonPropertyName("request_id")]
    public string? RequestId { get; set; }
}

/// <summary>
/// Outer wrapper for Aspectly protocol messages.
/// Format: { "type": "BridgeEvent", "event": { ... inner payload ... } }
/// </summary>
public sealed class BridgeEventWrapper
{
    /// <summary>
    /// Must be "BridgeEvent" for valid messages.
    /// </summary>
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// The inner event payload.
    /// </summary>
    [JsonPropertyName("event")]
    public JsonElement Event { get; set; }
}

/// <summary>
/// Inner event payload after unwrapping the BridgeEvent envelope.
/// Format: { "type": "Init|Request|Result|InitResult", "data": { ... } }
/// </summary>
public sealed class BridgeEventPayload
{
    /// <summary>
    /// The type of bridge event (Init, InitResult, Request, Result).
    /// </summary>
    [JsonPropertyName("type")]
    public BridgeEventType Type { get; set; }

    /// <summary>
    /// The raw event data, to be parsed based on the event type.
    /// </summary>
    [JsonPropertyName("data")]
    public JsonElement Data { get; set; }
}
