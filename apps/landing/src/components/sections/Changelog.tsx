import { BlurFade } from '../reactbits'

const releases = [
  {
    version: '2.0.14',
    date: '03/16/2026',
    changes: [
      { type: 'fix', date: '03/16/2026', text: 'C# dockable pane init protocol fix' },
      { type: 'fix', date: '03/16/2026', text: 'handleInit sets initResultReceived for implicit confirmation' },
      { type: 'fix', date: '03/16/2026', text: 'C# error format compatibility in JS (data + result.error)' },
      { type: 'fix', date: '03/16/2026', text: 'init() resolves only when both Init and InitResult received' },
      { type: 'feat', date: '03/16/2026', text: 'registerHandler() / unregisterHandler() (JS)' },
      { type: 'feat', date: '03/16/2026', text: 'InitializeAsync(handlers) overload (C#)' },
      { type: 'feat', date: '03/16/2026', text: 'Handler execution timeout in C# (default 100s)' },
      { type: 'feat', date: '03/16/2026', text: 'Configurable timeoutMs in BridgeHost constructor' },
      { type: 'fix', date: '03/16/2026', text: 'HandleInitAsync only sends InitResult, matching JS protocol' },
      { type: 'fix', date: '03/16/2026', text: 'InitializeAsync awaits InitResult (was fire-and-forget)' },
      { type: 'ci', date: '03/16/2026', text: 'OIDC trusted publishing for npm (no more NPM_TOKEN)' },
      { type: 'ci', date: '03/16/2026', text: 'pnpm publish to resolve workspace:* protocol' },
    ],
  },
  {
    version: '2.0.7',
    date: '03/11/2026',
    changes: [
      { type: 'feat', date: '03/11/2026', text: 'Thread-safe WPF dispatcher in CefSharpBrowserBridge' },
      { type: 'feat', date: '03/11/2026', text: 'Auto-send InitResult on receiving Init from JS' },
    ],
  },
  {
    version: '2.0.6',
    date: '03/09/2026',
    changes: [
      { type: 'fix', date: '03/09/2026', text: 'Allow landing deploy from workflow_dispatch trigger' },
    ],
  },
  {
    version: '2.0.5',
    date: '03/08/2026',
    changes: [
      { type: 'fix', date: '03/08/2026', text: 'Remove leaked .npmrc with npm token' },
      { type: 'fix', date: '03/08/2026', text: 'Remove yarn configuration remnants' },
    ],
  },
  {
    version: '2.0.3',
    date: '03/08/2026',
    changes: [
      { type: 'feat', date: '03/08/2026', text: 'Publish .NET packages to NuGet on release' },
      { type: 'fix', date: '03/08/2026', text: 'Widget/popup routing for GitHub Pages' },
    ],
  },
  {
    version: '2.0.0',
    date: '03/07/2026',
    changes: [
      { type: 'feat', date: '03/07/2026', text: 'Complete protocol rewrite with Init/InitResult handshake' },
      { type: 'feat', date: '03/07/2026', text: 'Pluggable transport layer (CefSharp, React Native, iframe, window)' },
      { type: 'feat', date: '03/07/2026', text: '.NET: Aspectly.Bridge, Aspectly.Bridge.CefSharp, Aspectly.Bridge.WebView2' },
      { type: 'feat', date: '03/07/2026', text: 'React hooks: @aspectly/react-native, @aspectly/web' },
      { type: 'feat', date: '03/07/2026', text: 'Landing page with live demo, CI/CD pipeline' },
    ],
  },
  {
    version: '1.0.0',
    date: '12/04/2025',
    changes: [
      { type: 'feat', date: '12/04/2025', text: 'Renamed from Aspect to Aspectly' },
      { type: 'feat', date: '12/04/2025', text: 'Monorepo with pnpm workspaces, vitest, CI/CD' },
    ],
  },
  {
    version: '0.1.11',
    date: '03/10/2023',
    changes: [
      { type: 'fix', date: '03/10/2023', text: 'Prevent unnecessary window init events' },
      { type: 'fix', date: '03/10/2023', text: 'React Native Web detection fix' },
      { type: 'fix', date: '03/10/2023', text: 'Browser version fixes' },
    ],
  },
  {
    version: '0.1.8',
    date: '11/20/2022',
    changes: [
      { type: 'fix', date: '11/20/2022', text: 'Support ReactNativeWebView.postMessage for all platforms' },
      { type: 'fix', date: '11/20/2022', text: 'Core error fixes' },
      { type: 'feat', date: '11/20/2022', text: 'Browser UMD bundle support' },
    ],
  },
  {
    version: '0.1.1',
    date: '11/19/2022',
    changes: [
      { type: 'feat', date: '11/19/2022', text: 'Initial release as @jeanisahakyan/chirp' },
      { type: 'feat', date: '11/19/2022', text: 'React Native WebView bridge with platform detection' },
      { type: 'feat', date: '11/19/2022', text: 'Bidirectional message passing with JSON serialization' },
    ],
  },
]

const typeColors: Record<string, string> = {
  feat: 'bg-green-500/10 text-green-600 dark:text-green-400',
  fix: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  ci: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
}

const typeLabels: Record<string, string> = {
  feat: 'new',
  fix: 'fix',
  ci: 'ci',
}

export function Changelog() {
  return (
    <section id="changelog" className="py-24">
      <div className="container px-4 mx-auto">
        <BlurFade delay={0.1} inView>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Changelog</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Recent releases and what changed.
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.2} inView>
          <div className="max-w-2xl mx-auto space-y-8">
            {releases.map((release) => (
              <div key={release.version} className="relative pl-6 border-l-2 border-border">
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary" />
                <div className="flex items-baseline gap-3 mb-3">
                  <h3 className="text-xl font-bold">v{release.version}</h3>
                  <span className="text-sm text-muted-foreground">{release.date}</span>
                </div>
                <ul className="space-y-2">
                  {release.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-xs text-muted-foreground/50 font-mono shrink-0 mt-0.5 w-20">{change.date}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-medium shrink-0 mt-0.5 ${typeColors[change.type] || ''}`}
                      >
                        {typeLabels[change.type] || change.type}
                      </span>
                      <span className="text-muted-foreground">{change.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </BlurFade>

        <BlurFade delay={0.3} inView>
          <div className="text-center mt-8">
            <a
              href="https://github.com/JeanIsahakyan/aspectly/blob/main/CHANGELOG.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              View full changelog on GitHub
            </a>
          </div>
        </BlurFade>
      </div>
    </section>
  )
}
