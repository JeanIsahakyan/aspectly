import { BlurFade } from '../reactbits'

const releases = [
  {
    version: '2.0.14',
    date: '2026-03-16',
    changes: [
      { type: 'fix', text: 'C# dockable pane init protocol fix' },
      { type: 'feat', text: 'Handler execution timeout (C#)' },
      { type: 'feat', text: 'registerHandler() / unregisterHandler() (JS)' },
      { type: 'feat', text: 'InitializeAsync(handlers) overload (C#)' },
      { type: 'fix', text: 'init() resolves only when both Init and InitResult received' },
      { type: 'fix', text: 'C# error format compatibility in JS' },
      { type: 'ci', text: 'OIDC trusted publishing for npm' },
    ],
  },
  {
    version: '2.0.7',
    date: '2026-03-11',
    changes: [
      { type: 'feat', text: 'Thread-safe dispatcher for CefSharpBrowserBridge' },
      { type: 'feat', text: 'Auto-send InitResult on receiving Init' },
    ],
  },
  {
    version: '2.0.0',
    date: '2026-03-07',
    changes: [
      { type: 'feat', text: 'Complete protocol rewrite with Init/InitResult handshake' },
      { type: 'feat', text: 'Pluggable transport layer (CefSharp, React Native, iframe, window)' },
      { type: 'feat', text: '.NET packages: Aspectly.Bridge, CefSharp, WebView2' },
      { type: 'feat', text: 'React hooks: @aspectly/react-native, @aspectly/web' },
      { type: 'feat', text: 'Landing page with live demo, CI/CD pipeline' },
    ],
  },
  {
    version: '1.0.0',
    date: '2025-12-04',
    changes: [
      { type: 'feat', text: 'Rename from Aspect to Aspectly' },
      { type: 'feat', text: 'Monorepo with pnpm workspaces, vitest, CI/CD' },
    ],
  },
  {
    version: '0.1.x',
    date: '2022-11-19 — 2023-03-10',
    changes: [
      { type: 'feat', text: 'Initial release as @jeanisahakyan/chirp' },
      { type: 'feat', text: 'React Native WebView bridge with platform detection' },
      { type: 'fix', text: 'ReactNativeWebView.postMessage cross-platform support' },
      { type: 'feat', text: 'Browser UMD bundle, RNW detection, window init fixes' },
      { type: 'feat', text: 'Renamed: Chirp -> Aspect -> Aspectly' },
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
