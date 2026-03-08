import { useState, useEffect, useCallback } from 'react'
import { Play, ArrowRight, ArrowLeft, Zap } from 'lucide-react'
import { useAspectlyIframe } from '@aspectly/web'
import { BlurFade } from '../reactbits'

interface LogEntry {
  time: string
  message: string
  direction: 'in' | 'out'
}

export function LiveDemo() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [darkTheme, setDarkTheme] = useState(false)
  const [ready, setReady] = useState(false)

  const [bridge, loaded, Iframe] = useAspectlyIframe({
    url: '/widget'
  })

  const addLog = useCallback((message: string, direction: 'in' | 'out') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false })
    setLogs(prev => [{ time, message, direction }, ...prev].slice(0, 20))
  }, [])

  useEffect(() => {
    if (!loaded) return
    let stale = false
    bridge.init({
      getTime: async () => {
        addLog('getTime()', 'in')
        return { time: new Date().toISOString() }
      },
      getUserInfo: async () => {
        addLog('getUserInfo()', 'in')
        return { name: 'Demo User', role: 'Developer', id: 42 }
      }
    }).then(() => {
      if (stale) return
      setReady(true)
      addLog('Bridge connected!', 'in')
    })
    return () => { stale = true }
  }, [loaded, bridge, addLog])

  const handleGreet = async () => {
    try {
      addLog('greet({ name: "Landing" })', 'out')
      const result = await bridge.send<{ message: string }>('greet', { name: 'Landing' })
      addLog(`Response: ${result.message}`, 'in')
    } catch (e: unknown) {
      const err = e as Record<string, string>
      addLog(`Error: ${err.message || err.error_message}`, 'in')
    }
  }

  const handleCalculate = async () => {
    try {
      const a = Math.floor(Math.random() * 10) + 1
      const b = Math.floor(Math.random() * 10) + 1
      addLog(`calculate({ a: ${a}, b: ${b} })`, 'out')
      const result = await bridge.send<{ sum: number; product: number }>('calculate', { a, b })
      addLog(`sum=${result.sum}, product=${result.product}`, 'in')
    } catch (e: unknown) {
      const err = e as Record<string, string>
      addLog(`Error: ${err.message || err.error_message}`, 'in')
    }
  }

  const handleToggleTheme = async () => {
    try {
      const newTheme = !darkTheme
      setDarkTheme(newTheme)
      addLog(`setTheme({ dark: ${newTheme} })`, 'out')
      await bridge.send('setTheme', { dark: newTheme })
      addLog('Theme applied', 'in')
    } catch (e: unknown) {
      const err = e as Record<string, string>
      addLog(`Error: ${err.message || err.error_message}`, 'in')
    }
  }

  return (
    <section id="demo" className="py-24 bg-muted/30">
      <div className="container px-4 mx-auto">
        <BlurFade delay={0.1} inView>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Play className="h-4 w-4" />
              <span className="font-medium">Live Demo</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Try It Yourself
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              This is a real iframe communicating with the parent page using Aspectly.
              Click the buttons to see bidirectional messaging in action.
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.2} inView>
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Parent Side */}
              <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/50 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-sm font-medium ml-2">Parent App</span>
                  <span className="text-xs text-muted-foreground ml-auto">@aspectly/web</span>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${ready ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>{ready ? 'Connected' : 'Connecting...'}</span>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-blue-500" />
                      Call Widget Methods
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleGreet}
                        disabled={!ready}
                        className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                      >
                        greet()
                      </button>
                      <button
                        onClick={handleCalculate}
                        disabled={!ready}
                        className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                      >
                        calculate()
                      </button>
                      <button
                        onClick={handleToggleTheme}
                        disabled={!ready}
                        className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                      >
                        setTheme()
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      Event Log
                    </p>
                    <div className="bg-muted rounded-lg p-3 h-40 overflow-y-auto font-mono text-xs space-y-1">
                      {logs.length === 0 ? (
                        <div className="text-muted-foreground">Waiting for events...</div>
                      ) : (
                        logs.map((log, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-muted-foreground">{log.time}</span>
                            <span className={log.direction === 'in' ? 'text-green-600' : 'text-blue-600'}>
                              {log.direction === 'in' ? '←' : '→'}
                            </span>
                            <span>{log.message}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget Side (Iframe) */}
              <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/50 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-sm font-medium ml-2">Embedded Widget</span>
                  <span className="text-xs text-muted-foreground ml-auto">@aspectly/core</span>
                </div>
                <Iframe className="w-full h-80" title="Aspectly Demo Widget" />
              </div>
            </div>

            <div className="hidden lg:flex justify-center my-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <ArrowLeft className="h-4 w-4" />
                <span>Bidirectional Communication</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  )
}
