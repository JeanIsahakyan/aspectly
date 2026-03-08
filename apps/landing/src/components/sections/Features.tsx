import { motion } from 'framer-motion'
import {
  Zap,
  Shield,
  Smartphone,
  Globe,
  ArrowLeftRight,
  Timer,
  Radio,
  Bug,
  Layers,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { BlurFade } from '../reactbits'

const features = [
  {
    icon: Shield,
    title: 'Type-Safe',
    description:
      'Full TypeScript support with generics for request/response types. Catch errors at compile time.',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: Zap,
    title: 'Promise-Based',
    description:
      'Modern async/await API for clean, readable code. No callback hell.',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  {
    icon: Smartphone,
    title: 'Universal',
    description:
      'Single API works on iOS, Android, and Web platforms seamlessly.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: ArrowLeftRight,
    title: 'Bidirectional',
    description:
      'Send and receive messages in both directions between native and web.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: Radio,
    title: 'Event-Driven',
    description:
      'Subscribe to all bridge events for monitoring and debugging.',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
  {
    icon: Bug,
    title: 'Error Handling',
    description:
      'Comprehensive error types with detailed error messages for easy debugging.',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  {
    icon: Timer,
    title: 'Timeout Protection',
    description:
      'Configurable request timeouts prevent hanging requests and improve reliability.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    icon: Globe,
    title: 'Platform Detection',
    description:
      'Automatic detection of environment (WebView vs iframe vs browser).',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  {
    icon: Layers,
    title: 'Memory Efficient',
    description:
      'Proper cleanup and garbage collection of listeners and requests.',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 relative">
      <div className="container px-4 mx-auto">
        <BlurFade delay={0.1} inView>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to build robust communication between your
              native app and embedded web content.
            </p>
          </div>
        </BlurFade>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <BlurFade key={feature.title} delay={0.1 + index * 0.05} inView>
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Card className="h-full border-border/50 bg-background/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div
                      className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}
                    >
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  )
}
