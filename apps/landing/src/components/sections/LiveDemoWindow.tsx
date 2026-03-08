import { useState, useEffect, useCallback } from 'react'
import { ExternalLink, ArrowRight, ArrowLeft, Zap, X } from 'lucide-react'
import { useAspectlyWindow } from '@aspectly/web'
import { BlurFade } from '../reactbits'

interface LogEntry {
  time: string
  message: string
  direction: 'in' | 'out'
}

export function LiveDemoWindow() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [darkTheme, setDarkTheme] = useState(false)
  const [ready, setReady] = useState(false)

  const [bridge, loaded, openWindow, closeWindow, isOpen] = useAspectlyWindow({
    url: import.meta.env.BASE_URL + 'popup.html',
    features: 'width=420,height=500,left=200,top=200',
  })

  const addLog = useCallback((message: string, direction: 'in' | 'out') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false })
    setLogs(prev => [{ time, message, direction }, ...prev].slice(0, 20))
  }, [])

  const isReady = ready && isOpen

  useEffect(() => {
    if (!isOpen || !loaded) return
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
  }, [loaded, isOpen, bridge, addLog])

  const handleGreet = async () => {
    try {
      addLog('greet({ name: "Parent" })', 'out')
      const result = await bridge.send<{ message: string }>('greet', { name: 'Parent' })
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
    <section id="demo-window" className="py-24">
      <div className="container px-4 mx-auto">
        <BlurFade delay={0.1} inView>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 mb-4">
              <ExternalLink className="h-4 w-4" />
              <span className="font-medium">Window Demo</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Popup Window Communication
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Open a popup window and communicate with it using Aspectly.
              Same bridge API, different transport — <code className="text-sm bg-muted px-1.5 py-0.5 rounded">window.opener</code> instead of <code className="text-sm bg-muted px-1.5 py-0.5 rounded">iframe</code>.
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.2} inView>
          <div className="max-w-2xl mx-auto">
            <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/50 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-sm font-medium ml-2">Parent App</span>
                <span className="text-xs text-muted-foreground ml-auto">useAspectlyWindow</span>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>{isReady ? 'Connected' : isOpen ? 'Connecting...' : 'Window closed'}</span>
                  </div>
                  {!isOpen ? (
                    <button
                      onClick={openWindow}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Popup
                    </button>
                  ) : (
                    <button
                      onClick={closeWindow}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      <X className="h-3.5 w-3.5" />
                      Close
                    </button>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-emerald-500" />
                    Call Popup Methods
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleGreet}
                      disabled={!isReady}
                      className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                      greet()
                    </button>
                    <button
                      onClick={handleCalculate}
                      disabled={!isReady}
                      className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                      calculate()
                    </button>
                    <button
                      onClick={handleToggleTheme}
                      disabled={!isReady}
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
                      <div className="text-muted-foreground">Open a popup window to start...</div>
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

            <div className="hidden lg:flex justify-center my-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <ArrowLeft className="h-4 w-4" />
                <span>window.opener / postMessage</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  )
}
