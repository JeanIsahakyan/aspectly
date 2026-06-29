import { BookOpen, FileCode, Layers, ArrowRight, RefreshCw } from 'lucide-react'
import { BlurFade } from '../reactbits'

const docs = [
  {
    title: 'API Reference',
    description: 'Complete reference for all methods, hooks, and types across every package.',
    icon: FileCode,
    href: 'https://github.com/JeanIsahakyan/aspectly/blob/main/docs/API.md',
    color: 'text-blue-500 bg-blue-500/10',
  },
  {
    title: 'Examples',
    description: 'Real-world code examples: React Native, iframes, Expo, .NET, and more.',
    icon: BookOpen,
    href: 'https://github.com/JeanIsahakyan/aspectly/blob/main/docs/EXAMPLES.md',
    color: 'text-green-500 bg-green-500/10',
  },
  {
    title: 'Architecture',
    description: 'Layered architecture, message flow diagrams, and platform detection.',
    icon: Layers,
    href: 'https://github.com/JeanIsahakyan/aspectly/blob/main/docs/ARCHITECTURE.md',
    color: 'text-purple-500 bg-purple-500/10',
  },
  {
    title: 'Migration Guide',
    description: 'Step-by-step guide for upgrading from the legacy package.',
    icon: RefreshCw,
    href: 'https://github.com/JeanIsahakyan/aspectly/blob/main/docs/MIGRATION.md',
    color: 'text-orange-500 bg-orange-500/10',
  },
]

export function Docs() {
  return (
    <section id="docs" className="relative py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <BlurFade delay={0.1} inView>
          <div className="mx-auto max-w-2xl text-center mb-14">
            <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-muted-foreground">
              Documentation
            </span>
            <h2 className="mt-5 font-display text-3xl font-semibold sm:text-4xl lg:text-5xl">
              Everything you need to go deeper
            </h2>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
              Reference, examples, and guides to take you from first call to production.
            </p>
          </div>
        </BlurFade>

        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
          {docs.map((doc, i) => {
            const Icon = doc.icon
            return (
              <BlurFade key={doc.title} delay={0.15 + i * 0.08} inView>
                <a
                  href={doc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-lift"
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${doc.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                      {doc.title}
                      <ArrowRight className="h-4 w-4 -translate-x-1 text-primary opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </h3>
                    <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
                      {doc.description}
                    </p>
                  </div>
                </a>
              </BlurFade>
            )
          })}
        </div>
      </div>
    </section>
  )
}
