import { useState } from 'react'
import { Smartphone, Globe, Layers, Monitor } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { CodeBlock } from '../ui/code-block'
import { BlurFade } from '../reactbits'

const examples = {
  'react-native': {
    title: 'React Native + WebView',
    icon: Smartphone,
    description: 'Embed web content in your React Native app',
    native: `import { useAspectlyWebView } from '@aspectly/react-native';
import { Platform } from 'react-native';

function App() {
  const [bridge, loaded, WebView] = useAspectlyWebView({
    url: 'https://webapp.example.com'
  });

  useEffect(() => {
    if (loaded) {
      bridge.init({
        getDeviceInfo: async () => ({
          platform: Platform.OS,
          version: Platform.Version
        }),
        showAlert: async ({ message }) => {
          Alert.alert('Message', message);
        }
      });
    }
  }, [loaded]);

  const sendMessage = async () => {
    const result = await bridge.send('processData', {
      items: [1, 2, 3]
    });
    console.log('Result:', result);
  };

  return <WebView style={{ flex: 1 }} />;
}`,
    web: `import { AspectlyBridge } from '@aspectly/core';

const bridge = new AspectlyBridge();

// Initialize with handlers for native app
await bridge.init({
  processData: async ({ items }) => {
    const sum = items.reduce((a, b) => a + b, 0);
    return { sum, count: items.length };
  }
});

// Call native methods
const deviceInfo = await bridge.send('getDeviceInfo');
console.log('Running on:', deviceInfo.platform);

// Show native alert
await bridge.send('showAlert', {
  message: 'Hello from WebView!'
});`,
  },
  'iframe': {
    title: 'Web + Iframe',
    icon: Globe,
    description: 'Embed external widgets in your web app',
    native: `import { useAspectlyIframe } from '@aspectly/web';

function App() {
  const [bridge, loaded, Iframe] = useAspectlyIframe({
    url: 'https://widget.example.com'
  });

  useEffect(() => {
    if (loaded) {
      bridge.init({
        getUserData: async () => ({
          name: 'John Doe',
          id: 123,
          preferences: { theme: 'dark' }
        }),
        saveData: async ({ data }) => {
          await api.save(data);
          return { success: true };
        }
      });
    }
  }, [loaded]);

  return (
    <div className="widget-container">
      <Iframe
        style={{ width: '100%', height: 400 }}
        title="Widget"
      />
    </div>
  );
}`,
    web: `import { AspectlyBridge } from '@aspectly/core';

const bridge = new AspectlyBridge();

// Initialize the widget
await bridge.init({
  greet: async ({ name }) => ({
    message: \`Hello, \${name}! Welcome to our widget.\`
  })
});

// Get user data from parent
const user = await bridge.send('getUserData');
console.log('User:', user.name);

// Save data to parent
const result = await bridge.send('saveData', {
  data: { completed: true, score: 95 }
});`,
  },
  'expo': {
    title: 'Expo / React Native Web',
    icon: Layers,
    description: 'Universal apps that work everywhere',
    native: `import { useAspectlyWebView } from '@aspectly/react-native-web';

// Same code works on iOS, Android, and Web!
function App() {
  const [bridge, loaded, WebView] = useAspectlyWebView({
    url: 'https://webapp.example.com'
  });

  useEffect(() => {
    if (loaded) {
      bridge.init({
        getPlatform: async () => {
          // Works on all platforms
          return {
            isWeb: Platform.OS === 'web',
            isIOS: Platform.OS === 'ios',
            isAndroid: Platform.OS === 'android'
          };
        }
      });
    }
  }, [loaded]);

  return (
    <View style={{ flex: 1 }}>
      <WebView style={{ flex: 1 }} />
    </View>
  );
}`,
    web: `import { AspectlyBridge } from '@aspectly/core';

const bridge = new AspectlyBridge();
await bridge.init();

// Check platform
const platform = await bridge.send('getPlatform');

if (platform.isWeb) {
  console.log('Running in iframe on web');
} else if (platform.isIOS) {
  console.log('Running in WebView on iOS');
} else if (platform.isAndroid) {
  console.log('Running in WebView on Android');
}

// The API is the same regardless of platform!`,
  },
  'dotnet': {
    title: '.NET Desktop (WPF)',
    icon: Monitor,
    description: 'Desktop apps with CefSharp or WebView2',
    native: `using Aspectly.Bridge;
using Aspectly.Bridge.CefSharp;

public partial class MainWindow : Window
{
    private BridgeHost _bridge;

    public MainWindow()
    {
        InitializeComponent();

        // Create bridge with CefSharp browser
        var browserBridge = new CefSharpBrowserBridge(browser);
        _bridge = new BridgeHost(browserBridge);

        // Register handlers for JavaScript calls
        _bridge.RegisterHandler<GetUserParams, UserData>(
            "getUserData",
            async (p) => new UserData {
                Name = "John Doe",
                Id = 123,
                Role = "Admin"
            });

        _bridge.RegisterHandler<AlertParams, bool>(
            "showAlert",
            async (p) => {
                MessageBox.Show(p.Message, "Alert");
                return true;
            });
    }

    private async void OnSendClick(object sender, EventArgs e)
    {
        // Call JavaScript method
        var result = await _bridge.SendAsync<ProcessResult>(
            "processData",
            new { Items = new[] { 1, 2, 3 } }
        );
        Console.WriteLine($"Sum: {result.Sum}");
    }
}`,
    web: `import { AspectlyBridge } from '@aspectly/core';

const bridge = new AspectlyBridge();

// Initialize with handlers for C# app
await bridge.init({
  processData: async ({ items }) => {
    const sum = items.reduce((a, b) => a + b, 0);
    return { sum, count: items.length };
  }
});

// Call C# methods
const user = await bridge.send('getUserData');
console.log('User:', user.name, user.role);

// Show native Windows alert
await bridge.send('showAlert', {
  message: 'Hello from Web UI!'
});`,
  },
}

