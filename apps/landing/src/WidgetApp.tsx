import { useState, useEffect, useCallback } from 'react'
import { AspectlyBridge } from '@aspectly/core'

interface LogEntry {
  message: string
  direction: 'in' | 'out' | 'info'
}

export function WidgetApp() {
  const [connected, setConnected] = useState(false)
  const [dark, setDark] = useState(false)
  const [parentMethods, setParentMethods] = useState<string[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [bridge] = useState(() => new AspectlyBridge())

  const addLog = useCallback((message: string, direction: LogEntry['direction'] = 'info') => {
    setLogs(prev => [{ message, direction }, ...prev].slice(0, 15))
  }, [])

  useEffect(() => {
    bridge.init({
      greet: async (params: { name: string }) => {
        addLog(`greet({ name: "${params.name}" })`, 'in')
        return { message: `Hello, ${params.name}! Greetings from widget.` }
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
      setConnected(true)
      setParentMethods(['getTime', 'getUserInfo'].filter(m => bridge.supports(m)))
      addLog('Bridge initialized!')
    })

  }, [bridge, addLog])

  const callGetTime = async () => {
    try {
      addLog('getTime()', 'out')
      const result = await bridge.send<{ time: string }>('getTime')
      addLog(`→ ${result.time}`, 'in')
    } catch (e: unknown) {
      const err = e as Record<string, string>
      addLog(`Error: ${err.message || err.error_message}`, 'info')
    }
  }

  const callGetUserInfo = async () => {
    try {
      addLog('getUserInfo()', 'out')
      const result = await bridge.send<{ name: string; role: string }>('getUserInfo')
      addLog(`→ ${result.name} (${result.role})`, 'in')
    } catch (e: unknown) {
      const err = e as Record<string, string>
      addLog(`Error: ${err.message || err.error_message}`, 'info')
    }
  }

  return (
    <div className={`min-h-screen p-4 transition-colors ${dark ? 'bg-slate-900' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
      {/* Status Card */}
      <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 mb-3">
        <div className="flex items-center gap-2 text-white text-sm">
          <div className={`w-2 h-2 rounded-full transition-colors ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span>{connected ? 'Connected' : 'Connecting...'}</span>
        </div>
        {parentMethods.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {parentMethods.map(m => (
              <span key={m} className="bg-white/20 text-white text-xs px-2 py-1 rounded-full font-mono">
                {m}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions Card */}
      <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 mb-3">
        <h3 className="text-white text-sm font-medium mb-2 opacity-90">Call Parent Methods</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={callGetTime}
            disabled={!connected}
            className="bg-white text-indigo-600 px-3 py-1.5 rounded-md text-xs font-medium hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            getTime()
          </button>
          <button
            onClick={callGetUserInfo}
            disabled={!connected}
            className="bg-white text-indigo-600 px-3 py-1.5 rounded-md text-xs font-medium hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            getUserInfo()
          </button>
        </div>
      </div>

      {/* Log Card */}
      <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
        <h3 className="text-white text-sm font-medium mb-2 opacity-90">Log</h3>
        <div className="bg-black/20 rounded-lg p-2 max-h-28 overflow-y-auto font-mono text-xs space-y-1">
          {logs.map((log, i) => (
            <div
              key={i}
              className={`${
                log.direction === 'in' ? 'text-green-300' :
                log.direction === 'out' ? 'text-blue-300' :
                'text-white/70'
              }`}
            >
              {log.direction === 'in' && '← '}
              {log.direction === 'out' && '→ '}
              {log.message}
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-white/50">Waiting...</div>
          )}
        </div>
      </div>
    </div>
  )
}
