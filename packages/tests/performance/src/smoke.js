import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95th percentile under 500ms
    http_req_failed: ['rate<0.01'],    // less than 1% failure rate
  },
}

const BASE = 'http://localhost:3001'

export default function () {
  // Health check
  const health = http.get(`${BASE}/health`)
  check(health, { 'health check returns 200': (r) => r.status === 200 })

  // Create a task
  const create = http.post(
    `${BASE}/tasks`,
    JSON.stringify({ title: 'Perf test task', priority: 'medium' }),
    { headers: { 'Content-Type': 'application/json' } }
  )
  check(create, {
    'create task returns 201': (r) => r.status === 201,
    'created task has id': (r) => JSON.parse(r.body).id !== undefined,
  })

  const taskId = JSON.parse(create.body).id

  // Get all tasks
  const list = http.get(`${BASE}/tasks`)
  check(list, {
    'list tasks returns 200': (r) => r.status === 200,
    'list is an array': (r) => Array.isArray(JSON.parse(r.body)),
  })

  // Complete the task
  const update = http.patch(
    `${BASE}/tasks/${taskId}`,
    JSON.stringify({ completed: true }),
    { headers: { 'Content-Type': 'application/json' } }
  )
  check(update, { 'update task returns 200': (r) => r.status === 200 })

  // Delete the task
  const del = http.del(`${BASE}/tasks/${taskId}`)
  check(del, { 'delete task returns 204': (r) => r.status === 204 })

  // SHOW_FAILURES: Demonstrate what a failing check looks like in k6 output.
  // k6 options are static (evaluated before the test run), so thresholds cannot
  // be changed dynamically via env vars. Instead, we use a check that always
  // fails to illustrate k6's failure reporting in the terminal output.
  if (__ENV.SHOW_FAILURES === 'true') {
    // This check always fails — demonstrates what a failed check looks like in k6 output
    check(list, { '[FAILURE EXAMPLE] This check always fails': () => false })
  }

  sleep(1)
}
