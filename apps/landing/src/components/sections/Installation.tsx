import { useState } from 'react'
import { Check, Copy, Package } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { BlurFade } from '../reactbits'

const jsPackages = [
  {
    name: '@aspectly/core',
    description: 'Core bridge for embedded web content',
    install: 'npm install @aspectly/core',
    useCase: 'For web apps running inside WebView or iframe',
  },
  {
    name: '@aspectly/web',
    description: 'React hooks for iframe embedding',
    install: 'npm install @aspectly/web',
    useCase: 'For parent pages embedding iframes',
  },
  {
    name: '@aspectly/react-native',
    description: 'React Native WebView integration',
    install: 'npm install @aspectly/react-native',
    useCase: 'For React Native apps with WebViews',
  },
  {
    name: '@aspectly/react-native-web',
    description: 'Universal React Native Web support',
    install: 'npm install @aspectly/react-native-web',
    useCase: 'For Expo/React Native Web apps',
  },
]

const dotnetPackages = [
  {
    name: 'Aspectly.Bridge',
    description: 'Core bridge library for .NET applications',
    install: 'dotnet add package Aspectly.Bridge',
    useCase: 'Base package - required by CefSharp and WebView2 integrations',
  },
  {
    name: 'Aspectly.Bridge.CefSharp',
    description: 'CefSharp (Chromium) integration for WPF/WinForms',
    install: 'dotnet add package Aspectly.Bridge.CefSharp',
    useCase: 'For desktop apps using CefSharp browser control',
  },
  {
    name: 'Aspectly.Bridge.WebView2',
    description: 'Microsoft Edge WebView2 integration',
    install: 'dotnet add package Aspectly.Bridge.WebView2',
    useCase: 'For desktop apps using WebView2 (Edge)',
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Copy command"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  )
}

export function Installation() {
  const [platform, setPlatform] = useState('javascript')
  const [packageManager, setPackageManager] = useState('npm')

  const getJsCommand = (pkg: string) => {
    switch (packageManager) {
      case 'yarn':
        return `yarn add ${pkg.replace('npm install ', '')}`
      case 'pnpm':
        return `pnpm add ${pkg.replace('npm install ', '')}`
      case 'bun':
        return `bun add ${pkg.replace('npm install ', '')}`
      default:
        return pkg
    }
  }

  const packages = platform === 'javascript' ? jsPackages : dotnetPackages
  const getCommand = platform === 'javascript' ? getJsCommand : (pkg: string) => pkg

  return (
    <section id="installation" className="py-24 bg-muted/30">
      <div className="container px-4 mx-auto">
        <BlurFade delay={0.1} inView>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Quick Installation
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the package that fits your use case. All packages are
              lightweight and have minimal dependencies.
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.2} inView>
          <div className="max-w-4xl mx-auto">
            {/* Platform Selector */}
            <div className="flex justify-center mb-6">
              <Tabs value={platform} onValueChange={setPlatform}>
                <TabsList>
                  <TabsTrigger value="javascript" className="gap-2">
                    <span className="text-yellow-500">JS</span> JavaScript / TypeScript
                  </TabsTrigger>
                  <TabsTrigger value="dotnet" className="gap-2">
                    <span className="text-purple-500">C#</span> .NET
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Package Manager Selector (JS only) */}
            {platform === 'javascript' && (
              <div className="flex justify-center mb-8">
                <Tabs value={packageManager} onValueChange={setPackageManager}>
                  <TabsList>
                    <TabsTrigger value="npm">npm</TabsTrigger>
                    <TabsTrigger value="yarn">yarn</TabsTrigger>
                    <TabsTrigger value="pnpm">pnpm</TabsTrigger>
                    <TabsTrigger value="bun">bun</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}

            {/* .NET info */}
            {platform === 'dotnet' && (
              <div className="flex justify-center mb-8">
                <div className="text-sm text-muted-foreground">
                  Using .NET CLI or NuGet Package Manager
                </div>
              </div>
            )}

            {/* Packages List */}
            <div className="grid gap-4">
              {packages.map((pkg, index) => (
                <BlurFade key={pkg.name} delay={0.1 + index * 0.05} inView>
                  <Card className="border-border/50 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${platform === 'dotnet' ? 'bg-purple-500/10' : 'bg-primary/10'}`}>
                            <Package className={`h-5 w-5 ${platform === 'dotnet' ? 'text-purple-500' : 'text-primary'}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-mono">
                              {pkg.name}
                            </CardTitle>
                            <CardDescription>{pkg.description}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-zinc-900 rounded-lg px-4 py-3 font-mono text-sm text-zinc-300 overflow-x-auto">
                          {getCommand(pkg.install)}
                        </div>
                        <CopyButton text={getCommand(pkg.install)} />
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {pkg.useCase}
                      </p>
                    </CardContent>
                  </Card>
                </BlurFade>
              ))}
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  )
}
