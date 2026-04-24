# Performance Tests (k6)

Performance tests for the Task Manager backend, using [k6](https://k6.io/) — a developer-centric load testing tool.

## What is performance testing?

Performance testing verifies your system behaves correctly under load. Without it, you discover bottlenecks in production — under real user pressure, not in a controlled test environment.

Key concerns:
- **Response time**: Does latency stay acceptable as concurrency increases?
- **Error rate**: Does the API start returning errors under load?
- **Stability**: Does the system recover after a traffic spike?

## Test types

| Test | VUs | Duration | Purpose |
|------|-----|----------|---------|
| **Smoke** | 1 | 30s | Sanity check — confirm the API works at minimal load before heavier tests |
| **Load** | up to 10 | ~90s | Simulate expected concurrent users; validate throughput and latency at normal traffic |
| **Spike** | burst to 50 | ~50s | Sudden traffic burst — verify the system handles unexpected surges and recovers |

## Prerequisites

### 1. Install k6

k6 is a standalone binary, not an npm package. Install it separately:

```bash
brew install k6
```

Verify installation:

```bash
k6 version
```

### 2. Start the backend

The backend must be running on port 3001 before executing any test:

```bash
pnpm --filter sample-app-backend dev
```

## Running the tests

```bash
# Smoke test (1 VU, 30s) — run this first
pnpm test

# Load test (ramp to 10 VUs over 90s)
pnpm test:load

# Spike test (burst to 50 VUs)
pnpm test:spike

# Smoke test with a deliberate failing check (for demo purposes)
pnpm test:failures
```

Or call k6 directly:

```bash
k6 run src/smoke.js
k6 run src/load.js
k6 run src/spike.js
```

## Reading k6 output

A typical k6 run prints:

```
scenarios: (100.00%) 1 scenario, 1 max VUs, 1m0s max duration
default: 1 looping VUs for 30s (gracefulStop: 30s)

✓ health check returns 200
✓ create task returns 201
✓ list tasks returns 200

checks.........................: 100.00% ✓ 87  ✗ 0
data_received..................: 24 kB   800 B/s
http_req_duration..............: avg=3.2ms  min=1.1ms  med=2.8ms  max=18ms p(90)=5ms  p(95)=6ms
http_req_failed................: 0.00%  ✓ 0  ✗ 87
iterations.....................: 87     2.9/s
vus............................: 1      min=1 max=1
```

Key metrics:

- **VUs** — virtual users (concurrent simulated users)
- **iterations** — total times the default function completed
- **http_req_duration** — latency breakdown; focus on `p(95)` and `p(99)` (tail latency)
- **http_req_failed** — percentage of requests that returned an HTTP error (4xx/5xx or network error)
- **checks** — pass/fail counts for your explicit `check()` assertions

## Thresholds

Thresholds are SLO-style pass/fail criteria defined in `options.thresholds`. k6 exits with a non-zero code if any threshold is breached — useful in CI to gate deploys.

Examples used here:

| Test | Threshold | Meaning |
|------|-----------|---------|
| Smoke | `p(95)<500` | 95% of requests must complete under 500ms |
| Smoke | `rate<0.01` | Less than 1% of requests may fail |
| Load | `p(95)<1000` | 95th percentile under 1s at 10 VUs |
| Spike | `p(99)<2000` | 99th percentile under 2s during burst |

If a threshold fails, k6 prints `✗` next to the metric and exits with code 99.
