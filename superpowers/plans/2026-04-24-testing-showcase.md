# Testing Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack monorepo demonstrating all 8 software testing types through a Task Manager sample app and an interactive teaching dashboard.

**Architecture:** pnpm workspace monorepo with two apps (sample-app, dashboard) and 8 test packages. The sample app (React + Express) is the subject under test; the dashboard (React + Express) drives test execution and explains each type interactively. All test suites support `SHOW_FAILURES=true` to expose intentional failure examples.

**Tech Stack:** Node.js, Express, TypeScript, React, Vite, Vitest, Supertest, Playwright, Pact, k6, OWASP ZAP (optional binary), axe-core, concurrently, pnpm

---

## File Map

```
testing-showcase/
  package.json                                    ← workspace root + dev/test:all scripts
  pnpm-workspace.yaml
  tsconfig.base.json
  .gitignore

  apps/
    sample-app/
      backend/
        package.json
        tsconfig.json
        src/
          types.ts                                ← Task, Priority, ValidationError interfaces
          store/tasks.store.ts                    ← in-memory CRUD + reset()
          utils/sort.ts                           ← sortByPriority()
          utils/filter.ts                         ← filterByStatus(), filterByPriority()
          utils/validate.ts                       ← validateTask()
          routes/tasks.ts                         ← Express router for /tasks
          app.ts                                  ← Express app (no listen — importable by tests)
          index.ts                                ← starts server on port 3001
      frontend/
        package.json
        tsconfig.json
        vite.config.ts
        index.html
        src/
          types.ts                                ← Task, Priority (shared with tests)
          api/tasks.ts                            ← fetch wrappers: getTasks, createTask, etc.
          components/
            TaskItem.tsx
            TaskForm.tsx
            FilterBar.tsx
            TaskList.tsx
          App.tsx
          main.tsx

    dashboard/
      backend/
        package.json
        tsconfig.json
        src/
          types.ts                                ← TestType, RunStatus, RunResult
          runner/store.ts                         ← in-memory results map + get/set/getAll
          runner/spawn.ts                         ← child_process.spawn + SSE listeners
          routes/run.ts                           ← POST /run/:type, GET /run/:type/stream
          routes/results.ts                       ← GET /results
          app.ts
          index.ts                                ← port 3002
      frontend/
        package.json
        tsconfig.json
        vite.config.ts
        index.html
        src/
          types.ts                                ← mirrors dashboard backend types
          data/testTypes.ts                       ← metadata + code snippets for all 8 types
          hooks/useSSE.ts                         ← SSE subscription hook
          components/
            TestingTrophy.tsx                     ← SVG trophy, clickable layers
            TestCard.tsx                          ← single card in dashboard grid
            Terminal.tsx                          ← dark output pane, auto-scroll
            TestExplorer.tsx                      ← split-pane: code left, explain+terminal right
            GuidedWalkthrough.tsx                 ← step-through all 8 types
            Dashboard.tsx                         ← 8-card grid + Run All
          App.tsx                                 ← nav + view routing (trophy/walkthrough/dashboard)
          main.tsx

  packages/
    tests/
      unit/
        package.json
        vitest.config.ts
        src/
          setup.ts                                ← @testing-library/jest-dom
          sort.test.ts
          filter.test.ts
          validate.test.ts
          TaskItem.test.tsx
        README.md
      integration/
        package.json
        vitest.config.ts
        src/tasks.api.test.ts
        README.md
      e2e/
        package.json
        playwright.config.ts
        tests/tasks.spec.ts
        README.md
      contract/
        package.json
        vitest.config.ts
        src/
          consumer/tasks.pact.ts
          provider/tasks.verify.ts
        pacts/                                    ← generated, committed to git
        README.md
      snapshot/
        package.json
        vitest.config.ts
        src/
          setup.ts
          TaskList.snap.test.tsx
          TaskForm.snap.test.tsx
        README.md
      performance/
        package.json
        src/load-test.js                          ← k6 script (plain JS, not TS)
        README.md
      security/
        package.json
        vitest.config.ts
        src/
          headers.test.ts
          cors.test.ts
          injection.test.ts
          zap-scan.sh
        README.md
      accessibility/
        package.json
        playwright.config.ts
        src/a11y.spec.ts
        README.md
```

---

## Task 1: Monorepo Scaffolding

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.gitignore`

- [ ] **Step 1: Initialize git repo**

```bash
cd /Users/rpasad/data
git init testing-showcase
cd testing-showcase
```

- [ ] **Step 2: Create root `package.json`**

```json
{
  "name": "testing-showcase",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev": "concurrently -n \"sb-api,sb-ui,dash-api,dash-ui\" -c \"blue,cyan,green,yellow\" \"pnpm --filter sample-app-backend dev\" \"pnpm --filter sample-app-frontend dev\" \"pnpm --filter dashboard-backend dev\" \"pnpm --filter dashboard-frontend dev\"",
    "test:all": "pnpm --filter tests-unit run test && pnpm --filter tests-integration run test && pnpm --filter tests-snapshot run test && pnpm --filter tests-security run test"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

- [ ] **Step 3: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - 'apps/sample-app/backend'
  - 'apps/sample-app/frontend'
  - 'apps/dashboard/backend'
  - 'apps/dashboard/frontend'
  - 'packages/tests/*'
```

- [ ] **Step 4: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- [ ] **Step 5: Create `.gitignore`**

```
node_modules/
dist/
.env
.env.local
*.log
test-results/
playwright-report/
/tmp/
```

- [ ] **Step 6: Create directory skeleton**

```bash
mkdir -p apps/sample-app/backend/src/{store,utils,routes}
mkdir -p apps/sample-app/frontend/src/{api,components}
mkdir -p apps/dashboard/backend/src/{runner,routes}
mkdir -p apps/dashboard/frontend/src/{data,hooks,components}
mkdir -p packages/tests/{unit,integration,e2e,contract,snapshot,performance,security,accessibility}/src
mkdir -p packages/tests/contract/{src/consumer,src/provider,pacts}
mkdir -p packages/tests/e2e/tests
```

- [ ] **Step 7: Install root deps**

```bash
pnpm install
```

Expected: `node_modules/.pnpm` created, no errors.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: initialize monorepo with pnpm workspaces"
```

---

## Task 2: Sample App Backend

**Files:**
- Create: `apps/sample-app/backend/package.json`
- Create: `apps/sample-app/backend/tsconfig.json`
- Create: `apps/sample-app/backend/src/types.ts`
- Create: `apps/sample-app/backend/src/store/tasks.store.ts`
- Create: `apps/sample-app/backend/src/utils/sort.ts`
- Create: `apps/sample-app/backend/src/utils/filter.ts`
- Create: `apps/sample-app/backend/src/utils/validate.ts`
- Create: `apps/sample-app/backend/src/routes/tasks.ts`
- Create: `apps/sample-app/backend/src/app.ts`
- Create: `apps/sample-app/backend/src/index.ts`

- [ ] **Step 1: Create `apps/sample-app/backend/package.json`**

```json
{
  "name": "sample-app-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "tsx": "^4.6.2",
    "typescript": "^5.3.3"
  }
}
```

- [ ] **Step 2: Create `apps/sample-app/backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `apps/sample-app/backend/src/types.ts`**

```typescript
export type Priority = 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: string
  priority: Priority
  completed: boolean
  createdAt: string
}

export interface ValidationError {
  field: string
  message: string
}
```

- [ ] **Step 4: Create `apps/sample-app/backend/src/store/tasks.store.ts`**

```typescript
import { Task, Priority } from '../types'
import { randomUUID } from 'crypto'

let tasks: Task[] = []

export const getAll = (): Task[] => [...tasks]

export const getById = (id: string): Task | undefined =>
  tasks.find(t => t.id === id)

export const create = (title: string, priority: Priority = 'medium'): Task => {
  const task: Task = {
    id: randomUUID(),
    title,
    priority,
    completed: false,
    createdAt: new Date().toISOString(),
  }
  tasks.push(task)
  return task
}

export const update = (
  id: string,
  updates: Partial<Pick<Task, 'title' | 'priority' | 'completed'>>
): Task | null => {
  const idx = tasks.findIndex(t => t.id === id)
  if (idx === -1) return null
  tasks[idx] = { ...tasks[idx], ...updates }
  return tasks[idx]
}

export const remove = (id: string): boolean => {
  const before = tasks.length
  tasks = tasks.filter(t => t.id !== id)
  return tasks.length < before
}

export const reset = (): void => {
  tasks = []
}
```

- [ ] **Step 5: Create `apps/sample-app/backend/src/utils/sort.ts`**

```typescript
import { Task } from '../types'

const PRIORITY_ORDER: Record<Task['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
}

export const sortByPriority = (tasks: Task[]): Task[] =>
  [...tasks].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
```

- [ ] **Step 6: Create `apps/sample-app/backend/src/utils/filter.ts`**

```typescript
import { Task } from '../types'

export const filterByStatus = (
  tasks: Task[],
  status: 'active' | 'completed' | 'all'
): Task[] => {
  if (status === 'all') return tasks
  return tasks.filter(t => (status === 'completed') === t.completed)
}

export const filterByPriority = (
  tasks: Task[],
  priority: Task['priority'] | 'all'
): Task[] => {
  if (priority === 'all') return tasks
  return tasks.filter(t => t.priority === priority)
}
```

- [ ] **Step 7: Create `apps/sample-app/backend/src/utils/validate.ts`**

```typescript
import { ValidationError } from '../types'

export const validateTask = (input: unknown): ValidationError[] => {
  const errors: ValidationError[] = []
  if (typeof input !== 'object' || input === null) {
    return [{ field: 'body', message: 'Request body must be an object' }]
  }
  const { title, priority } = input as Record<string, unknown>
  if (typeof title !== 'string' || title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title is required' })
  }
  if (typeof title === 'string' && title.length > 200) {
    errors.push({ field: 'title', message: 'Title must be 200 characters or fewer' })
  }
  if (priority !== undefined && !['high', 'medium', 'low'].includes(priority as string)) {
    errors.push({ field: 'priority', message: 'Priority must be high, medium, or low' })
  }
  return errors
}
```

- [ ] **Step 8: Create `apps/sample-app/backend/src/routes/tasks.ts`**

```typescript
import { Router } from 'express'
import * as store from '../store/tasks.store'
import { sortByPriority } from '../utils/sort'
import { filterByStatus, filterByPriority } from '../utils/filter'
import { validateTask } from '../utils/validate'

export const tasksRouter = Router()

tasksRouter.get('/', (req, res) => {
  let tasks = store.getAll()
  const { status, priority } = req.query
  if (status && status !== 'all') {
    tasks = filterByStatus(tasks, status as 'active' | 'completed')
  }
  if (priority && priority !== 'all') {
    tasks = filterByPriority(tasks, priority as 'high' | 'medium' | 'low')
  }
  res.json(sortByPriority(tasks))
})

tasksRouter.post('/', (req, res) => {
  const errors = validateTask(req.body)
  if (errors.length > 0) return res.status(400).json({ errors })
  const { title, priority } = req.body
  const task = store.create(title, priority)
  res.status(201).json(task)
})

tasksRouter.patch('/:id', (req, res) => {
  const task = store.update(req.params.id, req.body)
  if (!task) return res.status(404).json({ error: 'Task not found' })
  res.json(task)
})

tasksRouter.delete('/:id', (req, res) => {
  const deleted = store.remove(req.params.id)
  if (!deleted) return res.status(404).json({ error: 'Task not found' })
  res.status(204).send()
})
```

- [ ] **Step 9: Create `apps/sample-app/backend/src/app.ts`**

```typescript
import express from 'express'
import cors from 'cors'
import { tasksRouter } from './routes/tasks'

export const app = express()

app.disable('x-powered-by')
app.use(cors())
app.use(express.json())
app.use('/tasks', tasksRouter)
app.get('/health', (_req, res) => res.json({ status: 'ok' }))
```

- [ ] **Step 10: Create `apps/sample-app/backend/src/index.ts`**

```typescript
import { app } from './app'

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () =>
  console.log(`Sample app API running on http://localhost:${PORT}`)
)
```

- [ ] **Step 11: Install deps and verify it starts**

```bash
cd apps/sample-app/backend
pnpm install
pnpm dev
```

Expected: `Sample app API running on http://localhost:3001`
Test with: `curl http://localhost:3001/health` → `{"status":"ok"}`
Test with: `curl -X POST http://localhost:3001/tasks -H 'Content-Type: application/json' -d '{"title":"Test","priority":"high"}'` → `{"id":"...","title":"Test",...}`

Stop the server (Ctrl+C).

- [ ] **Step 12: Commit**

```bash
cd ../../..  # back to repo root
git add apps/sample-app/backend
git commit -m "feat: add sample app backend (Express + in-memory task store)"
```

---

## Task 3: Sample App Frontend

