# AGENTS.md — testing-showcase

AI agent guide for the `testing-showcase` monorepo. Read this before making any changes.

## Repository Purpose

A teaching and presentation tool demonstrating 8 types of automated testing across a realistic full-stack monorepo. Each test suite is intentionally self-contained and illustrates one testing pattern in isolation.

## Monorepo Structure

```
testing-showcase/
├── apps/
│   ├── sample-app/
│   │   ├── backend/     # Express API — port 3001
│   │   └── frontend/    # Vite/React — port 5173
│   └── dashboard/
│       ├── backend/     # Express API — port 3002
│       └── frontend/    # Vite/React — port 5174
└── packages/
    └── tests/
        ├── unit/
        ├── integration/
        ├── e2e/
        ├── contract/
        ├── snapshot/
        ├── performance/
        ├── security/
        └── accessibility/
```

Package manager: **pnpm workspaces**. Always use `pnpm`, never `npm` or `yarn`.

## Getting Started

```bash
pnpm install          # install all dependencies
pnpm dev              # start all 4 servers concurrently
pnpm test:all         # run all test suites
```

## Servers

| App | Port | Start command |
|-----|------|---------------|
| Sample App frontend | 5173 | included in `pnpm dev` |
| Sample App backend | 3001 | included in `pnpm dev` |
| Dashboard frontend | 5174 | included in `pnpm dev` |
| Dashboard backend | 3002 | included in `pnpm dev` |

## Test Suites

| Package filter | Tool | Requires servers |
|----------------|------|-----------------|
| `tests-unit` | Vitest | No |
| `tests-integration` | Vitest + Supertest | No |
| `tests-contract` | Vitest + Pact | No |
| `tests-snapshot` | Vitest + RTL | No |
| `tests-security` | Vitest + Supertest | No |
| `tests-e2e` | Playwright | Yes (`pnpm dev`) |
| `tests-accessibility` | Playwright + axe-core | Yes (`pnpm dev`) |
| `tests-performance` | k6 (system binary) | Yes (`pnpm dev`) |

Run a specific suite:
```bash
pnpm --filter tests-unit run test
pnpm --filter tests-integration run test
pnpm --filter tests-contract run test
pnpm --filter tests-contract run test:provider
pnpm --filter tests-snapshot run test
pnpm --filter tests-security run test
pnpm --filter tests-e2e run test
pnpm --filter tests-accessibility run test
pnpm --filter tests-performance run test
```

### SHOW_FAILURES mode

Every suite supports a demo mode that intentionally trips failing assertions:

```bash
SHOW_FAILURES=true pnpm --filter tests-unit run test
```

In test files this is gated with:
```typescript
const showFailures = process.env.SHOW_FAILURES === 'true'
test.describe('[FAILURE EXAMPLE]', () => {
  test.skip(!showFailures, 'Set SHOW_FAILURES=true to run these')
  // ...
})
```

Do not remove these blocks — they are core to the teaching purpose.

## Architecture Patterns

### Backend (sample-app and dashboard)

- `app.ts` — creates and configures the Express app, exports it. **No `app.listen()` here.**
- `index.ts` — imports app, calls `app.listen()`. This separation lets Supertest import the app without binding a port.
- Routes live in `src/routes/`, registered in `app.ts`.
- TypeScript compiled to CommonJS (`"module": "commonjs"` in tsconfig).

### Priority colors (sample-app frontend)

`TaskItem.tsx` uses WCAG 2.1 AA-compliant colors for priority badges (≥4.5:1 on white at 11px bold):

```typescript
const PRIORITY_COLORS = { high: '#b91c1c', medium: '#92400e', low: '#15803d' }
```

Do **not** revert to the brighter Tailwind defaults (`#ef4444`, `#f59e0b`, `#22c55e`) — they fail axe-core's `color-contrast` rule at small font sizes and will break the accessibility test suite.

Similarly, muted/completed text uses `#6b7280` (not `#9ca3af`). If you change any color in the sample-app frontend, run `pnpm --filter tests-accessibility run test` to verify it still passes, then update snapshots with `pnpm --filter tests-snapshot run test -- -u`.

### Task Store (sample-app backend)

`apps/sample-app/backend/src/store/tasks.store.ts` exports:
- `getTasks()`, `getTask(id)`, `createTask(data)`, `updateTask(id, data)`, `deleteTask(id)` — CRUD
- `reset()` — clears all tasks; called in test `beforeEach`/`afterEach` to isolate state
- `seed(task)` — inserts a pre-built task; used by Pact provider state handlers

Tests must call `reset()` before each test. Never share state between tests.

