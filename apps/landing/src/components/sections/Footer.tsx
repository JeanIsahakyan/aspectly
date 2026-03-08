import { Github, Heart } from 'lucide-react'
import { BlurFade } from '../reactbits'

const links = {
  docs: [
    { name: 'Getting Started', href: '#installation' },
    { name: 'Examples', href: '#examples' },
    { name: 'API Reference', href: '#api' },
    { name: 'Architecture', href: '#architecture' },
  ],
  packages: [
    { name: '@aspectly/core', href: 'https://www.npmjs.com/package/@aspectly/core' },
    { name: '@aspectly/web', href: 'https://www.npmjs.com/package/@aspectly/web' },
    { name: '@aspectly/react-native', href: 'https://www.npmjs.com/package/@aspectly/react-native' },
    { name: '@aspectly/react-native-web', href: 'https://www.npmjs.com/package/@aspectly/react-native-web' },
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
    <footer className="border-t bg-muted/30">
      <div className="container px-4 mx-auto py-16">
        <BlurFade delay={0.1} inView>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className="text-xl font-bold">Aspectly</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                A powerful, type-safe communication bridge framework for React
                Native and web applications.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/JeanIsahakyan/aspectly"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Documentation */}
            <div>
              <h3 className="font-semibold mb-4">Documentation</h3>
              <ul className="space-y-3">
                {links.docs.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Packages */}
            <div>
              <h3 className="font-semibold mb-4">Packages</h3>
              <ul className="space-y-3">
                {links.packages.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Community */}
            <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <ul className="space-y-3">
                {links.community.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
          <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Aspectly. MIT License.
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Made with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> by{' '}
              <a
                href="https://github.com/JeanIsahakyan"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-foreground transition-colors"
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
