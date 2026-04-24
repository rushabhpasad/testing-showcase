import { useState, useEffect, useRef } from 'react'
import { getSuites, runSuite } from '../api'
import type { Suite } from '../types'

type RunState = 'idle' | 'running' | 'passed' | 'failed'

interface SuiteCard {
  suite: Suite
  state: RunState
  output: string[]
}

export function LiveDashboard() {
  const [cards, setCards] = useState<SuiteCard[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const cleanupRef = useRef<Map<string, () => void>>(new Map())

  useEffect(() => {
    getSuites()
      .then(suites => {
        setCards(suites.map(s => ({ suite: s, state: 'idle', output: [] })))
      })
      .catch(() => setError('Could not connect to dashboard backend (port 3002). Is it running?'))
      .finally(() => setLoading(false))
    return () => {
      cleanupRef.current.forEach(fn => fn())
    }
  }, [])

  const updateCard = (id: string, update: Partial<SuiteCard>) => {
    setCards(prev => prev.map(c => c.suite.id === id ? { ...c, ...update } : c))
  }

  const handleRun = (id: string) => {
    cleanupRef.current.get(id)?.()
    updateCard(id, { state: 'running', output: [] })
    setExpanded(id)

    const stop = runSuite(
      id,
      (line) => {
        setCards(prev => prev.map(c =>
          c.suite.id === id ? { ...c, output: [...c.output, line] } : c
        ))
      },
      (exitCode) => {
        updateCard(id, { state: exitCode === 0 ? 'passed' : 'failed' })
        cleanupRef.current.delete(id)
      }
    )
    cleanupRef.current.set(id, stop)
  }

  if (loading) return <div style={{ color: '#6b7280' }}>Loading suites…</div>
  if (error) return <div style={{ color: '#ef4444', padding: 16, background: '#fef2f2', borderRadius: 6 }}>{error}</div>

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Live Dashboard</h2>
      <p style={{ color: '#6b7280' }}>
        Click Run on any suite to stream its output live. Suites marked with * require the sample app to be running.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {cards.map(card => (
          <div
            key={card.suite.id}
            style={{
              background: 'white',
              border: `1px solid ${card.state === 'passed' ? '#10b981' : card.state === 'failed' ? '#ef4444' : '#e5e7eb'}`,
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700 }}>
                  {card.suite.name}
                  {card.suite.requiresServer && ' *'}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{card.suite.tool}</div>
              </div>
              <button
                onClick={() => handleRun(card.suite.id)}
                disabled={card.state === 'running'}
                style={{
                  padding: '4px 12px',
                  background: card.state === 'running' ? '#d1d5db' : '#111827',
                  color: card.state === 'running' ? '#6b7280' : 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: card.state === 'running' ? 'default' : 'pointer',
                  fontSize: 13,
                }}
              >
                {card.state === 'running' ? 'Running\u2026' : 'Run'}
              </button>
            </div>
            <div style={{ fontSize: 12, color: '#374151', marginTop: 8 }}>{card.suite.description}</div>
            {card.state !== 'idle' && (
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => setExpanded(expanded === card.suite.id ? null : card.suite.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#6b7280' }}
                >
                  {expanded === card.suite.id ? '\u25b2 Hide output' : '\u25bc Show output'}
                </button>
                {expanded === card.suite.id && (
                  <pre
                    style={{
                      background: '#1e293b',
                      color: '#e2e8f0',
                      padding: 8,
                      borderRadius: 4,
                      fontSize: 11,
                      overflowX: 'auto',
                      maxHeight: 200,
                      marginTop: 4,
                    }}
                  >
                    {card.output.join('')}
                  </pre>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
