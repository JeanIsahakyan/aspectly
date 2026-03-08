import { useState } from 'react'
import { ChevronDown, ChevronRight, Code2, FileCode } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { CodeBlock } from '../ui/code-block'
import { BlurFade } from '../reactbits'
import { cn } from '../../utils/utils'

interface ApiMethod {
  name: string
  signature: string
  description: string
  params?: { name: string; type: string; description: string }[]
  returns?: string
  example: string
}

const apiMethods: ApiMethod[] = [
  {
    name: 'init',
    signature: 'init(handlers?: BridgeHandlers): Promise<void>',
    description:
      'Initialize the bridge with optional method handlers. Must be called before sending messages.',
    params: [
      {
        name: 'handlers',
        type: 'BridgeHandlers',
        description: 'Object containing handler functions for incoming requests',
      },
    ],
    returns: 'Promise<void>',
    example: `await bridge.init({
  getUserData: async () => ({ name: 'John' }),
  saveData: async ({ data }) => {
    await api.save(data);
    return { success: true };
  }
});`,
  },
  {
    name: 'send',
    signature: 'send<T>(method: string, params?: object): Promise<T>',
    description:
      'Send a request to the other side of the bridge and await the response.',
    params: [
      {
        name: 'method',
        type: 'string',
        description: 'The name of the method to invoke',
      },
      {
        name: 'params',
        type: 'object',
        description: 'Optional parameters to pass to the method',
      },
    ],
    returns: 'Promise<T> - The response from the handler',
    example: `const user = await bridge.send<User>('getUserData');
const result = await bridge.send('processItems', { items: [1, 2, 3] });`,
  },
  {
    name: 'subscribe',
    signature: 'subscribe(callback: (event: BridgeEvent) => void): string',
    description:
      'Subscribe to all bridge events for monitoring and debugging.',
    params: [
      {
        name: 'callback',
        type: '(event: BridgeEvent) => void',
        description: 'Function called for each bridge event',
      },
    ],
    returns: 'string - Subscription ID for unsubscribing',
    example: `const subscriptionId = bridge.subscribe((event) => {
  console.log('Event type:', event.type);
  console.log('Event data:', event.data);
});`,
  },
  {
    name: 'unsubscribe',
    signature: 'unsubscribe(id: string): void',
    description: 'Remove an event subscription.',
    params: [
      {
        name: 'id',
        type: 'string',
        description: 'The subscription ID returned by subscribe()',
      },
    ],
    example: `bridge.unsubscribe(subscriptionId);`,
  },
  {
    name: 'supports',
    signature: 'supports(method: string): boolean',
    description:
      'Check if a specific method is supported by the other side of the bridge.',
    params: [
      {
        name: 'method',
        type: 'string',
        description: 'The method name to check',
      },
    ],
    returns: 'boolean',
    example: `if (bridge.supports('getDeviceInfo')) {
  const info = await bridge.send('getDeviceInfo');
}`,
  },
  {
    name: 'isAvailable',
    signature: 'isAvailable(): boolean',
    description:
      'Check if the bridge is available and initialized on both sides.',
    returns: 'boolean',
    example: `if (bridge.isAvailable()) {
  // Bridge is ready
}`,
  },
  {
    name: 'destroy',
    signature: 'destroy(): void',
    description:
      'Clean up all event listeners and pending requests. Call when unmounting.',
    example: `useEffect(() => {
  return () => {
    bridge.destroy();
  };
}, []);`,
  },
]

const errorTypes = [
  {
    name: 'UNSUPPORTED_METHOD',
    description: 'The requested method is not registered on the other side',
  },
  {
    name: 'METHOD_EXECUTION_TIMEOUT',
    description: 'The handler took too long to respond (default: 100s)',
  },
  {
    name: 'REJECTED',
    description: 'The handler threw an error during execution',
  },
  {
    name: 'BRIDGE_NOT_AVAILABLE',
    description: 'The bridge is not initialized or not available',
  },
]

function MethodCard({ method }: { method: ApiMethod }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card className="border-border/50 bg-background/80 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Code2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-mono">{method.name}()</CardTitle>
            </div>
            {isOpen ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <CardDescription className="text-sm mt-2">
            {method.description}
          </CardDescription>
        </CardHeader>
      </button>

      <div
        className={cn(
          'transition-all duration-300 overflow-hidden',
          isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <CardContent className="pt-0 space-y-4">
          <div className="bg-muted/50 rounded-lg p-3 font-mono text-sm">
            {method.signature}
          </div>

          {method.params && method.params.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Parameters</h4>
              <div className="space-y-2">
                {method.params.map((param) => (
                  <div
                    key={param.name}
                    className="flex items-start gap-3 text-sm"
                  >
                    <Badge variant="secondary" className="font-mono">
                      {param.name}
                    </Badge>
                    <span className="text-muted-foreground font-mono">
                      {param.type}
                    </span>
                    <span className="text-muted-foreground">
                      - {param.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {method.returns && (
            <div>
              <h4 className="font-semibold mb-2">Returns</h4>
              <p className="text-sm text-muted-foreground font-mono">
                {method.returns}
              </p>
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-2">Example</h4>
            <CodeBlock code={method.example} showLineNumbers={false} />
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

export function ApiDocs() {
  return (
    <section id="api" className="py-24 bg-muted/30">
      <div className="container px-4 mx-auto">
        <BlurFade delay={0.1} inView>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              API Reference
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Complete API documentation for AspectlyBridge. Click on any method
              to see detailed documentation and examples.
            </p>
          </div>
        </BlurFade>

        <div className="max-w-4xl mx-auto">
          <BlurFade delay={0.2} inView>
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <FileCode className="h-5 w-5 text-primary" />
              Methods
            </h3>
          </BlurFade>

          <div className="space-y-4 mb-12">
            {apiMethods.map((method, index) => (
              <BlurFade key={method.name} delay={0.1 + index * 0.03} inView>
                <MethodCard method={method} />
              </BlurFade>
            ))}
          </div>

          <BlurFade delay={0.4} inView>
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <FileCode className="h-5 w-5 text-destructive" />
              Error Types
            </h3>
          </BlurFade>

          <BlurFade delay={0.5} inView>
            <Card className="border-border/50 bg-background/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {errorTypes.map((error) => (
                    <div
                      key={error.name}
                      className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                    >
                      <Badge
                        variant="destructive"
                        className="font-mono shrink-0"
                      >
                        {error.name}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {error.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Error Handling Example</h4>
                  <CodeBlock
                    code={`import { BridgeErrorType } from '@aspectly/core';

try {
  const result = await bridge.send('someMethod', params);
} catch (error) {
  switch (error.error_type) {
    case BridgeErrorType.UNSUPPORTED_METHOD:
      console.log('Method not registered');
      break;
    case BridgeErrorType.METHOD_EXECUTION_TIMEOUT:
      console.log('Handler timed out');
      break;
    case BridgeErrorType.REJECTED:
      console.log('Handler error:', error.error_message);
      break;
  }
}`}
                    showLineNumbers={false}
                  />
                </div>
              </CardContent>
            </Card>
          </BlurFade>
        </div>
      </div>
    </section>
  )
}
