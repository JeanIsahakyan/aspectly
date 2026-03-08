import { motion } from 'framer-motion'
import { ArrowRight, Github, Sparkles } from 'lucide-react'
import { ButtonLink } from '../ui/button'
import { Badge } from '../ui/badge'
import { AnimatedGridPattern, BlurFade, Particles } from '../reactbits'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.1}
        duration={3}
        className="absolute inset-0 h-full w-full [mask-image:radial-gradient(500px_circle_at_center,white,transparent)]"
      />
      <Particles
        className="absolute inset-0"
        quantity={50}
        color="#667eea"
        staticity={30}
      />

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-purple-500/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-blue-500/30 rounded-full blur-[120px]" />

      <div className="container relative z-10 px-4 mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          <BlurFade delay={0.1} inView>
            <Badge variant="secondary" className="mb-6 gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Type-safe Communication Bridge</span>
            </Badge>
          </BlurFade>

          <BlurFade delay={0.2} inView>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6">
              Seamless Bridge Between
              <span className="block gradient-text mt-2">
                Native & Web
              </span>
            </h1>
          </BlurFade>

          <BlurFade delay={0.3} inView>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              A powerful, type-safe communication framework for React Native WebViews
              and iframes. Build hybrid apps with confidence using a modern,
              promise-based API.
            </p>
          </BlurFade>

          <BlurFade delay={0.4} inView>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <ButtonLink size="xl" className="group" href="#installation">
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </ButtonLink>
              <ButtonLink
                size="xl"
                variant="outline"
                href="https://github.com/JeanIsahakyan/aspectly"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
                View on GitHub
              </ButtonLink>
            </div>
          </BlurFade>

          <BlurFade delay={0.5} inView>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>TypeScript First</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Zero Dependencies</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <span>MIT License</span>
              </div>
            </div>
          </BlurFade>

          {/* Animated Code Preview */}
          <BlurFade delay={0.6} inView>
            <motion.div
              className="mt-16 relative"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-3xl -z-10" />
              <div className="relative rounded-xl border bg-zinc-900 p-6 text-left shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="ml-4 text-sm text-zinc-400">bridge.ts</span>
                </div>
                <pre className="text-sm font-mono overflow-x-auto">
                  <code>
                    <span className="text-purple-400">const</span>
                    <span className="text-zinc-100"> bridge </span>
                    <span className="text-purple-400">=</span>
                    <span className="text-purple-400"> new</span>
                    <span className="text-yellow-300"> AspectlyBridge</span>
                    <span className="text-zinc-100">()</span>
                    <span className="text-zinc-500">;</span>
                    {'\n\n'}
                    <span className="text-zinc-500">// Initialize with handlers</span>
                    {'\n'}
                    <span className="text-purple-400">await</span>
                    <span className="text-zinc-100"> bridge.</span>
                    <span className="text-blue-400">init</span>
                    <span className="text-zinc-100">(</span>
                    <span className="text-zinc-100">{'{'}</span>
                    {'\n'}
                    <span className="text-zinc-100">  </span>
                    <span className="text-green-400">getUserData</span>
                    <span className="text-zinc-100">:</span>
                    <span className="text-purple-400"> async</span>
                    <span className="text-zinc-100"> () </span>
                    <span className="text-purple-400">=&gt;</span>
                    <span className="text-zinc-100"> {'({'} </span>
                    <span className="text-green-400">name</span>
                    <span className="text-zinc-100">:</span>
                    <span className="text-amber-300"> "John"</span>
                    <span className="text-zinc-100"> {'})'}</span>
                    {'\n'}
                    <span className="text-zinc-100">{'}'}</span>
                    <span className="text-zinc-100">)</span>
                    <span className="text-zinc-500">;</span>
                    {'\n\n'}
                    <span className="text-zinc-500">// Send messages to parent</span>
                    {'\n'}
                    <span className="text-purple-400">const</span>
                    <span className="text-zinc-100"> result </span>
                    <span className="text-purple-400">=</span>
                    <span className="text-purple-400"> await</span>
                    <span className="text-zinc-100"> bridge.</span>
                    <span className="text-blue-400">send</span>
                    <span className="text-zinc-100">(</span>
                    <span className="text-amber-300">"getDeviceInfo"</span>
                    <span className="text-zinc-100">)</span>
                    <span className="text-zinc-500">;</span>
                  </code>
                </pre>
              </div>
            </motion.div>
          </BlurFade>
        </div>
      </div>
    </section>
  )
}
