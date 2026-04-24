import { useState, useEffect, useRef } from 'react'
import { getSuites, runSuite } from '../api'
import type { Suite } from '../types'

type RunState = 'idle' | 'running' | 'passed' | 'failed'

interface SuiteCard {
  suite: Suite
  state: RunState
  output: string[]
}

const STATE_COLOR: Record<RunState, string> = {
  idle: '#6b7280',
  running: '#f59e0b',
  passed: '#10b981',
  failed: '#ef4444',
}

const STATE_DOT: Record<RunState, string> = {
  idle: '○',
  running: '●',
  passed: '✓',
  failed: '✗',
}

export function LiveDashboard() {
  const [cards, setCards] = useState<SuiteCard[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const cleanupRef = useRef<Map<string, () => void>>(new Map())
  const terminalRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    getSuites()
      .then(suites => {
        const initial = suites.map(s => ({ suite: s, state: 'idle' as RunState, output: [] }))
        setCards(initial)
        setSelected(initial[0]?.suite.id ?? null)
      })
      .catch(() => setError('Could not connect to dashboard backend (port 3002). Is it running?'))
      .finally(() => setLoading(false))
    return () => {
      cleanupRef.current.forEach(fn => fn())
    }
  }, [])

  // Auto-scroll terminal to bottom when output changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [cards, selected])

  const handleRun = (id: string) => {
    cleanupRef.current.get(id)?.()
    setSelected(id)
    setCards(prev => prev.map(c =>
      c.suite.id === id ? { ...c, state: 'running', output: [] } : c
    ))

    const stop = runSuite(
      id,
      (line) => {
        setCards(prev => prev.map(c =>
          c.suite.id === id ? { ...c, output: [...c.output, line] } : c
        ))
      },
      (exitCode) => {
        setCards(prev => prev.map(c =>
          c.suite.id === id ? { ...c, state: exitCode === 0 ? 'passed' : 'failed' } : c
        ))
        cleanupRef.current.delete(id)
      }
    )
    cleanupRef.current.set(id, stop)
  }

  if (loading) return <div style={{ color: '#6b7280' }}>Loading suites…</div>
  if (error) return <div style={{ color: '#ef4444', padding: 16, background: '#fef2f2', borderRadius: 6 }}>{error}</div>

  const activeCard = cards.find(c => c.suite.id === selected)

  return (
    <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 160px)', minHeight: 480 }}>

      {/* Left: suite list */}
      <div style={{
        width: 240,
        flexShrink: 0,
        borderRight: '1px solid #e5e7eb',
        overflowY: 'auto',
        background: 'white',
        borderRadius: '8px 0 0 8px',
        border: '1px solid #e5e7eb',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Test Suites
        </div>
        {cards.map(card => (
          <div
            key={card.suite.id}
            onClick={() => setSelected(card.suite.id)}
            style={{
              padding: '10px 16px',
              cursor: 'pointer',
              borderBottom: '1px solid #f3f4f6',
              background: selected === card.suite.id ? '#f9fafb' : 'white',
              borderLeft: selected === card.suite.id ? '3px solid #111827' : '3px solid transparent',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: selected === card.suite.id ? 600 : 400, color: '#111827' }}>
                {card.suite.name}
              </span>
              <span style={{ fontSize: 13, color: STATE_COLOR[card.state], fontWeight: 700 }}>
                {STATE_DOT[card.state]}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{card.suite.tool}</div>
          </div>
        ))}
      </div>

      {/* Right: terminal */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #e5e7eb',
        borderLeft: 'none',
        borderRadius: '0 8px 8px 0',
        overflow: 'hidden',
      }}>
        {/* Terminal header */}
        <div style={{
          background: '#1e293b',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Traffic light dots */}
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>
              {activeCard ? activeCard.suite.name : 'Select a suite'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {activeCard?.suite.requiresServer && (
              <span style={{ fontSize: 11, color: '#64748b', background: '#334155', padding: '2px 8px', borderRadius: 4 }}>
                requires server
              </span>
            )}
            <button
              onClick={() => activeCard && handleRun(activeCard.suite.id)}
              disabled={!activeCard || activeCard.state === 'running'}
              style={{
                padding: '4px 14px',
                background: (!activeCard || activeCard.state === 'running') ? '#334155' : '#10b981',
                color: (!activeCard || activeCard.state === 'running') ? '#64748b' : 'white',
                border: 'none',
                borderRadius: 4,
                cursor: (!activeCard || activeCard.state === 'running') ? 'default' : 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {activeCard?.state === 'running' ? 'Running…' : '▶ Run'}
            </button>
          </div>
        </div>

        {/* Terminal body */}
        <pre
          ref={terminalRef}
          style={{
            flex: 1,
            margin: 0,
            padding: 16,
            background: '#0f172a',
            color: '#e2e8f0',
            fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", "SF Mono", Menlo, monospace',
            fontSize: 12,
            lineHeight: 1.6,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {!activeCard || activeCard.output.length === 0 ? (
            <span style={{ color: '#475569' }}>
              {activeCard
                ? `$ ${activeCard.suite.command}\n\nPress ▶ Run to execute this suite.`
                : 'Select a suite from the list.'}
            </span>
          ) : (
            <>
              <span style={{ color: '#475569' }}>$ {activeCard.suite.command}{'\n\n'}</span>
              {activeCard.output.join('')}
              {activeCard.state === 'running' && (
                <span style={{ color: '#f59e0b' }}>█</span>
              )}
              {activeCard.state === 'passed' && (
                <span style={{ color: '#10b981', display: 'block', marginTop: 8 }}>✓ Passed</span>
              )}
              {activeCard.state === 'failed' && (
                <span style={{ color: '#ef4444', display: 'block', marginTop: 8 }}>✗ Failed</span>
              )}
            </>
          )}
        </pre>
      </div>
    </div>
  )
}
