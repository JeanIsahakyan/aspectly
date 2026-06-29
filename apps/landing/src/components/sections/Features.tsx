import { motion } from 'framer-motion'
import {
  Shield,
  Zap,
  Smartphone,
  ArrowLeftRight,
  Bug,
  Globe,
} from 'lucide-react'
import { BlurFade } from '../reactbits'

const features = [
  {
    icon: Shield,
    title: 'Type-Safe',
    description:
      'Full TypeScript generics for request and response payloads. Catch contract mismatches at compile time, not in production.',
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: Zap,
    title: 'Promise-Based',
    description:
      'A modern async/await API for clean, readable calls across the bridge. No callback hell.',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
  },
  {
    icon: Smartphone,
    title: 'Universal',
    description:
      'One protocol across Web, React Native, .NET, iOS/macOS/visionOS, Android, Flutter and Python/Linux — the same web content runs on every host.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: ArrowLeftRight,
    title: 'Bidirectional',
    description:
      'Send and receive messages in both directions, so native and web stay in sync.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: Bug,
    title: 'Error Handling',
    description:
      'Comprehensive, typed error categories with descriptive messages for fast debugging.',
    color: 'text-rose-600',
    bgColor: 'bg-rose-500/10',
  },
  {
    icon: Globe,
    title: 'Platform Detection',
    description:
      'Auto-detects the host: CefSharp, WebView2, WKWebView, Android & Flutter WebView, WebKitGTK, React Native, iframe or browser.',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-500/10',
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <BlurFade delay={0.1} inView>
          <div className="mx-auto max-w-2xl text-center mb-14">
            <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-muted-foreground">
              Why Aspectly
            </span>
            <h2 className="mt-5 font-display text-3xl font-semibold sm:text-4xl lg:text-5xl">
              Everything the bridge needs
            </h2>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
              A focused set of primitives for robust, type-safe communication
              between your native app and its embedded web content.
            </p>
          </div>
        </BlurFade>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <BlurFade key={feature.title} delay={(index % 3) * 0.06} inView>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="group h-full rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-lift"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.bgColor}`}
                >
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  )
}