**Files:**
- Create: `apps/sample-app/frontend/package.json`
- Create: `apps/sample-app/frontend/tsconfig.json`
- Create: `apps/sample-app/frontend/vite.config.ts`
- Create: `apps/sample-app/frontend/index.html`
- Create: `apps/sample-app/frontend/src/types.ts`
- Create: `apps/sample-app/frontend/src/api/tasks.ts`
- Create: `apps/sample-app/frontend/src/components/TaskItem.tsx`
- Create: `apps/sample-app/frontend/src/components/TaskForm.tsx`
- Create: `apps/sample-app/frontend/src/components/FilterBar.tsx`
- Create: `apps/sample-app/frontend/src/components/TaskList.tsx`
- Create: `apps/sample-app/frontend/src/App.tsx`
- Create: `apps/sample-app/frontend/src/main.tsx`

- [ ] **Step 1: Create `apps/sample-app/frontend/package.json`**

```json
{
  "name": "sample-app-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}
```

- [ ] **Step 2: Create `apps/sample-app/frontend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `apps/sample-app/frontend/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
})
```

- [ ] **Step 4: Create `apps/sample-app/frontend/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Task Manager</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `apps/sample-app/frontend/src/types.ts`**

```typescript
export type Priority = 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: string
  priority: Priority
  completed: boolean
  createdAt: string
}
```

- [ ] **Step 6: Create `apps/sample-app/frontend/src/api/tasks.ts`**

```typescript
import { Task, Priority } from '../types'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export const getTasks = async (params?: {
  status?: string
  priority?: string
}): Promise<Task[]> => {
  const url = new URL(`${BASE}/tasks`)
  if (params?.status && params.status !== 'all') url.searchParams.set('status', params.status)
  if (params?.priority && params.priority !== 'all') url.searchParams.set('priority', params.priority)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Failed to fetch tasks')
  return res.json()
}

export const createTask = async (
  title: string,
  priority: Priority = 'medium'
): Promise<Task> => {
  const res = await fetch(`${BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, priority }),
  })
  if (!res.ok) throw new Error('Failed to create task')
  return res.json()
}

export const updateTask = async (
  id: string,
  updates: Partial<Pick<Task, 'title' | 'priority' | 'completed'>>
): Promise<Task> => {
  const res = await fetch(`${BASE}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error('Failed to update task')
  return res.json()
}

export const deleteTask = async (id: string): Promise<void> => {
  const res = await fetch(`${BASE}/tasks/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete task')
}
```

- [ ] **Step 7: Create `apps/sample-app/frontend/src/components/TaskItem.tsx`**

```tsx
import { Task } from '../types'

interface Props {
  task: Task
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
}

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
}

export function TaskItem({ task, onToggle, onDelete }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 0',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id, !task.completed)}
        aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
      />
      <span
        style={{
          flex: 1,
          textDecoration: task.completed ? 'line-through' : 'none',
          color: task.completed ? '#9ca3af' : '#111827',
        }}
      >
        {task.title}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: PRIORITY_COLORS[task.priority],
          textTransform: 'uppercase',
        }}
      >
        {task.priority}
      </span>
      <button
        onClick={() => onDelete(task.id)}
        aria-label={`Delete "${task.title}"`}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 16 }}
      >
        ✕
      </button>
    </div>
  )
}
```

- [ ] **Step 8: Create `apps/sample-app/frontend/src/components/TaskForm.tsx`**

```tsx
import { useState } from 'react'
import { Priority } from '../types'

interface Props {
  onSubmit: (title: string, priority: Priority) => void
}

export function TaskForm({ onSubmit }: Props) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit(title.trim(), priority)
    setTitle('')
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="New task..."
        aria-label="Task title"
        style={{ flex: 1, padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 4 }}
      />
      <select
        value={priority}
        onChange={e => setPriority(e.target.value as Priority)}
        aria-label="Priority"
        style={{ padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 4 }}
      >
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <button
        type="submit"
        style={{ padding: '6px 16px', background: '#111827', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
      >
        Add
      </button>
    </form>
  )
}
```

- [ ] **Step 9: Create `apps/sample-app/frontend/src/components/FilterBar.tsx`**

```tsx
interface Props {
  status: string
  priority: string
  onStatusChange: (s: string) => void
  onPriorityChange: (p: string) => void
}

export function FilterBar({ status, priority, onStatusChange, onPriorityChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }} role="group" aria-label="Filters">
      <select
        value={status}
        onChange={e => onStatusChange(e.target.value)}
        aria-label="Filter by status"
        style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4 }}
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
      </select>
      <select
        value={priority}
        onChange={e => onPriorityChange(e.target.value)}
        aria-label="Filter by priority"
        style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4 }}
      >
        <option value="all">All Priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>
  )
}
```

- [ ] **Step 10: Create `apps/sample-app/frontend/src/components/TaskList.tsx`**

```tsx
import { Task } from '../types'
import { TaskItem } from './TaskItem'

interface Props {
  tasks: Task[]
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
}