type ExampleKey = keyof typeof examples

export function Examples() {
  const [activeExample, setActiveExample] = useState<ExampleKey>('react-native')
  const example = examples[activeExample]
  const Icon = example.icon

  return (
    <section id="examples" className="py-24">
      <div className="container px-4 mx-auto">
        <BlurFade delay={0.1} inView>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Real-World Examples
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how Aspectly works in different scenarios. Each example shows
              both the host and embedded code.
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.2} inView>
          <Tabs
            value={activeExample}
            onValueChange={(v) => setActiveExample(v as ExampleKey)}
            className="max-w-6xl mx-auto"
          >
            <div className="flex justify-center mb-8">
              <TabsList className="grid grid-cols-4 w-full max-w-2xl">
                {(Object.entries(examples) as [ExampleKey, typeof example][]).map(
                  ([key, ex]) => {
                    const ExIcon = ex.icon
                    return (
                      <TabsTrigger key={key} value={key} className="gap-2">
                        <ExIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">{ex.title}</span>
                      </TabsTrigger>
                    )
                  }
                )}
              </TabsList>
            </div>

            <TabsContent value={activeExample}>
              <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-3">
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{example.title}</span>
                </div>
                <p className="text-muted-foreground">{example.description}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${activeExample === 'dotnet' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                    Host App {activeExample === 'dotnet' ? '(C#)' : '(Parent)'}
                  </h3>
                  <CodeBlock
                    code={example.native}
                    language={activeExample === 'dotnet' ? 'csharp' : 'typescript'}
                    filename={activeExample === 'dotnet' ? 'MainWindow.xaml.cs' : 'App.tsx'}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    Embedded Content (JavaScript)
                  </h3>
                  <CodeBlock
                    code={example.web}
                    language="typescript"
                    filename="widget.ts"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </BlurFade>
      </div>
    </section>
  )
}
