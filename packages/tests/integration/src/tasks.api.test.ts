import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../../../../apps/sample-app/backend/src/app'
import { reset } from '../../../../apps/sample-app/backend/src/store/tasks.store'

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