export function TaskList({ tasks, onToggle, onDelete }: Props) {
  if (tasks.length === 0) {
    return <p style={{ color: '#9ca3af', textAlign: 'center' }}>No tasks yet. Add one above!</p>
  }
  return (
    <div role="list" aria-label="Tasks">
      {tasks.map(task => (
        <div role="listitem" key={task.id}>
          <TaskItem task={task} onToggle={onToggle} onDelete={onDelete} />
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 11: Create `apps/sample-app/frontend/src/App.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { Task, Priority } from './types'
import { getTasks, createTask, updateTask, deleteTask } from './api/tasks'
import { TaskForm } from './components/TaskForm'
import { FilterBar } from './components/FilterBar'
import { TaskList } from './components/TaskList'

export function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')

  const load = () => getTasks({ status, priority }).then(setTasks).catch(console.error)

  useEffect(() => { load() }, [status, priority])

  const handleCreate = async (title: string, prio: Priority) => {
    await createTask(title, prio)
    load()
  }

  const handleToggle = async (id: string, completed: boolean) => {
    await updateTask(id, { completed })
    load()
  }

  const handleDelete = async (id: string) => {
    await deleteTask(id)
    load()
  }

  return (
    <main style={{ maxWidth: 600, margin: '40px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: 24 }}>Task Manager</h1>
      <TaskForm onSubmit={handleCreate} />
      <FilterBar status={status} priority={priority} onStatusChange={setStatus} onPriorityChange={setPriority} />
      <TaskList tasks={tasks} onToggle={handleToggle} onDelete={handleDelete} />
    </main>
  )
}
```

- [ ] **Step 12: Create `apps/sample-app/frontend/src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 13: Install deps and verify it runs**

```bash
cd apps/sample-app/frontend
pnpm install
# Start backend first in another terminal: cd ../backend && pnpm dev
pnpm dev
```

Expected: Vite dev server on `http://localhost:5173`. Open in browser — app should load, adding tasks should work.

- [ ] **Step 14: Commit**

```bash
cd ../../..
git add apps/sample-app/frontend
git commit -m "feat: add sample app frontend (React + Vite task manager)"
```

---

## Task 4: Unit Test Suite

**Files:**
- Create: `packages/tests/unit/package.json`
- Create: `packages/tests/unit/vitest.config.ts`
- Create: `packages/tests/unit/src/setup.ts`
- Create: `packages/tests/unit/src/sort.test.ts`
- Create: `packages/tests/unit/src/filter.test.ts`
- Create: `packages/tests/unit/src/validate.test.ts`
- Create: `packages/tests/unit/src/TaskItem.test.tsx`
- Create: `packages/tests/unit/README.md`

- [ ] **Step 1: Create `packages/tests/unit/package.json`**

```json
{
  "name": "tests-unit",
  "version": "1.0.0",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:failures": "SHOW_FAILURES=true vitest run"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@vitejs/plugin-react": "^4.2.1",
    "jsdom": "^23.0.1",
    "typescript": "^5.3.3",
    "vitest": "^1.0.4"
  }
}
```

- [ ] **Step 2: Create `packages/tests/unit/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setup.ts'],
  },
})
```

- [ ] **Step 3: Create `packages/tests/unit/src/setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Create `packages/tests/unit/src/sort.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { sortByPriority } from '../../../apps/sample-app/backend/src/utils/sort'
import type { Task } from '../../../apps/sample-app/backend/src/types'

const make = (id: string, priority: Task['priority']): Task => ({
  id, title: `Task ${id}`, priority, completed: false, createdAt: '2024-01-01T00:00:00.000Z',
})

describe('sortByPriority', () => {
  it('sorts high before medium before low', () => {
    const result = sortByPriority([make('1', 'low'), make('2', 'high'), make('3', 'medium')])
    expect(result.map(t => t.priority)).toEqual(['high', 'medium', 'low'])
  })

  it('returns a new array without mutating the input', () => {
    const input = [make('1', 'low'), make('2', 'high')]
    const result = sortByPriority(input)
    expect(result).not.toBe(input)
    expect(input[0].priority).toBe('low') // input unchanged
  })

  it('handles an empty array', () => {
    expect(sortByPriority([])).toEqual([])
  })

  it('preserves order for equal priorities', () => {
    const input = [make('1', 'medium'), make('2', 'medium')]
    expect(sortByPriority(input).map(t => t.id)).toEqual(['1', '2'])
  })
})

const showFailures = process.env.SHOW_FAILURES === 'true'

describe.skipIf(!showFailures)('[FAILURE EXAMPLE] sortByPriority', () => {
  it('fails: asserts wrong sort order to show failure output', () => {
    const result = sortByPriority([make('1', 'low'), make('2', 'high')])
    // Wrong expectation — demonstrates what a failing unit test looks like
    expect(result.map(t => t.priority)).toEqual(['low', 'high'])
  })
})
```

- [ ] **Step 5: Create `packages/tests/unit/src/filter.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { filterByStatus, filterByPriority } from '../../../apps/sample-app/backend/src/utils/filter'
import type { Task } from '../../../apps/sample-app/backend/src/types'

const make = (id: string, priority: Task['priority'], completed = false): Task => ({
  id, title: `Task ${id}`, priority, completed, createdAt: '2024-01-01T00:00:00.000Z',
})

describe('filterByStatus', () => {
  const tasks = [make('1', 'high', false), make('2', 'medium', true), make('3', 'low', false)]

  it('returns all tasks for status=all', () => {
    expect(filterByStatus(tasks, 'all')).toHaveLength(3)
  })

  it('returns only incomplete tasks for status=active', () => {
    const result = filterByStatus(tasks, 'active')
    expect(result).toHaveLength(2)
    expect(result.every(t => !t.completed)).toBe(true)
  })

  it('returns only completed tasks for status=completed', () => {
    const result = filterByStatus(tasks, 'completed')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })
})

describe('filterByPriority', () => {
  const tasks = [make('1', 'high'), make('2', 'medium'), make('3', 'high')]

  it('returns all tasks for priority=all', () => {
    expect(filterByPriority(tasks, 'all')).toHaveLength(3)
  })

  it('filters to only the given priority', () => {
    expect(filterByPriority(tasks, 'high')).toHaveLength(2)
  })

  it('returns empty array when no tasks match', () => {
    expect(filterByPriority(tasks, 'low')).toHaveLength(0)
  })
})

const showFailures = process.env.SHOW_FAILURES === 'true'

describe.skipIf(!showFailures)('[FAILURE EXAMPLE] filterByStatus', () => {
  it('fails: wrong count — expects 99 active tasks', () => {
    const tasks = [make('1', 'high', false), make('2', 'medium', true)]
    expect(filterByStatus(tasks, 'active')).toHaveLength(99)
  })
})
```

- [ ] **Step 6: Create `packages/tests/unit/src/validate.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { validateTask } from '../../../apps/sample-app/backend/src/utils/validate'

describe('validateTask', () => {
  it('returns no errors for valid input with all fields', () => {
    expect(validateTask({ title: 'Buy milk', priority: 'high' })).toEqual([])
  })

  it('returns no errors when priority is omitted (optional field)', () => {
    expect(validateTask({ title: 'Buy milk' })).toEqual([])
  })

  it('returns error when title is missing', () => {
    const errors = validateTask({ priority: 'low' })
    expect(errors).toContainEqual(expect.objectContaining({ field: 'title' }))
  })

  it('returns error when title is an empty string', () => {
    const errors = validateTask({ title: '   ' })
    expect(errors).toContainEqual(expect.objectContaining({ field: 'title' }))
  })

  it('returns error when title exceeds 200 characters', () => {
    const errors = validateTask({ title: 'a'.repeat(201) })
    expect(errors).toContainEqual(expect.objectContaining({ field: 'title' }))
  })

  it('returns error for invalid priority value', () => {
    const errors = validateTask({ title: 'Test', priority: 'urgent' })
    expect(errors).toContainEqual(expect.objectContaining({ field: 'priority' }))
  })

  it('returns error when body is not an object', () => {
    const errors = validateTask('not-an-object')
    expect(errors).toContainEqual(expect.objectContaining({ field: 'body' }))
  })
})

const showFailures = process.env.SHOW_FAILURES === 'true'

describe.skipIf(!showFailures)('[FAILURE EXAMPLE] validateTask', () => {
  it('fails: expects error on valid input', () => {
    const errors = validateTask({ title: 'Valid task', priority: 'low' })
    expect(errors.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 7: Create `packages/tests/unit/src/TaskItem.test.tsx`**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TaskItem } from '../../../apps/sample-app/frontend/src/components/TaskItem'
import type { Task } from '../../../apps/sample-app/frontend/src/types'

const task: Task = {
  id: '1',
  title: 'Write tests',
  priority: 'high',
  completed: false,
  createdAt: '2024-01-01T00:00:00.000Z',
}

describe('TaskItem', () => {
  it('renders the task title', () => {
    render(<TaskItem task={task} onToggle={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Write tests')).toBeInTheDocument()
  })

  it('renders the priority label', () => {
    render(<TaskItem task={task} onToggle={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText(/high/i)).toBeInTheDocument()
  })

  it('calls onToggle with id and new completed state when checkbox clicked', () => {
    const onToggle = vi.fn()
    render(<TaskItem task={task} onToggle={onToggle} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('1', true)
  })

  it('calls onDelete with task id when delete button clicked', () => {
    const onDelete = vi.fn()
    render(<TaskItem task={task} onToggle={vi.fn()} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('applies line-through style when task is completed', () => {
    const completed = { ...task, completed: true }
    render(<TaskItem task={completed} onToggle={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Write tests')).toHaveStyle('text-decoration: line-through')
  })
})

const showFailures = process.env.SHOW_FAILURES === 'true'

describe.skipIf(!showFailures)('[FAILURE EXAMPLE] TaskItem', () => {
  it('fails: queries for text that does not exist in the DOM', () => {
    render(<TaskItem task={task} onToggle={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('This text does not exist')).toBeInTheDocument()
  })
})
```

- [ ] **Step 8: Create `packages/tests/unit/README.md`**

```markdown
# Unit Tests

**What:** Test individual functions and components in complete isolation — no network, no database.

**Tool:** Vitest + React Testing Library

**When to use:** For all pure utility functions and component rendering logic.

**Run passing tests:**
```bash
pnpm test
```

**Run with intentional failure examples:**
```bash
pnpm test:failures
# or: SHOW_FAILURES=true pnpm test
```

**What failures demonstrate:**
- Wrong assertion value → see Vitest diff output
- Querying for a DOM element that doesn't exist → see "`Unable to find element`" error

**Trade-offs:**
- ✅ Blazing fast (milliseconds per test)
- ✅ Easy to pinpoint failures — one function at a time
- ❌ Cannot catch bugs that only appear when units work together
```

- [ ] **Step 9: Install and run the suite**

```bash
cd packages/tests/unit
pnpm install
pnpm test
```

Expected output: All tests PASS (SHOW_FAILURES not set, failure examples skipped).

```bash
pnpm test:failures
```

Expected: Sort, filter, validate, and TaskItem failure tests all FAIL with meaningful diffs.

- [ ] **Step 10: Commit**

```bash
cd ../../..
git add packages/tests/unit
git commit -m "test: add unit test suite (Vitest + React Testing Library)"
```

---

## Task 5: Integration Test Suite

**Files:**
- Create: `packages/tests/integration/package.json`
- Create: `packages/tests/integration/vitest.config.ts`
- Create: `packages/tests/integration/src/tasks.api.test.ts`
- Create: `packages/tests/integration/README.md`

- [ ] **Step 1: Create `packages/tests/integration/package.json`**

```json
{
  "name": "tests-integration",
  "version": "1.0.0",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:failures": "SHOW_FAILURES=true vitest run"
  },
  "devDependencies": {
    "@types/supertest": "^6.0.2",
    "supertest": "^6.3.3",
    "typescript": "^5.3.3",
    "vitest": "^1.0.4"
  }
}
```

- [ ] **Step 2: Create `packages/tests/integration/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { environment: 'node' },
})
```

- [ ] **Step 3: Create `packages/tests/integration/src/tasks.api.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../../../apps/sample-app/backend/src/app'
import { reset } from '../../../apps/sample-app/backend/src/store/tasks.store'

beforeEach(() => reset())

describe('GET /tasks', () => {
  it('returns an empty array when no tasks exist', async () => {
    const res = await request(app).get('/tasks')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns tasks sorted by priority (high first)', async () => {
    await request(app).post('/tasks').send({ title: 'Low', priority: 'low' })
    await request(app).post('/tasks').send({ title: 'High', priority: 'high' })
    const res = await request(app).get('/tasks')
    expect(res.body[0].priority).toBe('high')
    expect(res.body[1].priority).toBe('low')
  })

  it('filters by status=active (excludes completed tasks)', async () => {
    const { body: t1 } = await request(app).post('/tasks').send({ title: 'Active', priority: 'medium' })
    const { body: t2 } = await request(app).post('/tasks').send({ title: 'Done', priority: 'medium' })
    await request(app).patch(`/tasks/${t2.id}`).send({ completed: true })
    const res = await request(app).get('/tasks?status=active')
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBe(t1.id)
  })

  it('filters by status=completed', async () => {
    const { body: task } = await request(app).post('/tasks').send({ title: 'Done', priority: 'low' })
    await request(app).patch(`/tasks/${task.id}`).send({ completed: true })
    const res = await request(app).get('/tasks?status=completed')
    expect(res.body).toHaveLength(1)
    expect(res.body[0].completed).toBe(true)
  })
})

describe('POST /tasks', () => {
  it('creates a task and returns 201 with full task object', async () => {
    const res = await request(app).post('/tasks').send({ title: 'Test task', priority: 'high' })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ title: 'Test task', priority: 'high', completed: false })
    expect(typeof res.body.id).toBe('string')
    expect(res.body.createdAt).toBeTruthy()
  })

  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/tasks').send({ priority: 'low' })
    expect(res.status).toBe(400)
    expect(res.body.errors).toBeDefined()
  })

  it('defaults priority to medium when not provided', async () => {
    const res = await request(app).post('/tasks').send({ title: 'No priority' })
    expect(res.body.priority).toBe('medium')
  })

  it('returns 400 for invalid priority value', async () => {
    const res = await request(app).post('/tasks').send({ title: 'Bad', priority: 'urgent' })
    expect(res.status).toBe(400)
  })
})

describe('PATCH /tasks/:id', () => {
  it('updates completed status', async () => {
    const { body: task } = await request(app).post('/tasks').send({ title: 'Todo', priority: 'medium' })
    const res = await request(app).patch(`/tasks/${task.id}`).send({ completed: true })
    expect(res.status).toBe(200)
    expect(res.body.completed).toBe(true)
  })

  it('updates title', async () => {
    const { body: task } = await request(app).post('/tasks').send({ title: 'Old', priority: 'low' })
    const res = await request(app).patch(`/tasks/${task.id}`).send({ title: 'New' })
    expect(res.body.title).toBe('New')
  })

  it('returns 404 for a non-existent task id', async () => {
    const res = await request(app).patch('/tasks/does-not-exist').send({ completed: true })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /tasks/:id', () => {
  it('deletes a task and returns 204', async () => {
    const { body: task } = await request(app).post('/tasks').send({ title: 'Delete me', priority: 'low' })
    const res = await request(app).delete(`/tasks/${task.id}`)
    expect(res.status).toBe(204)
    const list = await request(app).get('/tasks')
    expect(list.body).toHaveLength(0)
  })

  it('returns 404 when task does not exist', async () => {
    const res = await request(app).delete('/tasks/does-not-exist')
    expect(res.status).toBe(404)
  })
})

const showFailures = process.env.SHOW_FAILURES === 'true'

describe.skipIf(!showFailures)('[FAILURE EXAMPLE] Integration failures', () => {
  it('fails: expects wrong HTTP status code', async () => {
    const res = await request(app).get('/tasks')
    expect(res.status).toBe(500) // Will fail — server returns 200
  })

  it('fails: expects field that does not exist on response', async () => {
    const res = await request(app).post('/tasks').send({ title: 'Test', priority: 'low' })
    expect(res.body.owner).toBe('admin') // Will fail — no owner field
  })
})
```

- [ ] **Step 4: Create `packages/tests/integration/README.md`**

```markdown
# Integration Tests

**What:** Test how modules work together — specifically HTTP API routes interacting with the Express app and in-memory store.

**Tool:** Vitest + Supertest (imports the Express `app` directly, no network port needed)

**When to use:** For every API endpoint — verify routing, middleware, validation, and storage all work as a system.

**Run:**
```bash
pnpm test
pnpm test:failures   # show intentional failure examples
```

**What failures demonstrate:**
- Wrong status code assertion → Vitest shows expected vs received
- Missing field in response → clear diff output

**Trade-offs:**
- ✅ Catches bugs at module boundaries (validation + store + route logic)
- ✅ No server startup needed — Supertest calls the Express app directly
- ❌ Slower than unit tests (more code paths exercised)
- ❌ If it fails, pinpointing which layer broke requires investigation
```

- [ ] **Step 5: Install and run**

```bash
cd packages/tests/integration
pnpm install
pnpm test
```

Expected: All tests PASS.

```bash
pnpm test:failures
```

Expected: 2 tests FAIL with clear diff output.

- [ ] **Step 6: Commit**

```bash
cd ../../..
git add packages/tests/integration
git commit -m "test: add integration test suite (Vitest + Supertest)"
```

---

## Task 6: E2E Test Suite

**Files:**
- Create: `packages/tests/e2e/package.json`
- Create: `packages/tests/e2e/playwright.config.ts`
- Create: `packages/tests/e2e/tests/tasks.spec.ts`
- Create: `packages/tests/e2e/README.md`

- [ ] **Step 1: Create `packages/tests/e2e/package.json`**

```json
{
  "name": "tests-e2e",
  "version": "1.0.0",
  "scripts": {
    "test": "playwright test",
    "test:failures": "SHOW_FAILURES=true playwright test",
    "test:ui": "playwright test --ui",
    "install:browsers": "playwright install chromium"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.1",
    "typescript": "^5.3.3"
  }
}
```

- [ ] **Step 2: Create `packages/tests/e2e/playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm --filter sample-app-backend dev',
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter sample-app-frontend dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
```

- [ ] **Step 3: Create `packages/tests/e2e/tests/tasks.spec.ts`**

```typescript
import { test, expect, request as apiRequest } from '@playwright/test'

async function clearAllTasks() {
  const ctx = await apiRequest.newContext()
  const tasks = await ctx.get('http://localhost:3001/tasks').then(r => r.json())
  for (const task of tasks) {
    await ctx.delete(`http://localhost:3001/tasks/${task.id}`)
  }
  await ctx.dispose()
}

test.beforeEach(async () => {
  await clearAllTasks()
})

test('user can create a task', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Task title').fill('Buy groceries')
  await page.getByLabel('Priority').selectOption('high')
  await page.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByText('Buy groceries')).toBeVisible()
  await expect(page.getByText(/high/i)).toBeVisible()
})

test('user can mark a task as complete', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Task title').fill('Exercise')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByLabel(/Mark "Exercise" as complete/i).check()
  await expect(page.getByText('Exercise')).toHaveCSS('text-decoration', /line-through/)
})

test('user can delete a task', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Task title').fill('Temporary task')
  await page.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByText('Temporary task')).toBeVisible()
  await page.getByRole('button', { name: /Delete "Temporary task"/i }).click()
  await expect(page.getByText('Temporary task')).not.toBeVisible()
})

test('user can filter tasks by status', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Task title').fill('Active task')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByLabel('Task title').fill('Completed task')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByLabel(/Mark "Completed task" as complete/i).check()
  await page.getByLabel('Filter by status').selectOption('active')
  await expect(page.getByText('Active task')).toBeVisible()
  await expect(page.getByText('Completed task')).not.toBeVisible()
})

test('empty state message shows when no tasks exist', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('No tasks yet')).toBeVisible()
})

const showFailures = process.env.SHOW_FAILURES === 'true'

test.describe('[FAILURE EXAMPLES]', () => {
  test.skip(!showFailures, 'Set SHOW_FAILURES=true to run these')

  test('fails: clicks a button that does not exist', async ({ page }) => {
    await page.goto('/')
    // Playwright will time out waiting for a button that never appears
    await page.getByRole('button', { name: 'Non-existent button' }).click({ timeout: 3000 })
  })

  test('fails: expects text to be hidden when it is visible', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Task title').fill('Visible task')
    await page.getByRole('button', { name: 'Add' }).click()
    await expect(page.getByText('Visible task')).not.toBeVisible()
  })
})
```

- [ ] **Step 4: Create `packages/tests/e2e/README.md`**

```markdown
# End-to-End Tests

**What:** Simulate real user interactions in an actual browser. Tests the full stack together.

**Tool:** Playwright

**When to use:** For critical user flows — creating, completing, deleting, and filtering tasks.

**Setup (one-time):**
```bash
pnpm install:browsers
```

**Run:**
```bash
pnpm test
pnpm test:failures   # show intentional failure examples
pnpm test:ui         # open Playwright UI for debugging
```

The backend and frontend start automatically before the test run.

**What failures demonstrate:**
- Clicking a missing button → Playwright timeout with selector info
- Visibility assertion failure → clear expected vs received state

**Trade-offs:**
- ✅ Highest confidence — tests exactly what the user does in a real browser
- ✅ Catches frontend + backend integration bugs
- ❌ Slowest test type (seconds per test)
- ❌ Brittle if selectors or UI flows change frequently
```

- [ ] **Step 5: Install and run**

```bash
cd packages/tests/e2e
pnpm install
pnpm install:browsers
pnpm test
```

Expected: All 5 tests PASS in Chromium.

- [ ] **Step 6: Commit**

```bash
cd ../../..
git add packages/tests/e2e
git commit -m "test: add E2E test suite (Playwright)"
```

---

## Task 7: Contract Test Suite

**Files:**
- Create: `packages/tests/contract/package.json`
- Create: `packages/tests/contract/vitest.config.ts`
- Create: `packages/tests/contract/src/consumer/tasks.pact.ts`
- Create: `packages/tests/contract/src/provider/tasks.verify.ts`
- Create: `packages/tests/contract/README.md`

- [ ] **Step 1: Create `packages/tests/contract/package.json`**

```json
{
  "name": "tests-contract",
  "version": "1.0.0",
  "scripts": {
    "test": "vitest run",
    "test:consumer": "vitest run src/consumer",
    "test:provider": "vitest run src/provider"
  },
  "devDependencies": {
    "@pact-foundation/pact": "^12.3.0",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3",
    "vitest": "^1.0.4"
  }
}
```

- [ ] **Step 2: Create `packages/tests/contract/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'forks', // Required by Pact
  },
})
```

- [ ] **Step 3: Create `packages/tests/contract/src/consumer/tasks.pact.ts`**

```typescript
import { PactV3, MatchersV3 } from '@pact-foundation/pact'
import { describe, it, expect } from 'vitest'
import path from 'path'

const { like, eachLike, string } = MatchersV3

const provider = new PactV3({
  consumer: 'TaskFrontend',
  provider: 'TaskBackend',
  dir: path.resolve(__dirname, '../../pacts'),
})

describe('TaskFrontend → TaskBackend consumer contract', () => {
  it('can GET /tasks and receive an array of task objects', async () => {
    await provider
      .given('at least one task exists')
      .uponReceiving('a GET request for all tasks')
      .withRequest({ method: 'GET', path: '/tasks' })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: eachLike({
          id: string('abc-123'),
          title: string('Sample task'),
          priority: string('medium'),
          completed: like(false),
          createdAt: string('2024-01-01T00:00:00.000Z'),
        }),
      })
      .executeTest(async mockServer => {
        const res = await fetch(`${mockServer.url}/tasks`)
        const data = await res.json()
        expect(res.status).toBe(200)
        expect(Array.isArray(data)).toBe(true)
        expect(data[0]).toHaveProperty('id')
        expect(data[0]).toHaveProperty('title')
        expect(data[0]).toHaveProperty('priority')
        expect(data[0]).toHaveProperty('completed')
      })
  })

  it('can POST /tasks and receive the created task', async () => {
    await provider
      .given('no tasks exist')
      .uponReceiving('a POST request to create a task')
      .withRequest({
        method: 'POST',
        path: '/tasks',
        headers: { 'Content-Type': 'application/json' },
        body: { title: 'New task', priority: 'high' },
      })
      .willRespondWith({
        status: 201,
        body: like({
          id: string('new-id'),
          title: string('New task'),
          priority: string('high'),
          completed: like(false),
        }),
      })
      .executeTest(async mockServer => {
        const res = await fetch(`${mockServer.url}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'New task', priority: 'high' }),
        })
        expect(res.status).toBe(201)
        const data = await res.json()
        expect(data.id).toBeTruthy()
        expect(data.title).toBe('New task')
      })
  })
})
```

- [ ] **Step 4: Create `packages/tests/contract/src/provider/tasks.verify.ts`**

```typescript
import { Verifier } from '@pact-foundation/pact'
import { describe, it } from 'vitest'
import path from 'path'
import http from 'http'
import { app } from '../../../../apps/sample-app/backend/src/app'
import { reset, create } from '../../../../apps/sample-app/backend/src/store/tasks.store'

describe('TaskBackend provider verification', () => {
  it('satisfies all expectations from TaskFrontend', async () => {
    const server = http.createServer(app)
    await new Promise<void>(resolve => server.listen(0, resolve))
    const port = (server.address() as { port: number }).port

    const verifier = new Verifier({
      provider: 'TaskBackend',
      providerBaseUrl: `http://localhost:${port}`,
      pactUrls: [
        path.resolve(__dirname, '../../pacts/TaskFrontend-TaskBackend.json'),
      ],
      stateHandlers: {
        'at least one task exists': async () => {
          reset()
          create('Sample task', 'medium')
        },
        'no tasks exist': async () => {
          reset()
        },
      },
    })

    try {
      await verifier.verifyProvider()
    } finally {
      server.close()
    }
  })
})
```

- [ ] **Step 5: Create `packages/tests/contract/README.md`**

```markdown
# Contract Tests

**What:** Verify that the frontend (consumer) and backend (provider) agree on the API shape — independently, without running both at the same time.

**Tool:** Pact (consumer-driven contract testing)

**When to use:** When frontend and backend are developed by different teams, or when you want to catch API shape mismatches before integration.

**How it works:**
1. Consumer test (`src/consumer/`) runs against a Pact mock server and generates a pact file in `pacts/`
2. Provider test (`src/provider/`) replays those interactions against the real Express app and verifies them

**Run:**
```bash
# Run consumer first (generates pact file)
pnpm test:consumer

# Then run provider verification
pnpm test:provider

# Or run both sequentially
pnpm test
```

**What a failure looks like:**
If you change the backend to return `task_title` instead of `title`, the provider verification fails with a clear mismatch report.

**Trade-offs:**
- ✅ Catches API shape mismatches early, without end-to-end setup
- ✅ Consumer-driven: frontend defines what it needs
- ❌ More setup than other test types
- ❌ Tests shape only — not behavior or business logic
```

- [ ] **Step 6: Install and run consumer (generates pact file)**

```bash
cd packages/tests/contract
pnpm install
pnpm test:consumer
```

Expected: Tests pass, `pacts/TaskFrontend-TaskBackend.json` is generated.

- [ ] **Step 7: Run provider verification**

```bash
pnpm test:provider
```

Expected: Provider verification passes — the real Express app satisfies all consumer expectations.

- [ ] **Step 8: Commit including generated pact file**

```bash
cd ../../..
git add packages/tests/contract
git commit -m "test: add contract test suite (Pact consumer + provider)"
```

---

## Task 8: Snapshot Test Suite

**Files:**
- Create: `packages/tests/snapshot/package.json`
- Create: `packages/tests/snapshot/vitest.config.ts`
- Create: `packages/tests/snapshot/src/setup.ts`
- Create: `packages/tests/snapshot/src/TaskList.snap.test.tsx`
- Create: `packages/tests/snapshot/src/TaskForm.snap.test.tsx`
- Create: `packages/tests/snapshot/README.md`

- [ ] **Step 1: Create `packages/tests/snapshot/package.json`**

```json
{
  "name": "tests-snapshot",
  "version": "1.0.0",
  "scripts": {
    "test": "vitest run",
    "test:update": "vitest run --update",
    "test:failures": "SHOW_FAILURES=true vitest run"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@vitejs/plugin-react": "^4.2.1",
    "jsdom": "^23.0.1",
    "typescript": "^5.3.3",
    "vitest": "^1.0.4"
  }
}
```

- [ ] **Step 2: Create `packages/tests/snapshot/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setup.ts'],
  },
})
```

- [ ] **Step 3: Create `packages/tests/snapshot/src/setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Create `packages/tests/snapshot/src/TaskList.snap.test.tsx`**

