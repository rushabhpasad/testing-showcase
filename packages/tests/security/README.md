# Security Tests

Security-focused tests for the Task Manager API using Vitest + Supertest.

## What this suite covers

Security testing at the API layer verifies that the application behaves safely
under adversarial conditions — without requiring a running server or external
tools. It is distinct from functional testing in that we're checking the absence
of dangerous behaviors rather than just correct behavior.

## Test categories

### 1. HTTP Security Headers

Verifies that the server:
- Does **not** expose `X-Powered-By: Express` (fingerprinting vector)
- Does include CORS headers (`Access-Control-Allow-Origin`) configured by middleware

### 2. Input Validation / Injection Attempts

Verifies that malicious or malformed input does not cause server errors:
- **Whitespace-only titles** — rejected with 400
- **SQL injection strings** — stored as plain text or rejected; never causes a 500
- **XSS payloads** — stored as-is (plain text) or rejected; never executed server-side
- **Oversized input** — does not crash the server (status must not be 500)
- **Invalid enum values** — rejected with 400
- **Stack trace leakage** — error responses do not include `Error:` or stack frames

### 3. HTTP Method Enforcement

Verifies that undefined routes return 404 or 405, not unexpected 2xx responses.

## How to run

```bash
pnpm test
```

To see intentional failure examples (for teaching purposes):

```bash
pnpm test:failures
```

## What is NOT covered here

This suite is intentionally scoped to unit/integration-level API security checks.
The following are out of scope for this teaching example:

- **OWASP ZAP / dynamic scanning** — requires a running server and a separate
  scanning tool; adds operational complexity beyond the scope of this demo
- **Penetration testing** — manual or tool-assisted exploitation testing; requires
  dedicated security expertise and environments
- **Authentication and authorization** — the sample app has no auth layer; tests
  for JWT validation, session management, rate limiting, etc. would be added here
  in a real application
- **TLS / HTTPS configuration** — handled at the infrastructure level (load
  balancer, reverse proxy), not in application code tests
