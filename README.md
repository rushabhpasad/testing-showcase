# testing-showcase

A teaching and presentation tool that demonstrates **8 types of automated testing** across a realistic full-stack monorepo. Each test suite is self-contained, runnable in isolation, and written to highlight both the happy path and intentional failure modes.

## Architecture

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

## Getting Started

```bash
# Install all dependencies
pnpm install

# Start all four servers concurrently
pnpm dev
```

| App | URL |
|-----|-----|
| Sample App (frontend) | http://localhost:5173 |
| Sample App (backend API) | http://localhost:3001 |
| Dashboard (frontend) | http://localhost:5174 |
| Dashboard (backend API) | http://localhost:3002 |

## Test Suites

| Suite | Tool | Command | Notes |
|-------|------|---------|-------|
| Unit | Vitest | `pnpm --filter tests-unit run test` | No servers needed |
| Integration | Vitest | `pnpm --filter tests-integration run test` | No servers needed |
| Contract (consumer) | Vitest + Pact | `pnpm --filter tests-contract run test` | No servers needed |
| Contract (provider) | Vitest + Pact | `pnpm --filter tests-contract run test:provider` | No servers needed |
| Snapshot | Vitest | `pnpm --filter tests-snapshot run test` | No servers needed |
| Security | Vitest | `pnpm --filter tests-security run test` | No servers needed |
| E2E | Playwright | `pnpm --filter tests-e2e run test` | Requires live servers (`pnpm dev`) |
| Accessibility | Playwright + axe | `pnpm --filter tests-accessibility run test` | Requires live servers (`pnpm dev`) |
| Performance | k6 | `pnpm --filter tests-performance run test` | Requires live servers (`pnpm dev`) |

### Run all offline suites at once

```bash
pnpm test:all
```

> Note: `pnpm test:all` runs every package under `packages/tests/*`. E2E, accessibility, and performance tests will skip or fail gracefully without live servers — start `pnpm dev` first if you want those to run.

### Run a specific suite

```bash
pnpm --filter tests-unit run test
pnpm --filter tests-integration run test
pnpm --filter tests-contract run test
pnpm --filter tests-security run test
```

## Seeing Failures (Demo Mode)

Each suite supports a `SHOW_FAILURES` flag that intentionally trips failing assertions — useful for live demos.

```bash
SHOW_FAILURES=true pnpm --filter tests-unit run test
SHOW_FAILURES=true pnpm --filter tests-integration run test
# etc.
```

## First-Time Playwright Setup

E2E and accessibility tests require Playwright browser binaries. Install once:

```bash
pnpm --filter tests-e2e run install:browsers
```

Browsers are cached globally (`~/Library/Caches/ms-playwright`) and shared between suites.

## First-Time k6 Setup

The performance suite requires the [k6](https://k6.io) binary, which is not bundled as an npm package. Install once:

```bash
brew install k6      # macOS
```

For other platforms see https://grafana.com/docs/k6/latest/set-up/install-k6/