```tsx
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TaskList } from '../../../apps/sample-app/frontend/src/components/TaskList'
import type { Task } from '../../../apps/sample-app/frontend/src/types'

const tasks: Task[] = [
  { id: '1', title: 'High priority task', priority: 'high', completed: false, createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '2', title: 'Completed task', priority: 'low', completed: true, createdAt: '2024-01-01T00:00:00.000Z' },
]

describe('TaskList snapshots', () => {
  it('matches snapshot with multiple tasks', () => {
    const { container } = render(
      <TaskList tasks={tasks} onToggle={() => {}} onDelete={() => {}} />
    )
    expect(container).toMatchSnapshot()
  })

  it('matches snapshot with empty task list', () => {
    const { container } = render(
      <TaskList tasks={[]} onToggle={() => {}} onDelete={() => {}} />
    )
    expect(container).toMatchSnapshot()
  })
})

const showFailures = process.env.SHOW_FAILURES === 'true'

describe.skipIf(!showFailures)('[FAILURE EXAMPLE] Snapshot mismatch', () => {
  it('fails: inline snapshot that does not match the real output', () => {
    const { container } = render(
      <TaskList tasks={tasks} onToggle={() => {}} onDelete={() => {}} />
    )
    // This inline snapshot is intentionally wrong — shows what a regression looks like
    expect(container.innerHTML).toMatchInlineSnapshot(`"<div>WRONG SNAPSHOT</div>"`)
  })
})
```

- [ ] **Step 5: Create `packages/tests/snapshot/src/TaskForm.snap.test.tsx`**

```tsx
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TaskForm } from '../../../apps/sample-app/frontend/src/components/TaskForm'

describe('TaskForm snapshots', () => {
  it('matches snapshot in default state', () => {
    const { container } = render(<TaskForm onSubmit={() => {}} />)
    expect(container).toMatchSnapshot()
  })
})
```

- [ ] **Step 6: Create `packages/tests/snapshot/README.md`**

```markdown
# Snapshot Tests

**What:** Capture the rendered HTML output of a component and compare it to a saved baseline. Fails if the output changes unexpectedly.

**Tool:** Vitest + React Testing Library

**When to use:** For stable UI components where unintended regressions should be caught automatically.

**Run:**
```bash
pnpm test           # compare against saved snapshots (creates them on first run)
pnpm test:update    # update snapshots after intentional UI changes
pnpm test:failures  # show what a mismatch looks like
```

**First run behavior:** Snapshots don't exist yet — Vitest creates `__snapshots__/` files automatically. Subsequent runs compare against these files.

**What failures demonstrate:**
- Inline snapshot mismatch → Vitest shows a clear diff of expected vs received HTML

**⚠️ Common mistake:** Running `pnpm test:update` blindly after every failure defeats the purpose. Always review the diff before updating.

**Trade-offs:**
- ✅ Zero effort to catch unintended regressions
- ✅ Automatically covers the entire rendered output
- ❌ Snapshots go stale with every intentional UI change
- ❌ Developers often update blindly, losing the safety net
```

- [ ] **Step 7: Install and run**

```bash
cd packages/tests/snapshot
pnpm install
pnpm test
```

Expected: First run creates `__snapshots__/` files. All tests PASS.

Run again:
```bash
pnpm test
```

Expected: Compares against saved snapshots — all PASS.

```bash
pnpm test:failures
```

Expected: Inline snapshot test FAILS with a clear HTML diff.

- [ ] **Step 8: Commit (including generated snapshot files)**

```bash
cd ../../..
git add packages/tests/snapshot
git commit -m "test: add snapshot test suite (Vitest + React Testing Library)"
```

---

## Task 9: Performance Test Suite

**Files:**
- Create: `packages/tests/performance/package.json`
- Create: `packages/tests/performance/src/load-test.js`
- Create: `packages/tests/performance/README.md`

- [ ] **Step 1: Create `packages/tests/performance/package.json`**

```json
{
  "name": "tests-performance",
  "version": "1.0.0",
  "scripts": {
    "test": "k6 run src/load-test.js",
    "test:failures": "SHOW_FAILURES=true k6 run src/load-test.js"
  }
}
```

- [ ] **Step 2: Create `packages/tests/performance/src/load-test.js`**

