import { describe, it, beforeAll, afterAll } from 'vitest'
import { Verifier } from '@pact-foundation/pact'
import http from 'http'
import path from 'path'
import type { AddressInfo } from 'net'
import { app } from '../../../../apps/sample-app/backend/src/app'
import { reset, seed } from '../../../../apps/sample-app/backend/src/store/tasks.store'

let server: http.Server
let port: number

beforeAll(async () => {
  reset()
  server = http.createServer(app)
  await new Promise<void>((resolve) => server.listen(0, resolve))
  port = (server.address() as AddressInfo).port
})

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  )
})

describe('Provider verification — task-manager-backend', () => {
  it('satisfies the consumer contract', async () => {
    const verifier = new Verifier({
      providerBaseUrl: `http://localhost:${port}`,
      pactUrls: [
        path.resolve('./pacts/task-manager-frontend-task-manager-backend.json'),
      ],
      logLevel: 'warn',
      stateHandlers: {
        'tasks exist': async () => {
          reset()
          seed({ id: 'abc-123', title: 'Buy milk', priority: 'medium', completed: false, createdAt: '2024-01-01T00:00:00.000Z' })
        },
        'a task exists with id task-id-123': async () => {
          reset()
          seed({
            id: 'task-id-123',
            title: 'Some task',
            priority: 'medium',
            completed: false,
            createdAt: '2024-01-01T00:00:00.000Z',
          })
        },
      },
    })

    await verifier.verifyProvider()
  })
})
