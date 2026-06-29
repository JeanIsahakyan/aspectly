import { useState, useEffect, useCallback } from 'react'
import { AspectlyBridge } from '@aspectly/core'

interface LogEntry {
  message: string
  direction: 'in' | 'out' | 'info'
}

export function PopupApp() {
  const [connected, setConnected] = useState(false)
  const [dark, setDark] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [bridge] = useState(() => new AspectlyBridge())

  const addLog = useCallback((message: string, direction: LogEntry['direction'] = 'info') => {
    setLogs(prev => [{ message, direction }, ...prev].slice(0, 15))
  }, [])

  useEffect(() => {
    let stale = false
    bridge.init({
      greet: async (params: { name: string }) => {
        addLog(`greet({ name: "${params.name}" })`, 'in')
        return { message: `Hello, ${params.name}! Greetings from popup.` }
      },
      calculate: async (params: { a: number; b: number }) => {
        addLog(`calculate({ a: ${params.a}, b: ${params.b} })`, 'in')
        return { sum: params.a + params.b, product: params.a * params.b }
      },
      setTheme: async (params: { dark: boolean }) => {
        setDark(params.dark)
        addLog(`setTheme({ dark: ${params.dark} })`, 'in')
        return { applied: true }
      }
    }).then(() => {
      if (stale) return
      setConnected(true)
      addLog('Bridge initialized!')
    })
    return () => { stale = true }
  }, [bridge, addLog])

  const callGetTime = async () => {
    try {
      addLog('getTime()', 'out')
      const result = await bridge.send<{ time: string }>('getTime')
      addLog(`${result.time}`, 'in')
    } catch (e: unknown) {
      const err = e as Record<string, string>
      addLog(`Error: ${err.message || err.error_message}`, 'info')
    }
  }

  const callGetUserInfo = async () => {
    try {
      addLog('getUserInfo()', 'out')
      const result = await bridge.send<{ name: string; role: string }>('getUserInfo')
      addLog(`${result.name} (${result.role})`, 'in')
    } catch (e: unknown) {
      const err = e as Record<string, string>
      addLog(`Error: ${err.message || err.error_message}`, 'info')
    }
  }

  const card = dark
    ? 'bg-white/[0.04] border border-white/10'
    : 'bg-white border border-slate-200 shadow-sm'
  const muted = dark ? 'text-slate-400' : 'text-slate-500'

  return (
    <div
      className={`min-h-screen p-6 transition-colors duration-300 ${
        dark ? 'bg-slate-950 text-slate-100' : 'bg-[#f7f6f2] text-slate-900'
      }`}
      style={{ fontFamily: '"Geist", ui-sans-serif, system-ui, sans-serif' }}
    >
      <div className="mx-auto max-w-md space-y-3">
        {/* Status */}
        <div className={`rounded-xl p-4 ${card}`}>
          <div className="flex items-center gap-2 text-sm">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${connected ? 'animate-ping bg-emerald-400' : 'bg-red-400'}`} />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
            </span>
            <span className="font-medium">{connected ? 'Connected to parent' : 'Connecting…'}</span>
            <span className={`ml-auto font-mono text-[10px] ${muted}`}>window.opener</span>
          </div>
        </div>

        {/* Actions */}
        <div className={`rounded-xl p-4 ${card}`}>
          <h3 className={`mb-2.5 text-[11px] font-semibold uppercase tracking-wider ${muted}`}>Call parent</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={callGetTime}
              disabled={!connected}
              className="rounded-lg bg-violet-600 px-3 py-1.5 font-mono text-xs font-medium text-white shadow-sm transition hover:bg-violet-500 disabled:opacity-40"
            >
              getTime()
            </button>
            <button
              onClick={callGetUserInfo}
              disabled={!connected}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition disabled:opacity-40 ${
                dark ? 'bg-white/10 text-slate-100 hover:bg-white/15' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              getUserInfo()
            </button>
          </div>
        </div>

        {/* Log */}
        <div className={`rounded-xl p-4 ${card}`}>
          <h3 className={`mb-2 text-[11px] font-semibold uppercase tracking-wider ${muted}`}>Log</h3>
          <div className={`max-h-48 space-y-1 overflow-y-auto rounded-lg p-2.5 font-mono text-[11px] leading-relaxed ${dark ? 'bg-black/30' : 'bg-slate-50'}`}>
            {logs.map((log, i) => (
              <div
                key={i}
                className={
                  log.direction === 'in'
                    ? dark ? 'text-emerald-300' : 'text-emerald-600'
                    : log.direction === 'out'
                    ? dark ? 'text-sky-300' : 'text-sky-600'
                    : muted
                }
              >
                {log.direction === 'in' && '← '}
                {log.direction === 'out' && '→ '}
                {log.message}
              </div>
            ))}
            {logs.length === 0 && <div className={muted}>Waiting…</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
