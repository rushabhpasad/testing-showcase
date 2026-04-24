import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '10s', target: 1 },   // warm up
    { duration: '10s', target: 50 },  // spike to 50 VUs
    { duration: '10s', target: 50 },  // hold spike
    { duration: '10s', target: 1 },   // recover
    { duration: '10s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(99)<2000'],
    http_req_failed: ['rate<0.1'],
  },
}

const BASE = 'http://localhost:3001'

export default function () {
  const list = http.get(`${BASE}/tasks`)
  check(list, { 'returns 200 under spike load': (r) => r.status === 200 })
  sleep(0.5)
}
