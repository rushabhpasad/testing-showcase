# End-to-End Tests

**What:** Simulate real user interactions in an actual browser. Tests the full stack together.

**Tool:** Playwright

**When to use:** For critical user flows — creating, completing, deleting, and filtering tasks.

**Setup (one-time):**
```bash
pnpm install:browsers
```

**Run:**
```bash
pnpm test
pnpm test:failures   # show intentional failure examples
pnpm test:ui         # open Playwright UI for debugging
```

The backend and frontend start automatically before the test run.

**What failures demonstrate:**
- Clicking a missing button → Playwright timeout with selector info
- Visibility assertion failure → clear expected vs received state

**Trade-offs:**
- ✅ Highest confidence — tests exactly what the user does in a real browser
- ✅ Catches frontend + backend integration bugs
- ❌ Slowest test type (seconds per test)
- ❌ Brittle if selectors or UI flows change frequently
