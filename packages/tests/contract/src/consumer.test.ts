import { describe, it } from 'vitest'
import { PactV3, MatchersV3 } from '@pact-foundation/pact'
import path from 'path'

const { like, eachLike } = MatchersV3

const showFailures = process.env.SHOW_FAILURES === 'true'

const provider = new PactV3({
  consumer: 'task-manager-frontend',
  provider: 'task-manager-backend',
  dir: path.resolve('./pacts'),
  logLevel: 'warn',
})

describe('Task Manager API — Consumer Contract', () => {
  it('GET /tasks — returns an array of tasks', () => {
    provider
      .given('tasks exist')
      .uponReceiving('a request to get all tasks')
      .withRequest({
        method: 'GET',
        path: '/tasks',
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: eachLike({
          id: like('abc-123'),
          title: like('Buy milk'),
          priority: like('medium'),
          completed: like(false),
          createdAt: like('2024-01-01T00:00:00.000Z'),
        }),
      })

    return provider.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/tasks`)
      const body = await res.json() as unknown[]

      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
      if (!Array.isArray(body)) throw new Error('Expected array response')
      // Note: we do NOT assert specific values here — the Pact framework itself
      // verifies that the response matches the shape defined in willRespondWith.
      // Consumer tests verify the *contract* (shape + status), not specific data values.
    })
  })

  it('POST /tasks — creates a task and returns 201 with task shape', () => {
    provider
      .given('tasks exist')
      .uponReceiving('a request to create a task')
      .withRequest({
        method: 'POST',
        path: '/tasks',
        headers: { 'Content-Type': 'application/json' },
        body: {
          title: 'Buy milk',
          priority: 'medium',
        },
      })
      .willRespondWith({
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: {
          id: like('abc-123'),
          title: like('Buy milk'),
          priority: like('medium'),
          completed: like(false),
          createdAt: like('2024-01-01T00:00:00.000Z'),
        },
      })

    return provider.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Buy milk', priority: 'medium' }),
      })
      const body = await res.json() as Record<string, unknown>

      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`)
      // Shape check — id must be a string
      if (typeof body.id !== 'string') throw new Error('Expected id to be a string')
    })
  })

  it('PATCH /tasks/:id — updates a task and returns 200 with updated task', () => {
    const taskId = 'task-id-123'

    provider
      .given('a task exists with id task-id-123')
      .uponReceiving('a request to update a task')
      .withRequest({
        method: 'PATCH',
        path: `/tasks/${taskId}`,
        headers: { 'Content-Type': 'application/json' },
        body: {
          completed: true,
        },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          id: like(taskId),
          title: like('Some task'),
          priority: like('medium'),
          completed: like(true),
          createdAt: like('2024-01-01T00:00:00.000Z'),
        },
      })

    return provider.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })
      const body = await res.json() as Record<string, unknown>

      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
      // Type check — verify shape, not value (the Pact framework checks the value)
      if (typeof body.completed !== 'boolean') throw new Error('Expected completed to be boolean')
    })
  })
})

// This block shows a contract that the provider CANNOT satisfy.
// Run with: SHOW_FAILURES=true pnpm test
// Then run pnpm test:provider to see the provider verification fail.
// Skipped by default — set SHOW_FAILURES=true to include it.
describe.skipIf(!showFailures)('[FAILURE EXAMPLE] Consumer expects field provider does not return', () => {
  it('GET /tasks — expects an "owner" field that the backend never returns', () => {
    provider
      .given('tasks exist')
      .uponReceiving('a request to get tasks with owner field')
      .withRequest({
        method: 'GET',
        path: '/tasks',
        query: { includeOwner: 'true' },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: eachLike({
          id: like('abc-123'),
          title: like('Buy milk'),
          priority: like('medium'),
          completed: like(false),
          createdAt: like('2024-01-01T00:00:00.000Z'),
          owner: like('admin'),
        }),
      })

    return provider.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/tasks?includeOwner=true`)
      const body = await res.json() as unknown[]

      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
      if (!Array.isArray(body)) throw new Error('Expected array')
      // Consumer assertion — mock satisfies this since WE defined the mock response.
      // But provider verification will FAIL because the real backend has no "owner" field.
    })
  })
})
