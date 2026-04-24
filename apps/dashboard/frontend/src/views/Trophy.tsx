const TROPHY_LAYERS = [
  {
    label: 'E2E',
    description: 'Full browser flows. Slow, but high confidence.',
    color: '#f59e0b',
    width: '30%',
    suites: ['e2e', 'accessibility'],
  },
  {
    label: 'Integration',
    description: 'API routes, contract, performance, security.',
    color: '#3b82f6',
    width: '60%',
    suites: ['integration', 'contract', 'performance', 'security'],
  },
  {
    label: 'Unit',
    description: 'Functions and components in isolation. Fast, numerous.',
    color: '#10b981',
    width: '85%',
    suites: ['unit', 'snapshot'],
  },
  {
    label: 'Static',
    description: 'TypeScript type checking, linting. Zero runtime cost.',
    color: '#6366f1',
    width: '100%',
    suites: [],
  },
]

export function Trophy() {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Testing Trophy</h2>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>
        The Testing Trophy shows the recommended balance of test types. Favor integration tests —
        they give high confidence without the fragility of E2E tests.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {TROPHY_LAYERS.map(layer => (
          <div
            key={layer.label}
            style={{
              width: layer.width,
              background: layer.color,
              color: 'white',
              padding: '16px 24px',
              borderRadius: 6,
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 18 }}>{layer.label}</div>
            <div style={{ fontSize: 13, marginTop: 4, opacity: 0.9 }}>{layer.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
