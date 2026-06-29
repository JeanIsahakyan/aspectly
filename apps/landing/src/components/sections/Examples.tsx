import { useState } from 'react'
import { CodeBlock } from '../ui/code-block'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { BlurFade } from '../reactbits'

const widgetCode = `import { AspectlyBridge } from '@aspectly/core';

const bridge = new AspectlyBridge();

await bridge.init({
  greet: async ({ name }) => ({
    message: \`Hello, \${name}!\`
  })
});

// Call the host app
const user = await bridge.send('getUserData');
console.log(user.name); // "John Doe"`

const hosts: Record<
  string,
  { label: string; filename: string; language: string; code: string }
> = {
  web: {
    label: 'Web (iframe)',
    filename: 'App.tsx',
    language: 'typescript',
    code: `import { useAspectlyIframe } from '@aspectly/web';

function App() {
  const [bridge, loaded, Iframe] = useAspectlyIframe({
    url: 'https://widget.example.com'
  });

  useEffect(() => {
    if (loaded) {
      bridge.init({
        getUserData: async () => ({ name: 'John Doe', role: 'Admin' })
      });
    }
  }, [loaded]);

  return <Iframe style={{ width: '100%', height: 400 }} />;
}`,
  },
  reactNative: {
    label: 'React Native',
    filename: 'App.tsx',
    language: 'typescript',
    code: `import { useAspectlyWebView } from '@aspectly/react-native';

function App() {
  const [bridge, loaded, WebView] = useAspectlyWebView({
    url: 'https://widget.example.com'
  });

  useEffect(() => {
    if (loaded) {
      bridge.init({
        getUserData: async () => ({ name: 'John Doe', role: 'Admin' })
      });
    }
  }, [loaded]);

  return <WebView style={{ flex: 1 }} />;
}`,
  },
  swift: {
    label: 'iOS / macOS',
    filename: 'ContentView.swift',
    language: 'swift',
    code: `import SwiftUI
import AspectlyBridge
import AspectlyBridgeWebKit

struct ContentView: View {
  @StateObject private var model = AspectlyWebViewModel(
    url: URL(string: "https://widget.example.com")!
  )

  var body: some View {
    AspectlyWebView(model: model)
      .onChange(of: model.isLoaded) { loaded in
        guard loaded else { return }
        Task {
          model.bridge.registerHandler("getUserData") { _ in
            UserData(name: "John Doe", role: "Admin")
          }
          try await model.bridge.initialize()
        }
      }
  }
}`,
  },
  android: {
    label: 'Android',
    filename: 'MainActivity.kt',
    language: 'kotlin',
    code: `import com.aspectly.bridge.BridgeHost
import com.aspectly.bridge.webview.AndroidWebViewBrowserBridge

val bridge = BridgeHost(AndroidWebViewBrowserBridge(webView))
bridge.registerHandler("getUserData") { _ ->
  UserData(name = "John Doe", role = "Admin")
}

webView.webViewClient = object : WebViewClient() {
  override fun onPageFinished(view: WebView?, url: String?) {
    lifecycleScope.launch { bridge.initialize() }
  }
}
webView.loadUrl("https://widget.example.com")`,
  },
  flutter: {
    label: 'Flutter',
    filename: 'main.dart',
    language: 'dart',
    code: `import 'package:aspectly_bridge/aspectly_bridge.dart';

// browserBridge wraps a webview_flutter WebViewController
final bridge = BridgeHost(browserBridge);

bridge.registerHandler('getUserData', (params) => {
  'name': 'John Doe',
  'role': 'Admin',
});

// In NavigationDelegate.onPageFinished:
await bridge.initialize();`,
  },
  webkitgtk: {
    label: 'Linux (Python)',
    filename: 'main.py',
    language: 'python',
    code: `from aspectly_bridge import BridgeHost
from aspectly_bridge.webkitgtk import WebKitGTKBrowserBridge

bridge = BridgeHost(WebKitGTKBrowserBridge(web_view))

bridge.register_handler(
    "getUserData",
    lambda params: {"name": "John Doe", "role": "Admin"},
)

# On WebKit2.LoadEvent.FINISHED:
bridge.initialize()`,
  },
  dotnet: {
    label: '.NET',
    filename: 'MainWindow.cs',
    language: 'csharp',
    code: `using Aspectly.Bridge;
using Aspectly.Bridge.CefSharp;

var bridge = new BridgeHost(new CefSharpBrowserBridge(browser));

bridge.RegisterHandler<object, object>("getUserData", async _ =>
    new { name = "John Doe", role = "Admin" });

await bridge.InitializeAsync();`,
  },
}

export function Examples() {
  const [host, setHost] = useState('web')
  const current = hosts[host]

  return (
    <section id="examples" className="py-16 lg:py-20">
      <div className="container px-4 mx-auto">
        <BlurFade delay={0.1} inView>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Simple to Use
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              One widget, every host. Define handlers on each side and call them
              from the other — the same web code runs everywhere.
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.15} inView>
          <div className="flex justify-center mb-8">
            <Tabs value={host} onValueChange={setHost}>
              <TabsList>
                {Object.entries(hosts).map(([key, value]) => (
                  <TabsTrigger key={key} value={key}>
                    {value.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </BlurFade>

        <BlurFade delay={0.2} inView>
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-5">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                Host App — {current.label}
              </h3>
              <CodeBlock
                code={current.code}
                language={current.language}
                filename={current.filename}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                Widget (@aspectly/core)
              </h3>
              <CodeBlock
                code={widgetCode}
                language="typescript"
                filename="widget.ts"
              />
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  )
}
