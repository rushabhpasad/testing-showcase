import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../../../../apps/sample-app/backend/src/app'
import { reset } from '../../../../apps/sample-app/backend/src/store/tasks.store'

beforeEach(() => reset())

describe('Security headers', () => {
  it('does not expose X-Powered-By header', async () => {
    const res = await request(app).get('/health')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })

  it('includes CORS headers in response', async () => {
    const res = await request(app).get('/tasks')
    // CORS middleware adds Access-Control-Allow-Origin
    expect(res.headers['access-control-allow-origin']).toBeDefined()
  })
})

describe('Input validation', () => {
  it('rejects a title that is just whitespace', async () => {
    const res = await request(app).post('/tasks').send({ title: '   ', priority: 'medium' })
    expect(res.status).toBe(400)
  })

  it('handles SQL injection attempt in title gracefully', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: "'; DROP TABLE tasks; --", priority: 'low' })
    // Should create the task (stored as plain text) or 400 — NOT 500
    expect([200, 201, 400]).toContain(res.status)
  })

  it('handles XSS payload in title gracefully', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: '<script>alert("xss")</script>', priority: 'low' })
    // API stores/rejects as plain text — NOT a server error
    expect([201, 400]).toContain(res.status)
    if (res.status === 201) {
      // If stored, the title should be returned as-is (not executed)
      expect(res.body.title).toBe('<script>alert("xss")</script>')
    }
  })

  it('rejects a title exceeding reasonable length', async () => {
    const longTitle = 'A'.repeat(10001)
    const res = await request(app).post('/tasks').send({ title: longTitle, priority: 'low' })
    // Backend should reject oversized input or store it — but NOT crash
    expect(res.status).not.toBe(500)
  })

  it('rejects an invalid priority value', async () => {
    const res = await request(app).post('/tasks').send({ title: 'Test', priority: 'critical' })
    expect(res.status).toBe(400)
  })

  it('does not leak stack traces in error responses', async () => {
    const res = await request(app).post('/tasks').send({ priority: 'low' }) // missing title
    expect(res.status).toBe(400)
    const body = JSON.stringify(res.body)
    expect(body).not.toMatch(/Error:/)
    expect(body).not.toMatch(/at \w+/) // stack trace pattern
  })
})

describe('HTTP method enforcement', () => {
  it('returns 404 or 405 for PUT /tasks (unsupported method)', async () => {
    const res = await request(app).put('/tasks').send({})
    expect([404, 405]).toContain(res.status)
  })
})

const showFailures = process.env.SHOW_FAILURES === 'true'

describe.skipIf(!showFailures)('[FAILURE EXAMPLE] Security failures', () => {
  it('fails: asserts X-Powered-By is present (it should be absent)', async () => {
    const res = await request(app).get('/health')
    // This will fail — X-Powered-By is disabled
    expect(res.headers['x-powered-by']).toBe('Express')
  })

  it('fails: expects server error on injection attempt', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: "'; DROP TABLE tasks; --", priority: 'low' })
    // Will fail — server handles this gracefully, not with 500
    expect(res.status).toBe(500)
  })
})
