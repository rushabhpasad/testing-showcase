# Accessibility Tests

Automated WCAG 2.1 AA accessibility testing using [axe-core](https://github.com/dequelabs/axe-core) and [Playwright](https://playwright.dev/).

## What is accessibility testing?

**WCAG 2.1 AA** (Web Content Accessibility Guidelines) is the internationally recognized standard for web accessibility. It defines criteria across four principles: content must be **Perceivable**, **Operable**, **Understandable**, and **Robust** (POUR).

Achieving WCAG 2.1 AA means your application is usable by people with visual, motor, auditory, and cognitive disabilities — and is often a legal requirement (ADA, EU Accessibility Act, etc.).

## What axe-core detects automatically

axe-core catches a wide range of violations programmatically (~57% of WCAG issues):

- Missing or empty `alt` text on images
- Insufficient color contrast ratios (text vs background)
- Form inputs without associated labels
- Invalid or misused ARIA roles and attributes
- Missing document language (`<html lang="...">`)
- Duplicate `id` attributes
- Headings out of logical order
- Interactive elements not reachable via keyboard (some cases)
- Links or buttons with no accessible name

### What axe-core cannot detect

Automated tools cannot cover everything — human review is still required for:

- **Keyboard navigation flow** — whether tab order makes logical sense
- **Screen reader experience** — how a real screen reader (VoiceOver, NVDA) announces content
- **Cognitive accessibility** — clarity of language, layout complexity
- **User testing** — real users with disabilities finding friction points

## Prerequisites

1. Install Node dependencies from the monorepo root:
   ```bash
   pnpm install
   ```

2. Install Playwright browsers (one-time setup):
   ```bash
   pnpm --filter tests-accessibility install:browsers
   ```

The test suite auto-starts both the frontend (port 5173) and backend (port 3001) via Playwright's `webServer` configuration, so you do not need to start them manually.

## Running the tests

```bash
# Run all accessibility tests
pnpm --filter tests-accessibility test

# Run from inside the package directory
cd packages/tests/accessibility
pnpm test
```

## Demonstrating a failure

A failure example is included but skipped by default. To see what a violation looks like:

```bash
pnpm --filter tests-accessibility test:failures
```

This injects an `<img>` with no `alt` attribute and expects axe to pass — it won't, demonstrating a real WCAG 1.1.1 (Non-text Content) violation.

## Interpreting violations output

When axe finds violations, each entry in `results.violations` looks like:

```json
{
  "id": "image-alt",
  "impact": "critical",
  "description": "Ensures <img> elements have alternative text or a role of none or presentation",
  "helpUrl": "https://dequeuniversity.com/rules/axe/4.8/image-alt",
  "nodes": [
    {
      "html": "<img src=\"https://example.com/img.png\">",
      "failureSummary": "Fix any of the following: Element does not have an alt attribute"
    }
  ]
}
```

Key fields:

| Field | Meaning |
|-------|---------|
| `id` | axe rule ID (maps to a specific WCAG criterion) |
| `impact` | Severity: `critical`, `serious`, `moderate`, `minor` |
| `description` | Human-readable explanation of the rule |
| `helpUrl` | Link to Deque University with full details and fixes |
| `nodes[].html` | The actual DOM element that failed |
| `nodes[].failureSummary` | Specific reason and how to fix it |

To debug interactively, log violations to the console:

```typescript
const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
console.log(JSON.stringify(results.violations, null, 2))
```
