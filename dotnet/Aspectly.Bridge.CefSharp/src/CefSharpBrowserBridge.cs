using CefSharp;
using CefSharp.Wpf;
using Aspectly.Bridge;

namespace Aspectly.Bridge.CefSharp;

/// <summary>
/// IBrowserBridge implementation for CefSharp ChromiumWebBrowser.
/// Handles message passing between .NET and JavaScript via CefSharp bindings.
/// </summary>
public class CefSharpBrowserBridge : IBrowserBridge
{
    private readonly ChromiumWebBrowser _browser;
    private bool _disposed;

    /// <inheritdoc />
    public bool IsReady => _browser.IsBrowserInitialized;

    /// <inheritdoc />
    public event EventHandler<BrowserMessageEventArgs>? MessageReceived;

    /// <summary>
    /// Creates a new CefSharpBrowserBridge for the specified browser.
    /// </summary>
    /// <param name="browser">The ChromiumWebBrowser instance to bind to.</param>
    public CefSharpBrowserBridge(ChromiumWebBrowser browser)
    {
        _browser = browser ?? throw new ArgumentNullException(nameof(browser));
        _browser.JavascriptMessageReceived += OnJavascriptMessageReceived;
    }

    private void OnJavascriptMessageReceived(object? sender, JavascriptMessageReceivedEventArgs e)
    {
        var message = e.Message?.ToString();
        if (!string.IsNullOrEmpty(message))
        {
            MessageReceived?.Invoke(this, new BrowserMessageEventArgs(message));
        }
    }

    /// <inheritdoc />
    public async Task ExecuteScriptAsync(string script)
    {
        if (!_browser.IsBrowserInitialized)
        {
            throw new InvalidOperationException("Browser is not initialized");
        }

        await _browser.EvaluateScriptAsync(script);
    }

    /// <inheritdoc />
    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        _browser.JavascriptMessageReceived -= OnJavascriptMessageReceived;
        GC.SuppressFinalize(this);
    }
}
