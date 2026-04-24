export interface Suite {
  id: string
  name: string
  description: string
  type: 'unit' | 'integration' | 'e2e' | 'contract' | 'snapshot' | 'performance' | 'security' | 'accessibility'
  tool: string
  command: string
  cwd: string
  requiresServer: boolean
}

export const suites: Suite[] = [
  {
    id: 'unit',
    name: 'Unit Tests',
    description: 'Tests for individual functions and React components in isolation',
    type: 'unit',
    tool: 'Vitest + React Testing Library',
    command: 'pnpm test',
    cwd: 'packages/tests/unit',
    requiresServer: false,
  },
  {
    id: 'integration',
    name: 'Integration Tests',
    description: 'Tests for the Express API routes with an in-memory store',
    type: 'integration',
    tool: 'Vitest + Supertest',
    command: 'pnpm test',
    cwd: 'packages/tests/integration',
    requiresServer: false,
  },
  {
    id: 'e2e',
    name: 'End-to-End Tests',
    description: 'Full user flow tests in a real browser',
    type: 'e2e',
    tool: 'Playwright',
    command: 'pnpm test',
    cwd: 'packages/tests/e2e',
    requiresServer: true,
  },
  {
    id: 'contract',
    name: 'Contract Tests',
    description: 'Consumer-driven contract tests between frontend and backend',
    type: 'contract',
    tool: 'Pact',
    command: 'pnpm test',
    cwd: 'packages/tests/contract',
    requiresServer: false,
  },
  {
    id: 'snapshot',
    name: 'Snapshot Tests',
    description: 'React component snapshot tests to detect unintended UI changes',
    type: 'snapshot',
    tool: 'Vitest + React Testing Library',
    command: 'pnpm test',
    cwd: 'packages/tests/snapshot',
    requiresServer: false,
  },
  {
    id: 'performance',
    name: 'Performance Tests',
    description: 'Load and spike tests to measure API throughput',
    type: 'performance',
    tool: 'k6',
    command: 'pnpm test',
    cwd: 'packages/tests/performance',
    requiresServer: true,
  },
  {
    id: 'security',
    name: 'Security Tests',
    description: 'Header, injection, and input validation security checks',
    type: 'security',
    tool: 'Vitest + Supertest',
    command: 'pnpm test',
    cwd: 'packages/tests/security',
    requiresServer: false,
  },
  {
    id: 'accessibility',
    name: 'Accessibility Tests',
    description: 'WCAG 2.1 AA compliance checks using axe-core',
    type: 'accessibility',
    tool: 'axe-core + Playwright',
    command: 'pnpm test',
    cwd: 'packages/tests/accessibility',
    requiresServer: true,
  },
]
