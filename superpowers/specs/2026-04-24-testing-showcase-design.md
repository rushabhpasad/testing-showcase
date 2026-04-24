# Testing Showcase — Design Spec

**Date:** 2026-04-24  
**Audience:** Teaching / presentation material (teams, students, colleagues)  
**Status:** Approved

---

## Overview

A monorepo project that demonstrates all major software testing types through:
1. A real full-stack sample app (the subject under test)
2. An interactive dashboard UI for teaching and exploration

---

## Repository Structure

```
testing-showcase/
  apps/
    sample-app/
      backend/         ← Express API (port 3001)
      frontend/        ← React/Vite app (port 5173)
    dashboard/
      backend/         ← Test runner API (port 3002)
      frontend/        ← Teaching UI (port 5174)
  packages/
    tests/
      unit/
      integration/
      e2e/
      contract/
      snapshot/
      performance/
      security/
      accessibility/
  package.json         ← pnpm workspace root
```

**Monorepo tooling:** pnpm workspaces (no Nx/Turborepo — intentionally simple).

---

## Sample App — Task Manager

A minimal task management app with just enough surface area to support all 8 testing types without overwhelming learners.

### Backend (`apps/sample-app/backend`)
- **Runtime:** Node.js + Express + TypeScript
- **Storage:** In-memory (no database setup friction)
- **Endpoints:**
  - `GET /tasks` — list all tasks (supports `?status=` and `?priority=` filters)
  - `POST /tasks` — create a task `{ title, priority }`
  - `PATCH /tasks/:id` — update title, priority, or completed status
  - `DELETE /tasks/:id` — remove a task
- **Utility functions** (pure, testable):
  - `sortByPriority(tasks)` — sorts by high/medium/low
  - `filterByStatus(tasks, status)` — filters completed/active
  - `validateTask(input)` — validates title length, allowed priorities

### Frontend (`apps/sample-app/frontend`)
- **Stack:** React + TypeScript + Vite
- **Components:**
  - `<TaskList />` — renders the full list
  - `<TaskItem />` — single task row with checkbox and delete
  - `<TaskForm />` — input + priority select + submit
  - `<FilterBar />` — status and priority filter controls
- **Data fetching:** plain `fetch` calls to the backend (no external state library)

---

## Testing Types & Tooling

Each suite lives in `packages/tests/<type>/` with its own `README.md` covering: what this type tests, when to use it, trade-offs, and how to run it.

**Pass + Fail examples:** Every suite includes both passing tests (happy path + edge cases) and intentional failure demonstrations. Failure tests are gated behind a `SHOW_FAILURES=true` environment variable — they are skipped by default but run and fail visibly when the flag is set. This lets learners toggle failures on and see real error output for each test type (e.g. failed assertion in Vitest, broken selector in Playwright, contract mismatch in Pact, threshold breach in k6). The dashboard "Run" button exposes a "Show Failures" toggle that sets this flag when triggering a run.

| Type | Tool | Target | Covers |
|------|------|--------|--------|
| **Unit** | Vitest | Backend utils + React components | `sortByPriority()`, `filterByStatus()`, `validateTask()`, `<TaskItem />` render logic |
| **Integration** | Vitest + Supertest | Express API routes | `POST /tasks` creates correctly, `PATCH` updates state, `DELETE` removes, error handling |
| **E2E** | Playwright | Full browser flow | User creates a task, marks it complete, deletes it — end-to-end in a real browser |
| **Contract** | Pact (consumer-driven) | Frontend ↔ Backend API shape | Frontend's expectations of request/response shapes are verified against the real API |
| **Snapshot** | Vitest + React Testing Library | React components | `<TaskList />`, `<TaskForm />`, `<FilterBar />` — catch unintended UI regressions |
| **Performance** | k6 | Backend API | Load test `GET /tasks` at 50/100/200 VUs; assert p95 < 200ms threshold |
| **Security** | OWASP ZAP CLI + custom checks | Backend API | Missing security headers, CORS misconfiguration, basic injection probes — *ZAP requires separate Java binary install; documented in suite README* |
| **Accessibility** | axe-core + Playwright | Frontend | WCAG 2.1 AA violations scanned on all major views |

---

## Interactive Dashboard

### Frontend (`apps/dashboard/frontend`)
- **Stack:** React + TypeScript + Vite (port 5174)
- **Syntax highlighting:** Shiki (zero-runtime, accurate)

**Four views unified in one layout:**

#### 1. Testing Map (landing)
- SVG **testing trophy** diagram (Kent C. Dodds model: static at base, unit, integration widest, E2E at top)
- Each layer is clickable → navigates to that test type's detail view
- Badges show pass/fail counts from last run

#### 2. Test Explorer (per-type detail view)
- Split-pane layout
- **Left pane:** syntax-highlighted test code (read-only)
- **Right pane:** explanation (what it tests, when to use it, trade-offs) + live output terminal when a run is in progress

#### 3. Guided Walkthrough
- Step-by-step flow through all 8 types in recommended order:
  `Unit → Integration → Contract → Snapshot → E2E → Accessibility → Security → Performance`
- Each step shows: map position, test code, explanation, and run button
- Progress tracked in local component state (no persistence needed)

#### 4. Dashboard (all types at a glance)
- Grid of 8 cards — one per test type
- Each card shows: status (not run / running / pass / fail), last run duration, and a "Run" button
- "Run All" button at the top triggers all suites sequentially and streams results
- Status indicators update in real time via SSE

### Backend (`apps/dashboard/backend`)
- **Runtime:** Node.js + Express + TypeScript (port 3002)
- **Endpoints:**
  - `POST /run/:testType` — spawns test process, stores result; returns `{ runId }`
  - `GET /run/:testType/stream` — SSE endpoint; streams stdout of the active run (SSE must be GET)
  - `GET /results` — returns last run results for all types (in-memory store)
- **Test execution:** uses `child_process.spawn` to run `pnpm test` in the target package, captures stdout/stderr, emits SSE events
- **CORS:** allows dashboard frontend origin

---

## Data Flow

```
Dashboard UI
  → POST /run/:testType          (trigger run, get runId)
    → spawn child_process: pnpm vitest run / playwright test / k6 run / etc.
  → GET /run/:testType/stream    (SSE — stream stdout to UI terminal)
  → GET /results                 (poll or refresh for cached last-run summary)
```

---

## Development Setup

```bash
pnpm install          # install all workspace deps
pnpm dev              # start all 4 servers concurrently
pnpm test:all         # run all test suites
```

Each app has its own `dev` and `build` scripts. Root `package.json` uses `concurrently` to run all four servers in one terminal.

---

## Success Criteria

- All 8 test suites run and produce meaningful pass/fail output
- Each suite has a `README.md` that a junior developer can follow independently
- The dashboard loads, shows the testing map, and can trigger at least unit + integration + E2E runs with live output
- The guided walkthrough covers all 8 types in order without dead ends
- The project can be cloned and running with `pnpm install && pnpm dev` in under 5 minutes

---

## Out of Scope

- Authentication / user accounts
- Persistent database (intentional — removes setup friction)
- CI/CD pipeline configuration
- Deployment
