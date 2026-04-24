import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // ramp up to 10 VUs
    { duration: '30s', target: 10 },  // hold at 10 VUs
    { duration: '30s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
  },
}

const BASE = 'http://localhost:3001'

export default function () {
  const list = http.get(`${BASE}/tasks`)
  check(list, { 'list tasks returns 200': (r) => r.status === 200 })

  const create = http.post(
    `${BASE}/tasks`,
    JSON.stringify({ title: `Task ${Date.now()}`, priority: 'low' }),
    { headers: { 'Content-Type': 'application/json' } }
  )
  check(create, { 'create task returns 201': (r) => r.status === 201 })

  sleep(1)
}
