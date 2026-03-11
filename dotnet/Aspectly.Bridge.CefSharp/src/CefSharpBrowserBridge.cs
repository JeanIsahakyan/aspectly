using System.Windows.Threading;
using CefSharp;
using CefSharp.Wpf;
using Aspectly.Bridge;

namespace Aspectly.Bridge.CefSharp;

/// <summary>
/// IBrowserBridge implementation for CefSharp ChromiumWebBrowser.
/// Handles message passing between .NET and JavaScript via CefSharp bindings.
/// When a WPF Dispatcher is provided, all browser access is automatically
/// dispatched to the UI thread (required because ChromiumWebBrowser.IsBrowserInitialized
/// is a DependencyProperty that throws when accessed from non-UI threads).
/// </summary>
public class CefSharpBrowserBridge : IBrowserBridge
{
    private readonly ChromiumWebBrowser _browser;
    private readonly Dispatcher? _dispatcher;
    private bool _disposed;

    /// <inheritdoc />
    public bool IsReady
    {
        get
        {
            if (_dispatcher == null || _dispatcher.CheckAccess())
                return _browser.IsBrowserInitialized;

            return _dispatcher.Invoke(() => _browser.IsBrowserInitialized);
        }
    }

    /// <inheritdoc />
    public event EventHandler<BrowserMessageEventArgs>? MessageReceived;

    /// <summary>
    /// Creates a new CefSharpBrowserBridge for the specified browser.
    /// </summary>
    /// <param name="browser">The ChromiumWebBrowser instance to bind to.</param>
    /// <param name="dispatcher">
    /// Optional WPF Dispatcher for thread-safe browser access.
    /// When provided, IsReady and ExecuteScriptAsync are dispatched to the UI thread.
    /// Recommended when the bridge may be accessed from non-UI threads (e.g., CEF IO thread).
    /// </param>
    public CefSharpBrowserBridge(ChromiumWebBrowser browser, Dispatcher? dispatcher = null)
    {
        _browser = browser ?? throw new ArgumentNullException(nameof(browser));
        _dispatcher = dispatcher;
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
        if (_dispatcher == null || _dispatcher.CheckAccess())
        {
            if (!_browser.IsBrowserInitialized)
                throw new InvalidOperationException("Browser is not initialized");

            await _browser.EvaluateScriptAsync(script);
        }
        else
        {
            await _dispatcher.InvokeAsync(async () =>
            {
                if (!_browser.IsBrowserInitialized)
                    throw new InvalidOperationException("Browser is not initialized");

                await _browser.EvaluateScriptAsync(script);
            }).Task.Unwrap();
        }
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
