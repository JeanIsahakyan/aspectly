import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Layers, Network, Smartphone, Globe, Monitor } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { AnimatedBeam, BlurFade } from '../reactbits'
import { cn } from '../../utils/utils'

const layers = [
  {
    name: 'AspectlyBridge',
    description: 'Main entry point, component composition',
    color: 'from-purple-500 to-purple-600',
    details: 'The public interface that developers interact with',
  },
  {
    name: 'BridgeBase',
    description: 'Public API interface',
    color: 'from-blue-500 to-blue-600',
    details: 'Exposes send(), init(), subscribe() methods',
  },
  {
    name: 'BridgeInternal',
    description: 'Business logic & protocol handling',
    color: 'from-cyan-500 to-cyan-600',
    details: 'Manages requests, responses, timeouts, handlers',
  },
  {
    name: 'BridgeCore',
    description: 'Platform detection & message serialization',
    color: 'from-green-500 to-green-600',
    details: 'Handles WebView, iframe, postMessage differences',
  },
]

function Circle({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'z-10 flex h-16 w-16 items-center justify-center rounded-full border-2 bg-white shadow-lg',
        className
      )}
    >
      {children}
    </div>
  )
}

function ArchitectureDiagram() {
  const containerRef = useRef<HTMLDivElement>(null)
  const nativeRef = useRef<HTMLDivElement>(null)
  const bridgeRef = useRef<HTMLDivElement>(null)
  const webRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className="relative flex h-[200px] w-full items-center justify-center overflow-hidden rounded-xl border bg-background/50 backdrop-blur-sm p-10"
    >
      <div className="flex h-full w-full items-center justify-between max-w-xl mx-auto">
        <div ref={nativeRef}>
          <Circle className="border-blue-500">
            <Smartphone className="h-8 w-8 text-blue-500" />
          </Circle>
          <p className="text-center text-sm mt-2 font-medium">Native App</p>
        </div>
        <div ref={bridgeRef}>
          <Circle className="border-purple-500 h-20 w-20">
            <Network className="h-10 w-10 text-purple-500" />
          </Circle>
          <p className="text-center text-sm mt-2 font-medium">Aspectly Bridge</p>
        </div>
        <div ref={webRef}>
          <Circle className="border-green-500">
            <Globe className="h-8 w-8 text-green-500" />
          </Circle>
          <p className="text-center text-sm mt-2 font-medium">Web Content</p>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={nativeRef}
        toRef={bridgeRef}
        curvature={-40}
        gradientStartColor="#3b82f6"
        gradientStopColor="#8b5cf6"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={bridgeRef}
        toRef={nativeRef}
        curvature={40}
        reverse
        gradientStartColor="#8b5cf6"
        gradientStopColor="#3b82f6"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={bridgeRef}
        toRef={webRef}
        curvature={-40}
        gradientStartColor="#8b5cf6"
        gradientStopColor="#22c55e"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={webRef}
        toRef={bridgeRef}
        curvature={40}
        reverse
        gradientStartColor="#22c55e"
        gradientStopColor="#8b5cf6"
      />
    </div>
  )
}

export function Architecture() {
  return (
    <section id="architecture" className="py-24">
      <div className="container px-4 mx-auto">
        <BlurFade delay={0.1} inView>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Architecture
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Aspectly uses a layered architecture designed for extensibility,
              testability, and cross-platform compatibility.
            </p>
          </div>
        </BlurFade>

        <div className="max-w-5xl mx-auto">
          {/* Communication Flow Diagram */}
          <BlurFade delay={0.2} inView>
            <div className="mb-16">
              <h3 className="text-xl font-semibold mb-6 text-center">
                Bidirectional Communication Flow
              </h3>
              <ArchitectureDiagram />
            </div>
          </BlurFade>

          {/* Layer Stack */}
          <BlurFade delay={0.3} inView>
            <h3 className="text-xl font-semibold mb-6 text-center">
              Internal Layer Stack
            </h3>
          </BlurFade>

          <div className="space-y-4 max-w-2xl mx-auto mb-16">
            {layers.map((layer, index) => (
              <BlurFade key={layer.name} delay={0.3 + index * 0.1} inView>
                <motion.div
                  whileHover={{ scale: 1.02, x: 10 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Card className="border-border/50 bg-background/80 backdrop-blur-sm overflow-hidden">
                    <div
                      className={`h-1 bg-gradient-to-r ${layer.color}`}
                    />
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg bg-gradient-to-r ${layer.color} text-white`}
                        >
                          <Layers className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-mono">
                            {layer.name}
                          </CardTitle>
                          <CardDescription>{layer.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">
                        {layer.details}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </BlurFade>
            ))}
          </div>

          {/* Platform Support */}
          <BlurFade delay={0.6} inView>
            <h3 className="text-xl font-semibold mb-6 text-center">
              Platform Support
            </h3>
          </BlurFade>

          <BlurFade delay={0.7} inView>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center border-border/50 bg-background/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    <Smartphone className="h-8 w-8 text-blue-500" />
                  </div>
                  <CardTitle>React Native</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    iOS and Android WebViews with react-native-webview integration
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center border-border/50 bg-background/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                    <Globe className="h-8 w-8 text-green-500" />
                  </div>
                  <CardTitle>Web / Iframe</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Parent-to-iframe communication via postMessage API
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center border-border/50 bg-background/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                    <Monitor className="h-8 w-8 text-purple-500" />
                  </div>
                  <CardTitle>Expo / RN Web</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Universal apps that work on iOS, Android, and Web
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </BlurFade>
        </div>
      </div>
    </section>
  )
}
