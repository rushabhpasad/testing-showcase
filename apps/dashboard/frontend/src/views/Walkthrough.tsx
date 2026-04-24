import { useState } from 'react'

const STEPS = [
  {
    title: 'Why Do We Test?',
    content: `Tests give us confidence to change code without breaking things.
Without tests, every change is a leap of faith. With tests, you get
immediate feedback when something breaks — before it reaches production.`,
  },
  {
    title: 'The Testing Trophy',
    content: `Kent C. Dodds proposed the Testing Trophy as an alternative to
the traditional pyramid. The key insight: integration tests give you
the best return on investment — they test real behavior without the
cost and fragility of full browser automation.`,
  },
  {
    title: 'Unit Tests',
    content: `Unit tests check one thing at a time. They are fast (milliseconds),
easy to write, and easy to debug. Use them heavily for business logic:
sorting, filtering, validation functions.

In this project: sortByPriority, filterByStatus, validateTask.`,
  },
  {
    title: 'Integration Tests',
    content: `Integration tests check that components work together.
In this project we test the full Express route + store + validation pipeline
using Supertest — no mocks, no ports, just the real code.

Key insight: avoid mocking what you don't own.`,
  },
  {
    title: 'End-to-End Tests',
    content: `E2E tests drive a real browser. They catch problems that unit
and integration tests can't — layout bugs, JavaScript errors, network issues.

Use them sparingly: they are slow, flaky, and expensive to maintain.
Write one happy-path test per feature, not exhaustive coverage.`,
  },
  {
    title: 'Contract Tests',
    content: `When a frontend and backend are developed by different teams,
contract tests prevent "it works in isolation but breaks in production."

The consumer defines what it expects. The provider verifies it can deliver.
No running both services simultaneously required.`,
  },
  {
    title: 'Snapshot Tests',
    content: `Snapshot tests capture a component's rendered output and fail
if it changes unexpectedly. They are great for detecting regressions
but can become a rubber-stamp if you always update without reviewing.

Review snapshot diffs carefully — they show exactly what changed.`,
  },
  {
    title: 'Performance Tests',
    content: `Performance tests answer: "How does the system behave under load?"
k6 lets you write load tests in JavaScript and define thresholds like
"p95 response time under 500ms."

Run performance tests in CI before releases, not just when things feel slow.`,
  },
  {
    title: 'Security Tests',
    content: `Security tests verify that your API is hardened:
- No sensitive server headers exposed
- SQL/XSS inputs handled gracefully
- Error responses don't leak stack traces
- Input size limits enforced

Automated security tests are a floor, not a ceiling — always do manual review too.`,
  },
  {
    title: 'Accessibility Tests',
    content: `Accessibility tests (axe-core) automatically detect WCAG violations:
missing alt text, unlabeled form controls, insufficient contrast.

Automated tools catch ~57% of accessibility issues. Manual testing with
screen readers and keyboard navigation catches the rest.`,
  },
  {
    title: 'The Right Balance',
    content: `There is no single right answer. The Testing Trophy suggests:
• Many unit tests (fast, cheap)
• More integration tests than you think
• Few E2E tests (high value, high cost)
• Contract tests when teams are decoupled
• Snapshot, security, and a11y as safety nets

Start with integration tests. Add unit tests for complex logic.
Add E2E tests for the most critical user paths.`,
  },
]

export function Walkthrough() {
  const [step, setStep] = useState(0)

  const current = STEPS[step]

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Guided Walkthrough</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        {STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            aria-label={`Go to step ${i + 1}`}
            aria-current={i === step ? 'step' : undefined}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: i === step ? '#111827' : '#d1d5db',
              cursor: 'pointer',
              border: 'none',
              padding: 0,
            }}
          />
        ))}
      </div>
      <div
        style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 32,
          minHeight: 200,
        }}
      >
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
          Step {step + 1} of {STEPS.length}
        </div>
        <h3 style={{ marginTop: 0, fontSize: 22 }}>{current.title}</h3>
        <p style={{ color: '#374151', whiteSpace: 'pre-line', lineHeight: 1.8 }}>{current.content}</p>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          style={{
            padding: '8px 20px',
            background: step === 0 ? '#f3f4f6' : '#111827',
            color: step === 0 ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: 4,
            cursor: step === 0 ? 'default' : 'pointer',
          }}
        >
          Previous
        </button>
        <button
          onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
          disabled={step === STEPS.length - 1}
          style={{
            padding: '8px 20px',
            background: step === STEPS.length - 1 ? '#f3f4f6' : '#111827',
            color: step === STEPS.length - 1 ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: 4,
            cursor: step === STEPS.length - 1 ? 'default' : 'pointer',
          }}
        >
          Next
        </button>
      </div>
    </div>
  )
}
