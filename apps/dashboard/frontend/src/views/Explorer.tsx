import { useState } from 'react'

const SUITES_INFO = [
  {
    id: 'unit',
    label: 'Unit Tests',
    explanation: `Unit tests check individual functions and components in isolation.
They are fast, easy to debug, and should make up the bulk of your test suite.
In this project: sort.test.ts verifies the priority ordering logic.`,
    code: `it('sortByPriority puts high priority tasks first', () => {
  const tasks = [
    { priority: 'low', title: 'A' },
    { priority: 'high', title: 'B' },
  ]
  const sorted = sortByPriority(tasks)
  expect(sorted[0].priority).toBe('high')
})`,
  },
  {
    id: 'integration',
    label: 'Integration Tests',
    explanation: `Integration tests verify that components work together correctly.
Here we test the Express routes against an in-memory store — no mocks.
We get real confidence that the API contract is correct.`,
    code: `it('creates a task and returns 201', async () => {
  const res = await request(app)
    .post('/tasks')
    .send({ title: 'Buy milk', priority: 'high' })
  expect(res.status).toBe(201)
  expect(res.body.title).toBe('Buy milk')
})`,
  },
  {
    id: 'e2e',
    label: 'E2E Tests',
    explanation: `End-to-end tests simulate real user interactions in a browser.
They catch integration issues that unit and integration tests miss,
but are slower and more brittle.`,
    code: `test('user can create a task', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Task title').fill('Buy groceries')
  await page.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByText('Buy groceries')).toBeVisible()
})`,
  },
  {
    id: 'contract',
    label: 'Contract Tests',
    explanation: `Contract tests verify that the API the frontend expects
matches what the backend actually provides — without both services
running at the same time.`,
    code: `provider
  .given('tasks exist')
  .uponReceiving('a request to get all tasks')
  .withRequest({ method: 'GET', path: '/tasks' })
  .willRespondWith({
    status: 200,
    body: eachLike({ id: like('abc'), title: like('Task') }),
  })`,
  },
  {
    id: 'snapshot',
    label: 'Snapshot Tests',
    explanation: `Snapshot tests capture the rendered HTML of a component
and fail if it changes unexpectedly. Great for catching accidental regressions.
Update snapshots intentionally with --update-snapshots.`,
    code: `it('TaskItem renders an incomplete task', () => {
  const { container } = render(
    <TaskItem task={baseTask} onToggle={noop} onDelete={noop} />
  )
  expect(container).toMatchSnapshot()
})`,
  },
  {
    id: 'performance',
    label: 'Performance Tests',
    explanation: `Performance tests measure throughput, latency, and stability
under load. k6 lets you define VU counts, ramp patterns, and thresholds.
Run these against a real running server.`,
    code: `export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
}`,
  },
  {
    id: 'security',
    label: 'Security Tests',
    explanation: `Security tests check that your API is hardened:
no sensitive headers exposed, SQL/XSS inputs handled safely,
and error responses don't leak stack traces.`,
    code: `it('does not expose X-Powered-By header', async () => {
  const res = await request(app).get('/health')
  expect(res.headers['x-powered-by']).toBeUndefined()
})

it('rejects a title exceeding 200 characters', async () => {
  const res = await request(app)
    .post('/tasks').send({ title: 'A'.repeat(201) })
  expect(res.status).toBe(400)
})`,
  },
  {
    id: 'accessibility',
    label: 'Accessibility Tests',
    explanation: `Accessibility tests verify WCAG 2.1 AA compliance automatically.
axe-core scans the rendered page for violations like missing labels,
insufficient color contrast, and invalid ARIA attributes.`,
    code: `test('task form inputs are properly labeled', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('form')
  const results = await new AxeBuilder({ page })
    .include('form')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  expect(results.violations).toEqual([])
})`,
  },
]

export function Explorer() {
  const [selected, setSelected] = useState(SUITES_INFO[0])

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Test Explorer</h2>
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ width: 200, flexShrink: 0 }}>
          {SUITES_INFO.map(s => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                border: 'none',
                borderRadius: 4,
                background: selected.id === s.id ? '#111827' : 'transparent',
                color: selected.id === s.id ? 'white' : '#374151',
                cursor: 'pointer',
                marginBottom: 2,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ marginTop: 0 }}>{selected.label}</h3>
          <p style={{ color: '#6b7280', whiteSpace: 'pre-line' }}>{selected.explanation}</p>
          <pre
            style={{
              background: '#1e293b',
              color: '#e2e8f0',
              padding: 16,
              borderRadius: 6,
              overflowX: 'auto',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            <code>{selected.code}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}
