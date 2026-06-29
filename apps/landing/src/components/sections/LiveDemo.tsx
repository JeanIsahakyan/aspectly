import { useState, useEffect, useCallback } from 'react'
import { ArrowRight, ArrowLeft, Zap, Terminal, ExternalLink, X } from 'lucide-react'
import { useAspectlyIframe, useAspectlyWindow } from '@aspectly/web'
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
  const [readyW, setReadyW] = useState(false)
  const [mode, setMode] = useState<'iframe' | 'popup'>('iframe')

  const [bridge, loaded, Iframe] = useAspectlyIframe({
    url: import.meta.env.BASE_URL + 'widget.html',
  })
  const [bridgeW, loadedW, openWindow, closeWindow, isOpen] = useAspectlyWindow({
    url: import.meta.env.BASE_URL + 'popup.html',
    features: 'width=440,height=600',
  })

  const addLog = useCallback((message: string, direction: 'in' | 'out') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false })
    setLogs(prev => [{ time, message, direction }, ...prev].slice(0, 20))
  }, [])

  const handlers = useCallback(() => ({
    getTime: async () => {
      addLog('getTime()', 'in')
      return { time: new Date().toISOString() }
    },
    getUserInfo: async () => {
      addLog('getUserInfo()', 'in')
      return { name: 'Demo User', role: 'Developer', id: 42 }
    },
  }), [addLog])

  // iframe bridge
  useEffect(() => {
    if (!loaded) return
    let stale = false
    bridge.init(handlers()).then(() => {
      if (stale) return
      setReady(true)
      addLog('Iframe connected!', 'in')
    })
    return () => { stale = true }
  }, [loaded, bridge, addLog, handlers])

  // popup window bridge
  useEffect(() => {
    if (!loadedW) return
    let stale = false
    bridgeW.init(handlers()).then(() => {
      if (stale) return
      setReadyW(true)
      addLog('Popup connected!', 'in')
    })
    return () => { stale = true }
  }, [loadedW, bridgeW, addLog, handlers])

  const active = mode === 'popup' ? bridgeW : bridge
  const activeReady = mode === 'popup' ? readyW && isOpen : ready

  const handleGreet = async () => {
    try {
      addLog('greet({ name: "Landing" })', 'out')
      const result = await active.send<{ message: string }>('greet', { name: 'Landing' })
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
      const result = await active.send<{ sum: number; product: number }>('calculate', { a, b })
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
      await active.send('setTheme', { dark: newTheme })
      addLog('Theme applied', 'in')
    } catch (e: unknown) {
      const err = e as Record<string, string>
      addLog(`Error: ${err.message || err.error_message}`, 'in')
    }
  }

  return (
    <section id="demo" className="relative py-20 lg:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <BlurFade delay={0.1} inView>
          <div className="mx-auto max-w-2xl text-center mb-10">
            <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Live Demo
            </span>
            <h2 className="mt-5 font-display text-3xl font-semibold sm:text-4xl lg:text-5xl">
              Try it yourself
            </h2>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
              The same bridge talks to an embedded <span className="text-foreground">iframe</span> or a real{' '}
              <span className="text-foreground">popup window</span> — switch and watch bidirectional messaging happen live.
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.15} inView>
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-soft">
              {(['iframe', 'popup'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    mode === m ? 'bg-primary text-primary-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {m === 'iframe' ? 'Iframe' : 'Popup window'}
                </button>
              ))}
            </div>
          </div>
        </BlurFade>

        <BlurFade delay={0.2} inView>
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-5 lg:grid-cols-2">
              {/* Parent Side */}
              <div className="overflow-hidden rounded-2xl glass-strong shadow-soft transition-shadow hover:shadow-lift">
                <div className="flex items-center gap-3 border-b border-border/60 px-5 py-3.5">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-400/80" />
                    <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
                    <span className="h-3 w-3 rounded-full bg-green-400/80" />
                  </div>
                  <span className="ml-1 text-sm font-medium text-foreground">Parent App</span>
                  <span className="ml-auto rounded-full border border-border bg-card px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                    @aspectly/web
                  </span>
                </div>

                <div className="space-y-5 p-5">
                  <div className="flex items-center gap-2.5">
                    <span className={`relative flex h-2.5 w-2.5 ${activeReady ? 'text-green-500' : 'text-amber-500'}`}>
                      {activeReady && (
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                      )}
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-current" />
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {activeReady ? 'Connected' : mode === 'popup' && !isOpen ? 'Open the popup →' : 'Connecting…'}
                    </span>
                  </div>

                  <div>
                    <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <ArrowRight className="h-3.5 w-3.5 text-primary" />
                      Call {mode === 'popup' ? 'popup' : 'widget'} methods
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleGreet}
                        disabled={!activeReady}
                        className="rounded-xl bg-primary px-4 py-2 font-mono text-sm font-medium text-primary-foreground shadow-soft transition-all hover:shadow-lift disabled:opacity-40 disabled:shadow-none"
                      >
                        greet()
                      </button>
                      <button
                        onClick={handleCalculate}
                        disabled={!activeReady}
                        className="rounded-xl border border-border bg-card px-4 py-2 font-mono text-sm font-medium text-foreground transition-all hover:bg-muted hover:shadow-soft disabled:opacity-40"
                      >
                        calculate()
                      </button>
                      <button
                        onClick={handleToggleTheme}
                        disabled={!activeReady}
                        className="rounded-xl border border-border bg-card px-4 py-2 font-mono text-sm font-medium text-foreground transition-all hover:bg-muted hover:shadow-soft disabled:opacity-40"
                      >
                        setTheme()
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <Terminal className="h-3.5 w-3.5 text-primary" />
                      Event log
                    </p>
                    <div className="h-44 space-y-1.5 overflow-y-auto rounded-xl border border-border bg-muted/60 p-4 font-mono text-xs">
                      {logs.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          Waiting for events…
                        </div>
                      ) : (
                        logs.map((log, i) => (
                          <div key={i} className="flex items-baseline gap-2.5">
                            <span className="tabular-nums text-muted-foreground/70">{log.time}</span>
                            <span
                              className={`font-semibold ${log.direction === 'in' ? 'text-green-600' : 'text-primary'}`}
                            >
                              {log.direction === 'in' ? '←' : '→'}
                            </span>
                            <span className="text-pretty text-foreground/90">{log.message}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget Side — iframe or popup */}
              <div className="overflow-hidden rounded-2xl glass-strong shadow-soft transition-shadow hover:shadow-lift">
                <div className="flex items-center gap-3 border-b border-border/60 px-5 py-3.5">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-400/80" />
                    <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
                    <span className="h-3 w-3 rounded-full bg-green-400/80" />
                  </div>
                  <span className="ml-1 text-sm font-medium text-foreground">
                    {mode === 'popup' ? 'Popup Window' : 'Embedded Widget'}
                  </span>
                  <span className="ml-auto rounded-full border border-border bg-card px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                    @aspectly/core
                  </span>
                </div>

                {mode === 'iframe' ? (
                  <Iframe className="h-80 w-full" title="Aspectly Demo Widget" />
                ) : (
                  <div className="flex h-80 flex-col items-center justify-center gap-5 p-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <ExternalLink className="h-6 w-6" />
                    </div>
                    <p className="max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
                      {isOpen
                        ? 'Popup is open in a separate window — call its methods from the parent on the left.'
                        : 'Opens a real OS popup window and connects over the very same bridge protocol.'}
                    </p>
                    {!isOpen ? (
                      <button
                        onClick={openWindow}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-all hover:shadow-lift"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open popup window
                      </button>
                    ) : (
                      <button
                        onClick={closeWindow}
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-muted"
                      >
                        <X className="h-4 w-4" />
                        Close popup
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 hidden justify-center lg:flex">
              <span className="inline-flex items-center gap-2.5 rounded-full glass px-4 py-2 text-sm text-muted-foreground">
                <ArrowLeft className="h-4 w-4 text-primary" />
                Bidirectional communication
                <ArrowRight className="h-4 w-4 text-primary" />
              </span>
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  )
}