```javascript
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const errorRate = new Rate('errors')
const showFailures = __ENV.SHOW_FAILURES === 'true'

// Normal run: ramp up to 100 VUs over 40s, p95 must be under 200ms
// Failure run: impossible 1ms threshold to demonstrate threshold breach
export const options = showFailures
  ? {
      vus: 5,
      duration: '10s',
      thresholds: {
        http_req_duration: ['p(95)<1'], // 1ms — impossible threshold
      },
    }
  : {
      stages: [
        { duration: '10s', target: 50 },
        { duration: '20s', target: 100 },
        { duration: '10s', target: 0 },
      ],
      thresholds: {
        http_req_duration: ['p(95)<200'], // 95% of requests under 200ms
        errors: ['rate<0.01'],            // less than 1% error rate
      },
    }

export default function () {
  // GET all tasks
  const listRes = http.get('http://localhost:3001/tasks')
  const listOk = check(listRes, {
    'GET /tasks → 200': r => r.status === 200,
    'GET /tasks → under 200ms': r => r.timings.duration < 200,
  })
  errorRate.add(!listOk)

  // POST a task
  const createRes = http.post(
    'http://localhost:3001/tasks',
    JSON.stringify({ title: `Load test task ${Date.now()}`, priority: 'low' }),
    { headers: { 'Content-Type': 'application/json' } }
  )
  check(createRes, {
    'POST /tasks → 201': r => r.status === 201,
  })

  sleep(0.1)
}
```

- [ ] **Step 3: Create `packages/tests/performance/README.md`**

```markdown
# Performance Tests

**What:** Simulate real load on the API to measure response times and error rates under concurrent traffic.

**Tool:** k6 (separate binary — NOT an npm package)

**Install k6:**
```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

**Prerequisites:** Sample app backend must be running (`pnpm --filter sample-app-backend dev`)

**Run:**
```bash
pnpm test           # ramp to 100 VUs, assert p95 < 200ms
pnpm test:failures  # intentionally impossible 1ms threshold — shows threshold breach output
```

**What failures demonstrate:**
- k6 threshold breach → shows `✗ p(95)<1` with actual measured value

**Trade-offs:**
- ✅ Catches bottlenecks before production
- ✅ Threshold-based — CI fails automatically when latency degrades
- ❌ Requires k6 binary (not in node_modules)
- ❌ Results only meaningful in a realistic environment (not laptop localhost)
```

- [ ] **Step 4: Install k6 (if not already installed)**

```bash
brew install k6
k6 version
```

Expected: `k6 v0.49.x (go...)` or similar.

- [ ] **Step 5: Start backend and run the suite**

In one terminal:
```bash
pnpm --filter sample-app-backend dev
```

In another:
```bash
cd packages/tests/performance
pnpm test
```

Expected: k6 output showing VU ramp, p95 response time, both thresholds passing (`✓`).

```bash
pnpm test:failures
```

Expected: Threshold failure — `✗ p(95)<1` with actual measured p95 value.

- [ ] **Step 6: Commit**

```bash
cd ../../..
git add packages/tests/performance
git commit -m "test: add performance test suite (k6)"
```

---

## Task 10: Security Test Suite

**Files:**
- Create: `packages/tests/security/package.json`
- Create: `packages/tests/security/vitest.config.ts`
- Create: `packages/tests/security/src/headers.test.ts`
- Create: `packages/tests/security/src/cors.test.ts`
- Create: `packages/tests/security/src/injection.test.ts`
- Create: `packages/tests/security/src/zap-scan.sh`
- Create: `packages/tests/security/README.md`

- [ ] **Step 1: Create `packages/tests/security/package.json`**

```json
{
  "name": "tests-security",
  "version": "1.0.0",
  "scripts": {
    "test": "vitest run",
    "test:failures": "SHOW_FAILURES=true vitest run",
    "test:zap": "bash src/zap-scan.sh"
  },
  "devDependencies": {
    "@types/supertest": "^6.0.2",
    "supertest": "^6.3.3",
    "typescript": "^5.3.3",
    "vitest": "^1.0.4"
  }
}
```

- [ ] **Step 2: Create `packages/tests/security/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { environment: 'node' },
})
```

- [ ] **Step 3: Create `packages/tests/security/src/headers.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../../../apps/sample-app/backend/src/app'

describe('Security: HTTP Headers', () => {
  it('does not expose X-Powered-By header (prevents fingerprinting)', async () => {
    const res = await request(app).get('/health')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })

  it('returns Content-Type application/json for JSON responses', async () => {
    const res = await request(app).get('/tasks')
    expect(res.headers['content-type']).toMatch(/application\/json/)
  })

  it('health endpoint returns 200 (app is running)', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
  })
})

const showFailures = process.env.SHOW_FAILURES === 'true'

describe.skipIf(!showFailures)('[FAILURE EXAMPLE] Missing security header', () => {
  it('fails: expects Strict-Transport-Security header that is not set in development', async () => {
    // HSTS is not set in dev (no HTTPS). In production, use helmet() to add it.
    // This failure demonstrates what happens when a required security header is absent.
    const res = await request(app).get('/health')
    expect(res.headers['strict-transport-security']).toBeDefined()
  })
})
```

- [ ] **Step 4: Create `packages/tests/security/src/cors.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../../../apps/sample-app/backend/src/app'

describe('Security: CORS', () => {
  it('allows requests from the frontend origin', async () => {
    const res = await request(app)
      .get('/tasks')
      .set('Origin', 'http://localhost:5173')
    expect(res.headers['access-control-allow-origin']).toBeTruthy()
  })

  it('responds to CORS preflight OPTIONS request', async () => {
    const res = await request(app)
      .options('/tasks')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
    expect(res.status).toBeLessThan(400)
  })
})

const showFailures = process.env.SHOW_FAILURES === 'true'

describe.skipIf(!showFailures)('[FAILURE EXAMPLE] Unexpected CORS header value', () => {
  it('fails: expects CORS origin to be a specific domain that is not configured', async () => {
    const res = await request(app)
      .get('/tasks')
      .set('Origin', 'http://localhost:5173')
    // Expects a specific restricted value — will fail because our CORS is open (*)
    expect(res.headers['access-control-allow-origin']).toBe('https://myapp.example.com')
  })
})
```

- [ ] **Step 5: Create `packages/tests/security/src/injection.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../../../apps/sample-app/backend/src/app'
import { reset } from '../../../apps/sample-app/backend/src/store/tasks.store'

beforeEach(() => reset())

describe('Security: Input Validation / Injection', () => {
  it('rejects excessively long title (potential DoS / memory pressure)', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'a'.repeat(10000), priority: 'low' })
    expect(res.status).toBe(400)
  })

  it('stores script-tag content as plain text (XSS is a frontend rendering concern)', async () => {
    const malicious = '<script>alert("xss")</script>'
    const res = await request(app)
      .post('/tasks')
      .send({ title: malicious, priority: 'low' })
    // The API accepts it as text — XSS prevention is the frontend's job (React escapes by default)
    // Key: server does NOT execute it, just stores and returns it as a string
    if (res.status === 201) {
      expect(typeof res.body.title).toBe('string')
      expect(res.body.title).toBe(malicious)
    } else {
      // If validation blocks it (stricter server), that is also acceptable
      expect(res.status).toBe(400)
    }
  })

  it('rejects invalid priority to prevent unexpected enum values', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Test', priority: 'CRITICAL; DROP TABLE tasks;--' })
    expect(res.status).toBe(400)
  })

  it('handles missing Content-Type header gracefully', async () => {
    const res = await request(app)
      .post('/tasks')
      .set('Content-Type', 'text/plain')
      .send('title=hack')
    // express.json() ignores non-JSON content types — body is empty → validation returns 400
    expect(res.status).toBeGreaterThanOrEqual(400)
  })
})

const showFailures = process.env.SHOW_FAILURES === 'true'

describe.skipIf(!showFailures)('[FAILURE EXAMPLE] Input validation gap', () => {
  it('fails: expects server to accept a title with 500 chars (our limit is 200)', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'a'.repeat(500), priority: 'low' })
    // Will fail — server correctly returns 400
    expect(res.status).toBe(201)
  })
})
```

- [ ] **Step 6: Create `packages/tests/security/src/zap-scan.sh`**

```bash
#!/usr/bin/env bash
# OWASP ZAP automated baseline scan
# Requires: ZAP installed — brew install owasp-zap (or download from zaproxy.org)
# Requires: Sample app backend running on port 3001

set -e

TARGET="http://localhost:3001"
REPORT="/tmp/zap-report-$(date +%Y%m%d-%H%M%S).html"

if ! command -v zap.sh &>/dev/null; then
  echo "⚠️  OWASP ZAP not found."
  echo "   Install: brew install owasp-zap"
  echo "   Or download from: https://www.zaproxy.org/download/"
  echo ""
  echo "   Skipping ZAP scan. Custom security tests (pnpm test) still run without ZAP."
  exit 0
fi

echo "🔍 Running OWASP ZAP baseline scan against $TARGET"
zap.sh -cmd \
  -quickurl "$TARGET" \
  -quickprogress \
  -quickout "$REPORT"

echo ""
echo "✅ ZAP scan complete. Report saved to: $REPORT"
echo "   Open in browser: open $REPORT"
```

Make it executable:
```bash
chmod +x packages/tests/security/src/zap-scan.sh
```

- [ ] **Step 7: Create `packages/tests/security/README.md`**

```markdown
# Security Tests

**What:** Check for common security issues — missing headers, CORS misconfiguration, input injection vectors. Optionally run a full OWASP ZAP automated scan.

**Tool:** Vitest + Supertest (custom checks) + OWASP ZAP (optional full scan)

**Run custom checks (no extra install needed):**
```bash
pnpm test
pnpm test:failures  # show intentional failure examples
```

**Run OWASP ZAP scan (requires separate install):**
```bash
brew install owasp-zap           # one-time install
# ensure backend is running on port 3001 first
pnpm test:zap
```

**What failures demonstrate:**
- Missing security header (HSTS) → assertion failure with `undefined` received
- Expecting wrong CORS origin → clear value mismatch

**What ZAP scans for:**
- SQL injection, XSS, CSRF, security headers, authentication issues, and more (OWASP Top 10)

**Trade-offs:**
- ✅ Catches OWASP Top 10 classes of issues automatically
- ✅ Custom checks run anywhere (no extra binary)
- ❌ ZAP requires Java + separate binary installation
- ❌ Automated scanners produce false positives that require manual triage
- ❌ Cannot catch all vulnerabilities — defense in depth is still required
```

- [ ] **Step 8: Install and run**

```bash
cd packages/tests/security
pnpm install
pnpm test
```

Expected: All custom security tests PASS.

```bash
pnpm test:failures
```

Expected: 2 tests FAIL — missing HSTS header and wrong CORS origin value.

- [ ] **Step 9: Commit**

```bash
cd ../../..
git add packages/tests/security
git commit -m "test: add security test suite (headers, CORS, injection + ZAP script)"
```

---

## Task 11: Accessibility Test Suite

**Files:**
- Create: `packages/tests/accessibility/package.json`
- Create: `packages/tests/accessibility/playwright.config.ts`
- Create: `packages/tests/accessibility/src/a11y.spec.ts`
- Create: `packages/tests/accessibility/README.md`

- [ ] **Step 1: Create `packages/tests/accessibility/package.json`**

```json
{
  "name": "tests-accessibility",
  "version": "1.0.0",
  "scripts": {
    "test": "playwright test",
    "test:failures": "SHOW_FAILURES=true playwright test",
    "install:browsers": "playwright install chromium"
  },
  "devDependencies": {
    "@axe-core/playwright": "^4.8.3",
    "@playwright/test": "^1.40.1",
    "typescript": "^5.3.3"
  }
}
```

- [ ] **Step 2: Create `packages/tests/accessibility/playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './src',
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: [
    {
      command: 'pnpm --filter sample-app-backend dev',
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter sample-app-frontend dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
```

- [ ] **Step 3: Create `packages/tests/accessibility/src/a11y.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('main task manager view has no WCAG 2.1 AA violations', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  if (results.violations.length > 0) {
    console.log('Violations found:')
    results.violations.forEach(v => {
      console.log(`  [${v.impact}] ${v.id}: ${v.description}`)
      v.nodes.forEach(n => console.log(`    → ${n.target}`))
    })
  }
  expect(results.violations).toEqual([])
})

test('task form inputs are accessible (labels, roles)', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page })
    .include('form')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  expect(results.violations).toEqual([])
})

test('task list is accessible after adding a task', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Task title').fill('Accessibility test task')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByText('Accessibility test task').waitFor()

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  expect(results.violations).toEqual([])
})

const showFailures = process.env.SHOW_FAILURES === 'true'

test.describe('[FAILURE EXAMPLES]', () => {
  test.skip(!showFailures, 'Set SHOW_FAILURES=true to run these')

  test('fails: injects an image without alt text and scans for violations', async ({ page }) => {
    await page.goto('/')
    // Inject an inaccessible image into the DOM
    await page.evaluate(() => {
      const img = document.createElement('img')
      img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
      // No alt attribute — this violates WCAG 2.1 Success Criterion 1.1.1
      document.body.appendChild(img)
    })
    const results = await new AxeBuilder({ page }).analyze()
    // Will fail — axe finds the missing alt text violation
    expect(results.violations).toEqual([])
  })
})
```

- [ ] **Step 4: Create `packages/tests/accessibility/README.md`**

```markdown
# Accessibility Tests

