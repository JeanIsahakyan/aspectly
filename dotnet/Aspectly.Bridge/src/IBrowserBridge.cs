namespace Aspectly.Bridge;

/// <summary>
/// Abstraction for browser message passing.
/// Implement this interface to support different browser controls (CefSharp, WebView2, etc.)
/// </summary>
public interface IBrowserBridge : IDisposable
{
    /// <summary>
    /// Gets whether the browser is initialized and ready for communication.
    /// </summary>
    bool IsReady { get; }

    /// <summary>
    /// Raised when a message is received from JavaScript.
    /// </summary>
    event EventHandler<BrowserMessageEventArgs>? MessageReceived;

    /// <summary>
    /// Sends a message to JavaScript by executing a script.
    /// </summary>
    /// <param name="script">The JavaScript code to execute.</param>
    Task ExecuteScriptAsync(string script);
}

/// <summary>
/// Event args for messages received from JavaScript.
/// </summary>
public class BrowserMessageEventArgs : EventArgs
{
    /// <summary>
    /// The message content received from JavaScript.
    /// </summary>
    public string Message { get; }

    /// <summary>
    /// Creates a new BrowserMessageEventArgs.
    /// </summary>
    /// <param name="message">The message content.</param>
    public BrowserMessageEventArgs(string message)
    {
        Message = message ?? throw new ArgumentNullException(nameof(message));
    }
}
