import { useState } from 'react'
import { Trophy } from './views/Trophy'
import { Explorer } from './views/Explorer'
import { Walkthrough } from './views/Walkthrough'
import { LiveDashboard } from './views/LiveDashboard'

type Tab = 'trophy' | 'explorer' | 'walkthrough' | 'dashboard'

const TABS: { id: Tab; label: string }[] = [
  { id: 'trophy', label: 'Testing Trophy' },
  { id: 'explorer', label: 'Test Explorer' },
  { id: 'walkthrough', label: 'Guided Walkthrough' },
  { id: 'dashboard', label: 'Live Dashboard' },
]

export function App() {
  const [tab, setTab] = useState<Tab>('trophy')

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#f9fafb' }}>
      <header style={{ background: '#111827', color: 'white', padding: '16px 24px' }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>Testing Showcase</h1>
      </header>
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid #111827' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
              fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? '#111827' : '#6b7280',
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <main style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
        {tab === 'trophy' && <Trophy />}
        {tab === 'explorer' && <Explorer />}
        {tab === 'walkthrough' && <Walkthrough />}
        {tab === 'dashboard' && <LiveDashboard />}
      </main>
    </div>
  )
}
