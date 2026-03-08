using System.Text.Json.Serialization;

namespace Aspectly.Bridge.Protocol;

/// <summary>
/// Result types for bridge responses.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum BridgeResultType
{
    /// <summary>
    /// Method executed successfully.
    /// </summary>
    Success,

    /// <summary>
    /// Method execution failed.
    /// </summary>
    Error
}
