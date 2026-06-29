import { motion } from 'framer-motion'
import { ArrowRight, Github } from 'lucide-react'
import { ButtonLink } from '../ui/button'
import { BrandIcon } from '../ui/brand-icon'

const platforms = ['Web', 'React Native', '.NET', 'iOS / macOS / visionOS', 'Android', 'Flutter', 'Python / Linux']

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
})

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-16 lg:pt-44 lg:pb-20">
      <div className="aurora animate-aurora" />
      <div className="pointer-events-none absolute inset-0 grid-lines" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div {...fade(0)}
            className="ring-grad inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Type-safe communication bridge
            <span className="text-foreground/30">·</span>
            <span className="font-mono text-foreground/70">v{__ASPECTLY_VERSION__}</span>
          </motion.div>

          <motion.h1 {...fade(0.06)}
            className="mt-7 text-balance text-[2.75rem] font-semibold leading-[1.02] sm:text-6xl lg:text-[4.5rem]">
            One bridge between
            <span className="mt-1 block">
              <span className="gradient-text">native&nbsp;&amp;&nbsp;web</span>.
            </span>
          </motion.h1>

          <motion.p {...fade(0.13)}
            className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            A type-safe, promise-based protocol for talking to embedded web content.
            Write it once — the same bridge runs across every host.
          </motion.p>

          <motion.div {...fade(0.19)}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink size="xl" href="#installation" className="group animate-pulse-glow">
              Get started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </ButtonLink>
            <ButtonLink size="xl" variant="outline" href="https://github.com/JeanIsahakyan/aspectly"
              target="_blank" rel="noopener noreferrer" className="glass">
              <Github className="h-4 w-4" />
              View on GitHub
            </ButtonLink>
          </motion.div>

          <motion.div {...fade(0.28)} className="mt-9 flex flex-wrap items-center justify-center gap-2">
            {platforms.map((p) => (
              <span key={p}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground">
                <BrandIcon name={p} className="h-3.5 w-3.5 opacity-75" />
                {p}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