**What:** Automatically scan rendered pages for WCAG 2.1 AA violations using the axe-core engine running in a real browser via Playwright.

**Tool:** @axe-core/playwright + Playwright

**When to use:** On every significant UI view. Especially after adding forms, modals, dialogs, or interactive elements.

**Setup (one-time):**
```bash
pnpm install:browsers
```

**Run:**
```bash
pnpm test
pnpm test:failures   # inject an inaccessible element and show axe violation output
```

**What failures demonstrate:**
- Image without alt text → axe reports `image-alt` violation with the exact DOM target

**Understanding violations:**
axe reports include:
- `id`: the rule that was violated (e.g., `image-alt`, `color-contrast`)
- `impact`: minor / moderate / serious / critical
- `nodes`: the exact DOM elements that failed
- `helpUrl`: link to the WCAG success criterion

**Trade-offs:**
- ✅ Automatically catches ~30% of WCAG issues (the ones that can be determined programmatically)
- ✅ No extra browser setup beyond what E2E tests already use
- ❌ Cannot catch ~70% of a11y issues — manual testing with screen readers is still required
- ❌ Color contrast issues require careful review — perceived contrast depends on rendering engine
```

- [ ] **Step 5: Install and run**

```bash
cd packages/tests/accessibility
pnpm install
pnpm install:browsers
pnpm test
```

Expected: All 3 tests PASS (app is accessible by default — React escapes content, semantic HTML, aria-labels on inputs).

```bash
pnpm test:failures
```

Expected: 1 test FAILS with axe `image-alt` violation report.

- [ ] **Step 6: Commit**

```bash
cd ../../..
git add packages/tests/accessibility
git commit -m "test: add accessibility test suite (axe-core + Playwright)"
```

---

## Task 12: Dashboard Backend

**Files:**
- Create: `apps/dashboard/backend/package.json`
- Create: `apps/dashboard/backend/tsconfig.json`
- Create: `apps/dashboard/backend/src/types.ts`
- Create: `apps/dashboard/backend/src/runner/store.ts`
- Create: `apps/dashboard/backend/src/runner/spawn.ts`
- Create: `apps/dashboard/backend/src/routes/run.ts`
- Create: `apps/dashboard/backend/src/routes/results.ts`
- Create: `apps/dashboard/backend/src/app.ts`
- Create: `apps/dashboard/backend/src/index.ts`

- [ ] **Step 1: Create `apps/dashboard/backend/package.json`**

```json
{
  "name": "dashboard-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "tsx": "^4.6.2",
    "typescript": "^5.3.3"
  }
}
```

- [ ] **Step 2: Create `apps/dashboard/backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `apps/dashboard/backend/src/types.ts`**

```typescript
export type TestType =
  | 'unit'
  | 'integration'
  | 'e2e'
  | 'contract'
  | 'snapshot'
  | 'performance'
  | 'security'
  | 'accessibility'

export type RunStatus = 'idle' | 'running' | 'passed' | 'failed'

export interface RunResult {
  testType: TestType
  status: RunStatus
  duration: number | null
  exitCode: number | null
  output: string
  startedAt: string | null
  completedAt: string | null
}
```

- [ ] **Step 4: Create `apps/dashboard/backend/src/runner/store.ts`**

```typescript
import { RunResult, TestType } from '../types'

const ALL_TYPES: TestType[] = [
  'unit', 'integration', 'e2e', 'contract',
  'snapshot', 'performance', 'security', 'accessibility',
]

const results = new Map<TestType, RunResult>()

const idle = (testType: TestType): RunResult => ({
  testType,
  status: 'idle',
  duration: null,
  exitCode: null,
  output: '',
  startedAt: null,
  completedAt: null,
})

export const getResult = (testType: TestType): RunResult =>
  results.get(testType) ?? idle(testType)

export const getAllResults = (): Record<TestType, RunResult> =>
  Object.fromEntries(ALL_TYPES.map(t => [t, getResult(t)])) as Record<TestType, RunResult>

export const setResult = (result: RunResult): void => {
  results.set(result.testType, result)
}
```

- [ ] **Step 5: Create `apps/dashboard/backend/src/runner/spawn.ts`**

```typescript
import { spawn } from 'child_process'
import path from 'path'
import { TestType } from '../types'
import { setResult, getResult } from './store'

const ROOT = path.resolve(__dirname, '../../../../../')

const COMMANDS: Record<TestType, { cmd: string; args: string[]; cwd: string }> = {
  unit:          { cmd: 'pnpm', args: ['vitest', 'run'],       cwd: path.join(ROOT, 'packages/tests/unit') },
  integration:   { cmd: 'pnpm', args: ['vitest', 'run'],       cwd: path.join(ROOT, 'packages/tests/integration') },
  e2e:           { cmd: 'pnpm', args: ['playwright', 'test'],  cwd: path.join(ROOT, 'packages/tests/e2e') },
  contract:      { cmd: 'pnpm', args: ['vitest', 'run'],       cwd: path.join(ROOT, 'packages/tests/contract') },
  snapshot:      { cmd: 'pnpm', args: ['vitest', 'run'],       cwd: path.join(ROOT, 'packages/tests/snapshot') },
  performance:   { cmd: 'k6',   args: ['run', 'src/load-test.js'], cwd: path.join(ROOT, 'packages/tests/performance') },
  security:      { cmd: 'pnpm', args: ['vitest', 'run'],       cwd: path.join(ROOT, 'packages/tests/security') },
  accessibility: { cmd: 'pnpm', args: ['playwright', 'test'],  cwd: path.join(ROOT, 'packages/tests/accessibility') },
}

// Per-type SSE listener sets
const listeners = new Map<TestType, Set<(chunk: string) => void>>()

export const addListener = (
  testType: TestType,
  cb: (chunk: string) => void
): (() => void) => {
  if (!listeners.has(testType)) listeners.set(testType, new Set())
  listeners.get(testType)!.add(cb)
  return () => listeners.get(testType)?.delete(cb)
}

export const runTest = (testType: TestType, showFailures = false): void => {
  if (getResult(testType).status === 'running') return

  const startedAt = new Date().toISOString()
  setResult({ testType, status: 'running', duration: null, exitCode: null, output: '', startedAt, completedAt: null })

  const { cmd, args, cwd } = COMMANDS[testType]
  const env = { ...process.env, SHOW_FAILURES: showFailures ? 'true' : 'false' }
  const child = spawn(cmd, args, { cwd, env, shell: process.platform === 'win32' })

  let output = ''

  const emit = (chunk: string) => {
    output += chunk
    listeners.get(testType)?.forEach(cb => cb(chunk))
  }

  child.stdout.on('data', (d: Buffer) => emit(d.toString()))
  child.stderr.on('data', (d: Buffer) => emit(d.toString()))

  child.on('close', exitCode => {
    const completedAt = new Date().toISOString()
    const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime()
    setResult({
      testType,
      status: exitCode === 0 ? 'passed' : 'failed',
      duration,
      exitCode: exitCode ?? -1,
      output,
      startedAt,
      completedAt,
    })
    listeners.get(testType)?.forEach(cb => cb(`\n[DONE] Exit code: ${exitCode}\n`))
  })
}
```

- [ ] **Step 6: Create `apps/dashboard/backend/src/routes/run.ts`**

```typescript
import { Router } from 'express'
import { runTest, addListener } from '../runner/spawn'
import { getResult } from '../runner/store'
import { TestType } from '../types'

export const runRouter = Router()

const VALID: TestType[] = [
  'unit', 'integration', 'e2e', 'contract',
  'snapshot', 'performance', 'security', 'accessibility',
]

runRouter.post('/:testType', (req, res) => {
  const testType = req.params.testType as TestType
  if (!VALID.includes(testType)) return res.status(400).json({ error: 'Invalid test type' })
  const showFailures = req.body?.showFailures === true
  runTest(testType, showFailures)
  res.json({ testType, started: true })
})

runRouter.get('/:testType/stream', (req, res) => {
  const testType = req.params.testType as TestType
  if (!VALID.includes(testType)) return res.status(400).json({ error: 'Invalid test type' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  // Send any output already buffered (e.g. client connects mid-run)
  const current = getResult(testType)
  if (current.output) {
    res.write(`data: ${JSON.stringify({ chunk: current.output })}\n\n`)
  }

  const remove = addListener(testType, chunk => {
    res.write(`data: ${JSON.stringify({ chunk })}\n\n`)
  })

  req.on('close', remove)
})
```

- [ ] **Step 7: Create `apps/dashboard/backend/src/routes/results.ts`**

```typescript
import { Router } from 'express'
import { getAllResults } from '../runner/store'

export const resultsRouter = Router()

resultsRouter.get('/', (_req, res) => {
  res.json(getAllResults())
})
```

- [ ] **Step 8: Create `apps/dashboard/backend/src/app.ts`**

```typescript
import express from 'express'
import cors from 'cors'
import { runRouter } from './routes/run'
import { resultsRouter } from './routes/results'

export const app = express()

app.disable('x-powered-by')
app.use(cors({ origin: 'http://localhost:5174' }))
app.use(express.json())
app.use('/run', runRouter)
app.use('/results', resultsRouter)
app.get('/health', (_req, res) => res.json({ status: 'ok' }))
```

- [ ] **Step 9: Create `apps/dashboard/backend/src/index.ts`**

```typescript
import { app } from './app'

const PORT = process.env.PORT ?? 3002
app.listen(PORT, () =>
  console.log(`Dashboard API running on http://localhost:${PORT}`)
)
```

- [ ] **Step 10: Install and verify**

```bash
cd apps/dashboard/backend
pnpm install
pnpm dev
```

Expected: `Dashboard API running on http://localhost:3002`

Test:
```bash
curl http://localhost:3002/health
# → {"status":"ok"}

curl http://localhost:3002/results
# → {"unit":{"testType":"unit","status":"idle",...},...}

curl -X POST http://localhost:3002/run/unit \
  -H 'Content-Type: application/json' \
  -d '{"showFailures":false}'
# → {"testType":"unit","started":true}
```

Stop server.

- [ ] **Step 11: Commit**

```bash
cd ../../..
git add apps/dashboard/backend
git commit -m "feat: add dashboard backend (test runner API with SSE streaming)"
```

---

## Task 13: Dashboard Frontend

**Files:**
- Create: `apps/dashboard/frontend/package.json`
- Create: `apps/dashboard/frontend/tsconfig.json`
- Create: `apps/dashboard/frontend/vite.config.ts`
- Create: `apps/dashboard/frontend/index.html`
- Create: `apps/dashboard/frontend/src/types.ts`
- Create: `apps/dashboard/frontend/src/data/testTypes.ts`
- Create: `apps/dashboard/frontend/src/hooks/useSSE.ts`
- Create: `apps/dashboard/frontend/src/components/Terminal.tsx`
- Create: `apps/dashboard/frontend/src/components/TestCard.tsx`
- Create: `apps/dashboard/frontend/src/components/TestingTrophy.tsx`
- Create: `apps/dashboard/frontend/src/components/TestExplorer.tsx`
- Create: `apps/dashboard/frontend/src/components/GuidedWalkthrough.tsx`
- Create: `apps/dashboard/frontend/src/components/Dashboard.tsx`
- Create: `apps/dashboard/frontend/src/App.tsx`
- Create: `apps/dashboard/frontend/src/main.tsx`

- [ ] **Step 1: Create `apps/dashboard/frontend/package.json`**

```json
{
  "name": "dashboard-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}
```

- [ ] **Step 2: Create `apps/dashboard/frontend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `apps/dashboard/frontend/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
})
```

- [ ] **Step 4: Create `apps/dashboard/frontend/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Testing Showcase</title>
  </head>
  <body style="margin:0">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `apps/dashboard/frontend/src/types.ts`**

```typescript
export type TestType =
  | 'unit' | 'integration' | 'e2e' | 'contract'
  | 'snapshot' | 'performance' | 'security' | 'accessibility'

export type RunStatus = 'idle' | 'running' | 'passed' | 'failed'

export interface RunResult {
  testType: TestType
  status: RunStatus
  duration: number | null
  exitCode: number | null
  output: string
  startedAt: string | null
  completedAt: string | null
}
```

- [ ] **Step 6: Create `apps/dashboard/frontend/src/data/testTypes.ts`**

