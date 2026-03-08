using System.IO;
using System.Windows;
using CefSharp;
using CefSharp.Wpf;

namespace Aspectly.Example;

public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        var settings = new CefSettings
        {
            CachePath = Path.Combine(Path.GetTempPath(), "CefSharpCache"),
        };

        // Initialize CefSharp
        Cef.Initialize(settings, performDependencyCheck: true, browserProcessHandler: null);

        base.OnStartup(e);
    }

    protected override void OnExit(ExitEventArgs e)
    {
        Cef.Shutdown();
        base.OnExit(e);
    }
}
