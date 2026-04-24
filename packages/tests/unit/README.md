# Unit Tests

**What:** Test individual functions and components in complete isolation — no network, no database.

**Tool:** Vitest + React Testing Library

**When to use:** For all pure utility functions and component rendering logic.

**Run passing tests:**
```bash
pnpm test
```

**Run with intentional failure examples:**
```bash
pnpm test:failures
# or: SHOW_FAILURES=true pnpm test
```

**What failures demonstrate:**
- Wrong assertion value → see Vitest diff output
- Querying for a DOM element that doesn't exist → see "Unable to find element" error

**Trade-offs:**
- ✅ Blazing fast (milliseconds per test)
- ✅ Easy to pinpoint failures — one function at a time
- ❌ Cannot catch bugs that only appear when units work together
