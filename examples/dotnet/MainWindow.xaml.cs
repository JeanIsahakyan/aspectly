using System.IO;
using System.Windows;
using System.Windows.Media;
using Aspectly.Bridge;
using Aspectly.Bridge.CefSharp;
using CefSharp;

namespace Aspectly.Example;

public partial class MainWindow : Window
{
    private CefSharpBrowserBridge? _browserBridge;
    private BridgeHost? _bridgeHost;

    public MainWindow()
    {
        InitializeComponent();

        var htmlPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "wwwroot", "index.html");
        Browser.Address = htmlPath;

        Browser.IsBrowserInitializedChanged += OnBrowserInitialized;
        Browser.FrameLoadEnd += OnFrameLoadEnd;
        Closed += OnClosed;
    }

    private void OnBrowserInitialized(object? sender, DependencyPropertyChangedEventArgs e)
    {
        if (!Browser.IsBrowserInitialized) return;

        Log("Browser initialized, setting up bridge...");

        _browserBridge = new CefSharpBrowserBridge(Browser, Dispatcher);
        _bridgeHost = new BridgeHost(_browserBridge);

        // Register handlers that JS can call
        _bridgeHost.RegisterHandler<string>("ping", async () =>
        {
            Log("[Handler] ping -> pong");
            return "pong";
        });

        _bridgeHost.RegisterHandler<EchoParams, string>("echo", async (p) =>
        {
            Log($"[Handler] echo -> {p.Message}");
            return p.Message;
        });

        _bridgeHost.RegisterHandler<AddParams, int>("add", async (p) =>
        {
            var result = p.A + p.B;
            Log($"[Handler] add({p.A}, {p.B}) -> {result}");
            return result;
        });

        _bridgeHost.RegisterHandler<object>("getSystemInfo", async () =>
        {
            var info = new
            {
                machineName = Environment.MachineName,
                osVersion = Environment.OSVersion.ToString(),
                dotnetVersion = Environment.Version.ToString(),
                processId = Environment.ProcessId
            };
            Log($"[Handler] getSystemInfo -> {info.machineName}");
            return info;
        });

        Log("Handlers registered: ping, echo, add, getSystemInfo");
    }

    private async void OnFrameLoadEnd(object? sender, FrameLoadEndEventArgs e)
    {
        if (!e.Frame.IsMain || _bridgeHost == null) return;

        Log("Frame loaded, initializing bridge...");
        try
        {
            await _bridgeHost.InitializeAsync();

            Dispatcher.Invoke(() =>
            {
                Log("Bridge initialized!");
                StatusIndicator.Fill = new SolidColorBrush(Colors.Green);
                StatusText.Text = "Connected";
                Log($"JS methods: {string.Join(", ", _bridgeHost.SupportedMethods)}");
                Log($"C# methods: {string.Join(", ", _bridgeHost.RegisteredMethods)}");
            });
        }
        catch (Exception ex)
        {
            Log($"Bridge init error: {ex.Message}");
        }
    }

    private async void BtnGreet_Click(object sender, RoutedEventArgs e)
    {
        if (_bridgeHost == null || !_bridgeHost.IsInitialized) { Log("Bridge not initialized"); return; }

        try
        {
            Log("[Call] greet({ name: 'C#' })");
            var result = await _bridgeHost.SendAsync<GreetResult>("greet", new { name = "C#" });
            Log($"[Result] {result?.Message}");
        }
        catch (Exception ex) { Log($"[Error] {ex.Message}"); }
    }

    private async void BtnGetTime_Click(object sender, RoutedEventArgs e)
    {
        if (_bridgeHost == null || !_bridgeHost.IsInitialized) { Log("Bridge not initialized"); return; }

        try
        {
            Log("[Call] getTime()");
            var result = await _bridgeHost.SendAsync<TimeResult>("getTime");
            Log($"[Result] {result?.Time}");
        }
        catch (Exception ex) { Log($"[Error] {ex.Message}"); }
    }

    private async void BtnCalculate_Click(object sender, RoutedEventArgs e)
    {
        if (_bridgeHost == null || !_bridgeHost.IsInitialized) { Log("Bridge not initialized"); return; }

        try
        {
            Log("[Call] calculate({ a: 5, b: 3 })");
            var result = await _bridgeHost.SendAsync<CalcResult>("calculate", new { a = 5, b = 3 });
            Log($"[Result] sum={result?.Sum}, product={result?.Product}");
        }
        catch (Exception ex) { Log($"[Error] {ex.Message}"); }
    }

    private void BtnClearLog_Click(object sender, RoutedEventArgs e) => LogBox.Text = "";

    private void Log(string message)
    {
        var line = $"[{DateTime.Now:HH:mm:ss.fff}] {message}\n";
        if (Dispatcher.CheckAccess()) LogBox.Text += line;
        else Dispatcher.Invoke(() => LogBox.Text += line);
    }

    private void OnClosed(object? sender, EventArgs e) => _bridgeHost?.Dispose();
}

public record EchoParams(string Message);
public record AddParams(int A, int B);
public record GreetResult(string Message);
public record TimeResult(string Time);
public record CalcResult(int Sum, int Product);
