import { Github, Heart } from 'lucide-react'
import { BlurFade } from '../reactbits'

const links = {
  docs: [
    { name: 'Getting Started', href: '#installation' },
    { name: 'Examples', href: 'https://github.com/JeanIsahakyan/aspectly/tree/main/examples' },
    { name: 'API Reference', href: 'https://github.com/JeanIsahakyan/aspectly/blob/main/docs/API.md' },
    { name: 'Architecture', href: 'https://github.com/JeanIsahakyan/aspectly/blob/main/docs/ARCHITECTURE.md' },
  ],
  packages: [
    { name: '@aspectly/core', reg: 'npm', href: 'https://www.npmjs.com/package/@aspectly/core' },
    { name: '@aspectly/web', reg: 'npm', href: 'https://www.npmjs.com/package/@aspectly/web' },
    { name: '@aspectly/react-native', reg: 'npm', href: 'https://www.npmjs.com/package/@aspectly/react-native' },
    { name: '@aspectly/transports', reg: 'npm', href: 'https://www.npmjs.com/package/@aspectly/transports' },
    { name: 'Aspectly.Bridge', reg: 'NuGet', href: 'https://www.nuget.org/packages/Aspectly.Bridge' },
    { name: 'AspectlyBridge', reg: 'CocoaPods · SwiftPM', href: 'https://cocoapods.org/pods/AspectlyBridge' },
    { name: 'aspectly-bridge', reg: 'Maven Central', href: 'https://central.sonatype.com/artifact/io.github.jeanisahakyan/aspectly-bridge' },
    { name: 'aspectly_bridge', reg: 'pub.dev', href: 'https://pub.dev/packages/aspectly_bridge' },
    { name: 'aspectly-bridge', reg: 'PyPI', href: 'https://pypi.org/project/aspectly-bridge/' },
  ],
  community: [
    { name: 'GitHub', href: 'https://github.com/JeanIsahakyan/aspectly' },
    { name: 'Issues', href: 'https://github.com/JeanIsahakyan/aspectly/issues' },
    { name: 'Discussions', href: 'https://github.com/JeanIsahakyan/aspectly/discussions' },
    { name: 'Contributing', href: 'https://github.com/JeanIsahakyan/aspectly/blob/main/CONTRIBUTING.md' },
  ],
}

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-16 lg:py-20">
        <BlurFade delay={0.1} inView>
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-12 md:gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-12 lg:col-span-5 lg:pr-10">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-soft">
                  <span className="font-display text-lg font-bold text-primary-foreground">A</span>
                </div>
                <span className="font-display text-xl font-semibold">Aspectly</span>
              </div>
              <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
                A type-safe, promise-based bridge between native and web — one
                protocol across Web, React Native, .NET, iOS · macOS · visionOS,
                Android, Flutter and Python.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <a
                  href="https://github.com/JeanIsahakyan/aspectly"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-soft transition-all hover:text-foreground hover:shadow-lift"
                  aria-label="GitHub"
                >
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Documentation */}
            <div className="col-span-1 md:col-span-4 lg:col-span-2 lg:col-start-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                Documentation
              </h3>
              <ul className="space-y-3">
                {links.docs.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Packages */}
            <div className="col-span-1 md:col-span-4 lg:col-span-3">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                Packages
              </h3>
              <ul className="space-y-3">
                {links.packages.map((link) => (
                  <li key={link.name + link.reg}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/pkg flex items-baseline gap-2 transition-colors"
                    >
                      <span className="font-mono text-sm text-muted-foreground group-hover/pkg:text-foreground">
                        {link.name}
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/45">
                        {link.reg}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Community */}
            <div className="col-span-2 md:col-span-4 lg:col-span-2">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                Community
              </h3>
              <ul className="space-y-3">
                {links.community.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </BlurFade>

        <BlurFade delay={0.2} inView>
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Aspectly. MIT License.
            </p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              Made with <Heart className="h-4 w-4 fill-red-500 text-red-500" /> by{' '}
              <a
                href="https://github.com/JeanIsahakyan"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                Zhan Isaakian
              </a>
            </p>
          </div>
        </BlurFade>
      </div>
    </footer>
  )
}
