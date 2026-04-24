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