```typescript
import { TestType } from '../types'

export interface TestTypeInfo {
  id: TestType
  name: string
  tool: string
  description: string
  whenToUse: string
  tradeoffs: { pro: string; con: string }[]
  layer: 'unit' | 'integration' | 'e2e' | 'cross-cutting'
  code: string
}

export const TEST_TYPES: TestTypeInfo[] = [
  {
    id: 'unit',
    name: 'Unit Tests',
    tool: 'Vitest',
    layer: 'unit',
    description: 'Test individual functions or components in isolation — no network, no database, no side effects.',
    whenToUse: 'For all pure functions and component rendering logic.',
    tradeoffs: [
      { pro: 'Fast — milliseconds per test', con: 'Cannot catch integration bugs' },
      { pro: 'Easy to pinpoint failures', con: 'Can give false confidence if units are wrong together' },
    ],
    code: `import { describe, it, expect } from 'vitest'
import { sortByPriority } from '../utils/sort'

describe('sortByPriority', () => {
  it('sorts high before medium before low', () => {
    const tasks = [
      { id: '1', title: 'Low', priority: 'low', completed: false },
      { id: '2', title: 'High', priority: 'high', completed: false },
    ]
    const result = sortByPriority(tasks)
    expect(result[0].priority).toBe('high')
    expect(result[1].priority).toBe('low')
  })
})`,
  },
  {
    id: 'integration',
    name: 'Integration Tests',
    tool: 'Vitest + Supertest',
    layer: 'integration',
    description: 'Test how modules work together — HTTP routes, middleware, and storage exercised as a system.',
    whenToUse: 'For every API endpoint — verify routing, validation, and storage work together.',
    tradeoffs: [
      { pro: 'Catches bugs at module boundaries', con: 'Slower than unit tests' },
      { pro: 'No running server needed (Supertest)', con: 'Harder to pinpoint exact failure location' },
    ],
    code: `import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../app'
import { reset } from '../store/tasks.store'

beforeEach(() => reset())

describe('POST /tasks', () => {
  it('creates a task and returns 201', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Test task', priority: 'high' })
    expect(res.status).toBe(201)
    expect(res.body.title).toBe('Test task')
  })
})`,
  },
  {
    id: 'e2e',
    name: 'End-to-End Tests',
    tool: 'Playwright',
    layer: 'e2e',
    description: 'Simulate real user interactions in a browser. Tests the full stack together.',
    whenToUse: 'For critical user flows — create, complete, delete, filter tasks.',
    tradeoffs: [
      { pro: 'Highest confidence — real browser, real user flows', con: 'Slowest — seconds per test' },
      { pro: 'Catches full-stack integration bugs', con: 'Brittle when selectors or flows change' },
    ],
    code: `import { test, expect } from '@playwright/test'

test('user can create a task', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Task title').fill('Buy groceries')
  await page.getByLabel('Priority').selectOption('high')
  await page.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByText('Buy groceries')).toBeVisible()
})`,
  },
  {
    id: 'contract',
    name: 'Contract Tests',
    tool: 'Pact',
    layer: 'integration',
    description: 'Verify that the consumer (frontend) and provider (backend) agree on the API shape — without running both simultaneously.',
    whenToUse: 'When frontend and backend are developed independently or by different teams.',
    tradeoffs: [
      { pro: 'Catches API shape mismatches before integration', con: 'More setup than other test types' },
      { pro: 'Consumer-driven — frontend defines expectations', con: 'Tests shape only, not behavior' },
    ],
    code: `// Consumer defines what it expects from the backend
await provider
  .given('tasks exist')
  .uponReceiving('GET /tasks request')
  .withRequest({ method: 'GET', path: '/tasks' })
  .willRespondWith({
    status: 200,
    body: eachLike({
      id: string(), title: string(),
      priority: string(), completed: like(false),
    }),
  })
  .executeTest(async mockServer => {
    const res = await fetch(\`\${mockServer.url}/tasks\`)
    const data = await res.json()
    expect(data[0]).toHaveProperty('id')
  })`,
  },
  {
    id: 'snapshot',
    name: 'Snapshot Tests',
    tool: 'Vitest + React Testing Library',
    layer: 'unit',
    description: 'Capture the rendered HTML output of a component and compare it to a saved baseline. Fails if output changes unexpectedly.',
    whenToUse: 'For stable UI components where unintended regressions should be caught automatically.',
    tradeoffs: [
      { pro: 'Zero effort to catch unintended regressions', con: 'Snapshots go stale with every intentional change' },
      { pro: 'Automatically covers entire rendered output', con: 'Developers often update blindly, defeating the purpose' },
    ],
    code: `import { render } from '@testing-library/react'
import { TaskList } from '../components/TaskList'

it('matches snapshot', () => {
  const { container } = render(
    <TaskList
      tasks={tasks}
      onToggle={() => {}}
      onDelete={() => {}}
    />
  )
  // First run: creates __snapshots__/file.snap
  // Subsequent runs: compares to saved baseline
  expect(container).toMatchSnapshot()
})`,
  },
  {
    id: 'performance',
    name: 'Performance Tests',
    tool: 'k6',
    layer: 'cross-cutting',
    description: 'Simulate concurrent load to measure response times and error rates under real traffic conditions.',
    whenToUse: 'Before launches, after performance regressions, or when SLOs are defined.',
    tradeoffs: [
      { pro: 'Catches bottlenecks before production', con: 'Requires k6 binary (separate install)' },
      { pro: 'Threshold-based — CI fails if p95 degrades', con: 'Results only meaningful in realistic environment' },
    ],
    code: `import http from 'k6/http'
import { check } from 'k6'

export const options = {
  stages: [
    { duration: '10s', target: 50 },
    { duration: '20s', target: 100 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% under 200ms
  },
}

export default function () {
  const res = http.get('http://localhost:3001/tasks')
  check(res, { 'status is 200': r => r.status === 200 })
}`,
  },
  {
    id: 'security',
    name: 'Security Tests',
    tool: 'OWASP ZAP + Custom',
    layer: 'cross-cutting',
    description: 'Check for common vulnerabilities: missing headers, CORS misconfiguration, injection vectors, and more.',
    whenToUse: 'Before production releases and after adding new endpoints or authentication.',
    tradeoffs: [
      { pro: 'Catches OWASP Top 10 classes automatically', con: 'ZAP requires Java + separate binary' },
      { pro: 'Custom checks run anywhere (no extra install)', con: 'False positives require manual triage' },
    ],
    code: `import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../app'

describe('Security Headers', () => {
  it('does not expose X-Powered-By (prevents fingerprinting)', async () => {
    const res = await request(app).get('/health')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })

  it('rejects excessively long input (DoS prevention)', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'a'.repeat(10000) })
    expect(res.status).toBe(400)
  })
})`,
  },
  {
    id: 'accessibility',
    name: 'Accessibility Tests',
    tool: 'axe-core + Playwright',
    layer: 'cross-cutting',
    description: 'Automatically scan rendered pages for WCAG 2.1 AA violations using the axe-core engine in a real browser.',
    whenToUse: 'On every UI view, especially after adding forms, modals, or interactive elements.',
    tradeoffs: [
      { pro: 'Catches ~30% of WCAG issues automatically', con: 'Cannot catch ~70% — manual screen reader testing still needed' },
      { pro: 'Integrates with existing Playwright setup', con: 'Violations need developer interpretation to fix correctly' },
    ],
    code: `import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('app has no WCAG 2.1 AA violations', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  expect(results.violations).toEqual([])
})`,
  },
]

export const WALKTHROUGH_ORDER: TestType[] = [
  'unit', 'integration', 'contract', 'snapshot', 'e2e', 'accessibility', 'security', 'performance',
]
```

- [ ] **Step 7: Create `apps/dashboard/frontend/src/hooks/useSSE.ts`**

```typescript
import { useEffect, useRef } from 'react'

const API = import.meta.env.VITE_DASHBOARD_API ?? 'http://localhost:3002'

export function useSSE(testType: string | null, onChunk: (chunk: string) => void): void {
  const onChunkRef = useRef(onChunk)
  onChunkRef.current = onChunk

  useEffect(() => {
    if (!testType) return
    const es = new EventSource(`${API}/run/${testType}/stream`)
    es.onmessage = e => {
      const data = JSON.parse(e.data) as { chunk: string }
      onChunkRef.current(data.chunk)
    }
    return () => es.close()
  }, [testType])
}
```

- [ ] **Step 8: Create `apps/dashboard/frontend/src/components/Terminal.tsx`**

```tsx
import { useEffect, useRef } from 'react'

interface Props {
  output: string
}

export function Terminal({ output }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [output])

  return (
    <div
      ref={ref}
      style={{
        background: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: 'monospace',
        fontSize: 13,
        padding: 16,
        borderRadius: 6,
        height: 280,
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}
    >
      {output || <span style={{ color: '#6b7280' }}>Run a test to see output here...</span>}
    </div>
  )
}
```

- [ ] **Step 9: Create `apps/dashboard/frontend/src/components/TestCard.tsx`**

```tsx
import { TestType, RunResult } from '../types'

interface Props {
  testType: TestType
  result: RunResult
  onRun: (testType: TestType, showFailures: boolean) => void
  onClick: (testType: TestType) => void
}

const STATUS_COLOR: Record<string, string> = {
  idle: '#9ca3af', running: '#3b82f6', passed: '#22c55e', failed: '#ef4444',
}
const STATUS_LABEL: Record<string, string> = {
  idle: 'Not run', running: 'Running...', passed: 'Passed', failed: 'Failed',
}

export function TestCard({ testType, result, onRun, onClick }: Props) {
  return (
    <div
      onClick={() => onClick(testType)}
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: 16,
        cursor: 'pointer',
        background: 'white',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 15, textTransform: 'capitalize' }}>{testType}</h3>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: STATUS_COLOR[result.status] }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[result.status], display: 'inline-block' }} />
          {STATUS_LABEL[result.status]}
        </span>
      </div>
      {result.duration !== null && (
        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6b7280' }}>{result.duration}ms</p>
      )}
      <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
        <button
          onClick={() => onRun(testType, false)}
          disabled={result.status === 'running'}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 4, border: 'none',
            background: result.status === 'running' ? '#9ca3af' : '#3b82f6',
            color: 'white', cursor: result.status === 'running' ? 'not-allowed' : 'pointer', fontSize: 12,
          }}
        >
          Run
        </button>
        <button
          onClick={() => onRun(testType, true)}
          disabled={result.status === 'running'}
          title="Run with intentional failure examples enabled (SHOW_FAILURES=true)"
          style={{
            flex: 1, padding: '6px 0', borderRadius: 4, border: '1px solid #ef4444',
            background: 'white', color: '#ef4444',
            cursor: result.status === 'running' ? 'not-allowed' : 'pointer', fontSize: 12,
          }}
        >
          Show Failures
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 10: Create `apps/dashboard/frontend/src/components/TestingTrophy.tsx`**

```tsx
import { TestType, RunResult } from '../types'

interface Props {
  results: Record<TestType, RunResult>
  onSelect: (type: TestType) => void
  selected: TestType | null
}

type Layer = { label: string; types: TestType[]; color: string; width: number }

const LAYERS: Layer[] = [
  { label: 'E2E', types: ['e2e'], color: '#6366f1', width: 100 },
  { label: 'Integration · Contract', types: ['integration', 'contract'], color: '#3b82f6', width: 200 },
  { label: 'Unit · Snapshot', types: ['unit', 'snapshot'], color: '#22c55e', width: 300 },
  { label: 'A11y · Security · Performance', types: ['accessibility', 'security', 'performance'], color: '#f59e0b', width: 360 },
]

const DOT_COLOR: Record<string, string> = {
  idle: '#9ca3af', running: '#3b82f6', passed: '#22c55e', failed: '#ef4444',
}

export function TestingTrophy({ results, onSelect, selected }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 32, gap: 2 }}>
      <h2 style={{ marginBottom: 24, fontSize: 22 }}>Testing Trophy</h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24, textAlign: 'center', maxWidth: 400 }}>
        Click any layer to explore that test type. The widest layers have the most tests.
      </p>
      {LAYERS.map(layer => (
        <div key={layer.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <div
            style={{
              width: layer.width,
              background: layer.color,
              borderRadius: 6,
              padding: '10px 8px',
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            {layer.types.map(type => (
              <button
                key={type}
                onClick={() => onSelect(type)}
                style={{
                  background: selected === type ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
                  border: `2px solid ${selected === type ? 'white' : 'transparent'}`,
                  borderRadius: 4,
                  color: 'white',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {type}
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: DOT_COLOR[results[type]?.status ?? 'idle'],
                  display: 'inline-block',
                  flexShrink: 0,
                }} />
              </button>
            ))}
          </div>
          <span style={{ fontSize: 11, color: '#6b7280' }}>{layer.label}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 11: Create `apps/dashboard/frontend/src/components/TestExplorer.tsx`**

```tsx
import { useState } from 'react'
import { TestType, RunResult } from '../types'
import { TestTypeInfo } from '../data/testTypes'
import { Terminal } from './Terminal'
import { useSSE } from '../hooks/useSSE'

