using Microsoft.Web.WebView2.Wpf;
using Aspectly.Bridge;

namespace Aspectly.Bridge.WebView2;

/// <summary>
/// IBrowserBridge implementation for Microsoft Edge WebView2.
/// </summary>
public class WebView2BrowserBridge : IBrowserBridge
{
    private readonly Microsoft.Web.WebView2.Wpf.WebView2 _webView;
    private bool _disposed;

    /// <inheritdoc />
    public bool IsReady => _webView.CoreWebView2 != null;

    /// <inheritdoc />
    public event EventHandler<BrowserMessageEventArgs>? MessageReceived;

    /// <summary>
    /// Creates a new WebView2BrowserBridge.
    /// </summary>
    public WebView2BrowserBridge(Microsoft.Web.WebView2.Wpf.WebView2 webView)
    {
        _webView = webView ?? throw new ArgumentNullException(nameof(webView));
        _webView.WebMessageReceived += OnWebMessageReceived;
    }

    private void OnWebMessageReceived(object? sender, Microsoft.Web.WebView2.Core.CoreWebView2WebMessageReceivedEventArgs e)
    {
        var message = e.TryGetWebMessageAsString();
        if (!string.IsNullOrEmpty(message))
        {
            MessageReceived?.Invoke(this, new BrowserMessageEventArgs(message));
        }
    }

    /// <inheritdoc />
    public async Task ExecuteScriptAsync(string script)
    {
        if (_webView.CoreWebView2 == null)
            throw new InvalidOperationException("WebView2 is not initialized");

        await _webView.CoreWebView2.ExecuteScriptAsync(script);
    }

    /// <inheritdoc />
    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _webView.WebMessageReceived -= OnWebMessageReceived;
        GC.SuppressFinalize(this);
    }
}
