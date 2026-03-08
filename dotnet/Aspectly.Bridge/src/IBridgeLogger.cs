namespace Aspectly.Bridge;

/// <summary>
/// Simple logging interface for BridgeHost.
/// Implement this to integrate with your logging framework (NLog, Serilog, etc.)
/// </summary>
public interface IBridgeLogger
{
    /// <summary>
    /// Log a debug message.
    /// </summary>
    void Debug(string message);

    /// <summary>
    /// Log an info message.
    /// </summary>
    void Info(string message);

    /// <summary>
    /// Log a warning message.
    /// </summary>
    void Warn(string message);

    /// <summary>
    /// Log an error message with optional exception.
    /// </summary>
    void Error(string message, Exception? exception = null);
}

/// <summary>
/// Default logger implementation that writes to Console.
/// </summary>
public class ConsoleLogger : IBridgeLogger
{
    /// <summary>
    /// Singleton instance.
    /// </summary>
    public static readonly ConsoleLogger Instance = new();

    /// <inheritdoc />
    public void Debug(string message) => Console.WriteLine($"[DEBUG] {message}");

    /// <inheritdoc />
    public void Info(string message) => Console.WriteLine($"[INFO] {message}");

    /// <inheritdoc />
    public void Warn(string message) => Console.WriteLine($"[WARN] {message}");

    /// <inheritdoc />
    public void Error(string message, Exception? exception = null)
    {
        Console.WriteLine($"[ERROR] {message}");
        if (exception != null)
        {
            Console.WriteLine($"  Exception: {exception}");
        }
    }
}

/// <summary>
/// Null logger that discards all messages (no-op).
/// </summary>
public class NullLogger : IBridgeLogger
{
    /// <summary>
    /// Singleton instance.
    /// </summary>
    public static readonly NullLogger Instance = new();

    private NullLogger() { }

    /// <inheritdoc />
    public void Debug(string message) { }

    /// <inheritdoc />
    public void Info(string message) { }

    /// <inheritdoc />
    public void Warn(string message) { }

    /// <inheritdoc />
    public void Error(string message, Exception? exception = null) { }
}