const API = import.meta.env.VITE_DASHBOARD_API ?? 'http://localhost:3002'

interface Props {
  info: TestTypeInfo
  result: RunResult
  onClose: () => void
}

export function TestExplorer({ info, result, onClose }: Props) {
  const [output, setOutput] = useState(result.output)
  const [streamingType, setStreamingType] = useState<TestType | null>(null)

  useSSE(streamingType, chunk => setOutput(prev => prev + chunk))

  const handleRun = async (showFailures: boolean) => {
    setOutput('')
    setStreamingType(null)
    await fetch(`${API}/run/${info.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showFailures }),
    })
    setStreamingType(info.id)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, height: '100%' }}>
      {/* Left pane: code */}
      <div style={{ padding: 24, borderRight: '1px solid #e5e7eb', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: '0 0 4px' }}>{info.name}</h2>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Tool: {info.tool}</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6b7280', padding: 4 }}
            aria-label="Close explorer"
          >
            ✕
          </button>
        </div>
        <pre style={{
          background: '#1e1e1e', color: '#d4d4d4', padding: 16, borderRadius: 6,
          overflow: 'auto', fontSize: 12, margin: 0, lineHeight: 1.6,
        }}>
          <code>{info.code}</code>
        </pre>
      </div>

      {/* Right pane: explanation + terminal */}
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto' }}>
        <div>
          <p style={{ margin: '0 0 12px', lineHeight: 1.6 }}>{info.description}</p>
          <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 13 }}>When to use:</p>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#4b5563', lineHeight: 1.5 }}>{info.whenToUse}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {info.tradeoffs.map((t, i) => (
              <div key={i} style={{ background: '#f9fafb', padding: '8px 10px', borderRadius: 6 }}>
                <div style={{ color: '#16a34a', fontSize: 12, marginBottom: 2 }}>✓ {t.pro}</div>
                <div style={{ color: '#dc2626', fontSize: 12 }}>✗ {t.con}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => handleRun(false)}
            style={{ flex: 1, padding: '8px 0', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
          >
            Run Tests
          </button>
          <button
            onClick={() => handleRun(true)}
            title="Runs with SHOW_FAILURES=true — intentional failure examples are enabled"
            style={{ flex: 1, padding: '8px 0', background: 'white', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
          >
            Show Failures
          </button>
        </div>
        <Terminal output={output} />
      </div>
    </div>
  )
}
```

- [ ] **Step 12: Create `apps/dashboard/frontend/src/components/GuidedWalkthrough.tsx`**

```tsx
import { useState } from 'react'
import { TestType, RunResult } from '../types'
import { TEST_TYPES, WALKTHROUGH_ORDER } from '../data/testTypes'
import { TestExplorer } from './TestExplorer'

interface Props {
  results: Record<TestType, RunResult>
}

export function GuidedWalkthrough({ results }: Props) {
  const [step, setStep] = useState(0)
  const currentType = WALKTHROUGH_ORDER[step]
  const info = TEST_TYPES.find(t => t.id === currentType)!

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 4, padding: '12px 24px', borderBottom: '1px solid #e5e7eb', overflowX: 'auto' }}>
        {WALKTHROUGH_ORDER.map((type, i) => (
          <button
            key={type}
            onClick={() => setStep(i)}
            style={{
              flexShrink: 0,
              padding: '6px 12px',
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              background: i === step ? '#3b82f6' : i < step ? '#dcfce7' : '#f3f4f6',
              color: i === step ? 'white' : i < step ? '#16a34a' : '#6b7280',
            }}
          >
            {i + 1}. {type}
          </button>
        ))}
      </div>

      {/* Current step content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <TestExplorer
          info={info}
          result={results[currentType]}
          onClose={() => {}}
        />
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 24px', borderTop: '1px solid #e5e7eb', background: '#f9fafb',
      }}>
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          style={{
            padding: '8px 24px', borderRadius: 4, border: '1px solid #d1d5db',
            background: 'white', cursor: step === 0 ? 'not-allowed' : 'pointer',
            color: step === 0 ? '#9ca3af' : '#111827',
          }}
        >
          ← Previous
        </button>
        <span style={{ color: '#6b7280', fontSize: 13 }}>
          Step {step + 1} of {WALKTHROUGH_ORDER.length}
        </span>
        <button
          onClick={() => setStep(s => s + 1)}
          disabled={step === WALKTHROUGH_ORDER.length - 1}
          style={{
            padding: '8px 24px', borderRadius: 4, border: 'none',
            background: step === WALKTHROUGH_ORDER.length - 1 ? '#9ca3af' : '#3b82f6',
            color: 'white', cursor: step === WALKTHROUGH_ORDER.length - 1 ? 'not-allowed' : 'pointer',
          }}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 13: Create `apps/dashboard/frontend/src/components/Dashboard.tsx`**

```tsx
import { useState } from 'react'
import { TestType, RunResult } from '../types'
import { TEST_TYPES } from '../data/testTypes'
import { TestCard } from './TestCard'

const API = import.meta.env.VITE_DASHBOARD_API ?? 'http://localhost:3002'

interface Props {
  results: Record<TestType, RunResult>
  onRefresh: () => void
  onSelect: (type: TestType) => void
}

export function Dashboard({ results, onRefresh, onSelect }: Props) {
  const [runningAll, setRunningAll] = useState(false)

  const handleRun = async (testType: TestType, showFailures: boolean) => {
    await fetch(`${API}/run/${testType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showFailures }),
    })
    onRefresh()
  }

  const handleRunAll = async () => {
    setRunningAll(true)
    for (const { id } of TEST_TYPES) {
      await fetch(`${API}/run/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showFailures: false }),
      })
      // Poll until this suite finishes before starting next
      await new Promise<void>(resolve => {
        const interval = setInterval(async () => {
          onRefresh()
          const all = await fetch(`${API}/results`).then(r => r.json())
          if (all[id]?.status !== 'running') {
            clearInterval(interval)
            resolve()
          }
        }, 500)
      })
    }
    setRunningAll(false)
    onRefresh()
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>All Test Suites</h2>
        <button
          onClick={handleRunAll}
          disabled={runningAll}
          style={{
            padding: '8px 20px',
            background: runningAll ? '#9ca3af' : '#111827',
            color: 'white', border: 'none', borderRadius: 6,
            cursor: runningAll ? 'not-allowed' : 'pointer',
            fontWeight: 600, fontSize: 14,
          }}
        >
          {runningAll ? 'Running All...' : 'Run All'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {TEST_TYPES.map(info => (
          <TestCard
            key={info.id}
            testType={info.id}
            result={results[info.id]}
            onRun={handleRun}
            onClick={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 14: Create `apps/dashboard/frontend/src/App.tsx`**

```tsx
import { useState, useEffect, useCallback } from 'react'
import { TestType, RunResult } from './types'
import { TEST_TYPES } from './data/testTypes'
import { TestingTrophy } from './components/TestingTrophy'
import { TestExplorer } from './components/TestExplorer'
import { GuidedWalkthrough } from './components/GuidedWalkthrough'
import { Dashboard } from './components/Dashboard'

type View = 'trophy' | 'walkthrough' | 'dashboard'

const API = import.meta.env.VITE_DASHBOARD_API ?? 'http://localhost:3002'

const defaultResults = (): Record<TestType, RunResult> =>
  Object.fromEntries(
    TEST_TYPES.map(t => [
      t.id,
      { testType: t.id, status: 'idle', duration: null, exitCode: null, output: '', startedAt: null, completedAt: null },
    ])
  ) as Record<TestType, RunResult>

export function App() {
  const [view, setView] = useState<View>('trophy')
  const [results, setResults] = useState<Record<TestType, RunResult>>(defaultResults())
  const [selected, setSelected] = useState<TestType | null>(null)

  const fetchResults = useCallback(async () => {
    try {
      const data = await fetch(`${API}/results`).then(r => r.json())
      setResults(data)
    } catch {
      // Dashboard API not running — keep idle defaults
    }
  }, [])

  useEffect(() => {
    fetchResults()
    const interval = setInterval(fetchResults, 2000)
    return () => clearInterval(interval)
  }, [fetchResults])

  const selectedInfo = selected ? TEST_TYPES.find(t => t.id === selected) : null

  const NAV_ITEMS: { key: View; label: string }[] = [
    { key: 'trophy', label: 'Testing Map' },
    { key: 'walkthrough', label: 'Walkthrough' },
    { key: 'dashboard', label: 'Dashboard' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 24px', background: '#111827', height: 52, flexShrink: 0 }}>
        <span style={{ color: 'white', fontWeight: 700, fontSize: 17, marginRight: 20 }}>
          Testing Showcase
        </span>
        {NAV_ITEMS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setView(key); setSelected(null) }}
            style={{
              padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: view === key ? '#3b82f6' : 'rgba(255,255,255,0.1)',
              color: 'white', fontWeight: view === key ? 600 : 400, fontSize: 13,
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {selectedInfo ? (
          <TestExplorer
            info={selectedInfo}
            result={results[selected!]}
            onClose={() => setSelected(null)}
          />
        ) : view === 'trophy' ? (
          <TestingTrophy results={results} onSelect={setSelected} selected={selected} />
        ) : view === 'walkthrough' ? (
          <GuidedWalkthrough results={results} />
        ) : (
          <Dashboard results={results} onRefresh={fetchResults} onSelect={setSelected} />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 15: Create `apps/dashboard/frontend/src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 16: Install deps and run**

```bash
cd apps/dashboard/frontend
pnpm install
pnpm dev
```

Expected: Vite dev server on `http://localhost:5174`.

Open in browser. Verify:
- Nav renders with "Testing Map", "Walkthrough", "Dashboard"
- Testing Trophy shows all 8 types (all badges grey/idle)
- Clicking a type opens TestExplorer with code + explanation
- Walkthrough shows step 1 (unit) with navigation
- Dashboard shows 8 cards

Start backend in another terminal and verify "Run" triggers a test and streams output.

- [ ] **Step 17: Commit**

```bash
cd ../../..
git add apps/dashboard/frontend
git commit -m "feat: add dashboard frontend (testing trophy, walkthrough, dashboard, SSE terminal)"
```

---

## Task 14: Wire Up Root Dev Scripts

**Files:**
- Modify: `package.json` (root)

- [ ] **Step 1: Verify `pnpm dev` starts all 4 servers**

```bash
pnpm install  # ensure concurrently is installed at root
pnpm dev
```

Expected: 4 labeled processes start:
```
[sb-api]   Sample app API running on http://localhost:3001
[sb-ui]    VITE v5.x.x  ready in Xms  ➜  Local: http://localhost:5173
[dash-api] Dashboard API running on http://localhost:3002
[dash-ui]  VITE v5.x.x  ready in Xms  ➜  Local: http://localhost:5174
```

- [ ] **Step 2: Smoke test all 4 endpoints**

In a separate terminal while `pnpm dev` is running:
```bash
curl http://localhost:3001/health   # → {"status":"ok"}
curl http://localhost:3002/health   # → {"status":"ok"}
# Open http://localhost:5173 — Task Manager app
# Open http://localhost:5174 — Dashboard
```

- [ ] **Step 3: Run all non-browser test suites from root**

```bash
pnpm test:all
```

Expected: Unit, integration, snapshot, and security suites all pass.

Note: E2E, contract, accessibility, and performance suites require separate setup (Playwright browsers, k6 binary). They are excluded from `test:all` intentionally — see each suite's README.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "chore: verify dev script + all test suites wired up"
```

---

## Self-Review Checklist

- [x] **Spec coverage:**
  - Sample app backend (Express, in-memory store, utils, routes) → Tasks 2
  - Sample app frontend (React components, API client) → Task 3
  - Unit tests → Task 4
  - Integration tests → Task 5
  - E2E tests → Task 6
  - Contract tests → Task 7
  - Snapshot tests → Task 8
  - Performance tests → Task 9
  - Security tests → Task 10
  - Accessibility tests → Task 11
  - Dashboard backend (SSE, test runner) → Task 12
  - Dashboard frontend (trophy, explorer, walkthrough, dashboard) → Task 13
  - `SHOW_FAILURES=true` flag in every test suite → ✅ in Tasks 4–11
  - Root `pnpm dev` wiring → Task 14

- [x] **Type consistency:** `TestType` is defined identically in `dashboard/backend/src/types.ts` and `dashboard/frontend/src/types.ts`. `RunResult` structure matches between store, routes, and frontend.

- [x] **No placeholders:** All steps contain complete code. No "TBD" or "handle edge cases" language.

- [x] **k6 note:** k6 is a separate binary — documented in Task 9 README and excluded from `pnpm test:all`.

- [x] **ZAP note:** OWASP ZAP is optional — `zap-scan.sh` exits gracefully if not installed.

- [x] **Pact ordering:** Consumer test must run before provider (generates pact file). Task 7 enforces this.