### Dashboard Backend — `__dirname` depth

`apps/dashboard/backend/src/routes/suites.ts` resolves the monorepo root like this:

```typescript
const monoRoot = path.resolve(__dirname, '../../../../..')
```

`__dirname` is `apps/dashboard/backend/src/routes` in dev (tsx) and `apps/dashboard/backend/dist/routes` compiled — **both are 5 levels deep**. If you change the file's location you must update this count.

### Dashboard Backend — spawning test commands

Commands are spawned with `shell: true` so the OS resolves `pnpm` via the shell's PATH:

```typescript
const child = spawn(suite.command, { cwd, shell: true, env: { ...process.env, FORCE_COLOR: '0' } })
```

Commands come from the static `suites.config.ts` file — no user input — so `shell: true` is safe here.

### Frontend (both apps)

- React + Vite + TypeScript
- `"moduleResolution": "bundler"` in tsconfig (Vite-native, not `node16`)
- Named exports only, no default exports
- Functional components + hooks

### Import paths in test packages

Test packages at `packages/tests/<suite>/src/` import backend source directly:

```typescript
import { app } from '../../../../apps/sample-app/backend/src/app'
import { reset } from '../../../../apps/sample-app/backend/src/store/tasks.store'
```

This is intentional — integration and security tests run against the real app code without a running server.

### E2E tests — Playwright locator pitfalls

The sample-app page has two `<select>` elements: one in `TaskForm` (`aria-label="Priority"`) and one in `FilterBar` (`aria-label="Filter by priority"`). Playwright's `getByLabel` does **substring** matching, so `getByLabel('Priority')` matches both and triggers a strict mode violation. Always use `{ exact: true }`:

```typescript
await page.getByLabel('Priority', { exact: true }).selectOption('high')
```

Similarly, `getByText(/high/i)` matches `<option>High</option>` in both selects. Use `getByText('high', { exact: true })` to target only the task item's lowercase badge.

**Controlled React checkboxes:** The app uses controlled `<input type="checkbox">` whose `checked` prop updates only after a successful API round-trip. Playwright's `.check()` validates the DOM flipped synchronously and will fail. Use `.click()` instead, then assert the visual result:

```typescript
await page.getByLabel(/Mark "..." as complete/i).click()
await expect(page.getByText('...')).toHaveCSS('text-decoration-line', 'line-through')
```

**Async state before filtering:** Always wait for the toggle to be visually confirmed (line-through) before selecting a filter option. If you filter immediately after clicking a checkbox, the PATCH hasn't persisted yet and the GET returns stale data.

### Pact contract tests

- Consumer (`consumer.test.ts`) uses `PactV3` + `MatchersV3` — import matchers from the top-level object, not internal paths:
  ```typescript
  const { like, eachLike } = MatchersV3
  ```
- Provider (`provider.test.ts`) starts the sample-app on an ephemeral port (`server.listen(0)`) and reads pacts from `./pacts/`.
- State handlers must seed data for every state declared in consumer interactions. `eachLike` requires at least one item in the provider response.
- Run consumer first, then provider: consumer writes the pact file that provider verifies.

### Playwright setup

E2E and accessibility tests require browser binaries (installed once):

```bash
pnpm --filter tests-e2e run install:browsers
```

Browsers are cached at `~/Library/Caches/ms-playwright` and shared between suites.

### k6 performance tests

k6 is a **standalone binary** — it is not an npm package and not invoked via Node.js. The `package.json` script shells out to `k6 run`. If k6 is not installed:

```bash
brew install k6
```

## TypeScript Config Patterns

| Location | `module` | `moduleResolution` | Notes |
|----------|----------|--------------------|-------|
| Backend packages | `commonjs` | `node` | Express/Node |
| Vite frontend | `ESNext` | `bundler` | Vite-native |
| Test packages | `commonjs` | `node` | Vitest/Node |
| Playwright tests | `commonjs` | `node` | Playwright CLI |

## What NOT to Change

- `SHOW_FAILURES` blocks in every test suite — teaching content, not dead code
- `reset()` / `seed()` exports on the task store — required by integration, security, and contract tests
- `app.ts` / `index.ts` separation — required for Supertest import without port binding
- `shell: true` on the dashboard spawn — required for PATH resolution of `pnpm`
- `__dirname` depth (5 levels) in `suites.ts` — validated against both dev and compiled output paths
- Traffic light dots, `▶ Run` button, and terminal styling in `LiveDashboard.tsx` — intentional demo aesthetics
- `aria-label` and `aria-current` on Walkthrough navigation buttons — the app teaches accessibility; it must pass its own axe scans
