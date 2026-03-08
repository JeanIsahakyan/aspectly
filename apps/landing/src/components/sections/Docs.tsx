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
    <section id="docs" className="py-24 bg-muted/30">
      <div className="container px-4 mx-auto">
        <BlurFade delay={0.1} inView>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Documentation
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to get started and go deeper.
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.2} inView>
          <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-4">
            {docs.map((doc) => {
              const Icon = doc.icon
              return (
                <a
                  key={doc.title}
                  href={doc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 p-5 rounded-xl border bg-background hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <div className={`p-2.5 rounded-lg shrink-0 ${doc.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1 flex items-center gap-2">
                      {doc.title}
                      <ArrowRight className="h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {doc.description}
                    </p>
                  </div>
                </a>
              )
            })}
          </div>
        </BlurFade>
      </div>
    </section>
  )
}
