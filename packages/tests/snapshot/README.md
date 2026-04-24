# Snapshot Tests

Snapshot tests capture the rendered HTML output of React components and save it to `.snap` files. On each subsequent run, the rendered output is compared against the saved snapshot — any diff causes the test to fail, catching unintended UI regressions automatically.

## Running tests

```bash
# Run all snapshot tests once
pnpm test

# Run in watch mode (re-runs on file changes)
pnpm test:watch

# Update snapshots when component changes are intentional
pnpm test:update

# Run including the failure example (shows what a snapshot mismatch looks like)
pnpm test:failures
```

## How snapshots work

1. **First run**: No `.snap` files exist yet. Vitest creates them in `src/__snapshots__/` and the tests pass.
2. **Subsequent runs**: The rendered output is compared against the saved `.snap` file. Diffs fail the test.
3. **Intentional changes**: If you change a component on purpose, run `pnpm test:update` to regenerate the snapshots. Review the diff before committing.

Snapshot files (`src/__snapshots__/*.snap`) should be committed to version control — they are the source of truth for expected output.

## When snapshots are useful

- Detecting accidental HTML/CSS class changes during refactors
- Verifying that a component's output doesn't regress after dependency upgrades
- Quick coverage for components where the exact markup matters (e.g., data-driven tables, email templates)

## When snapshots become a maintenance burden

- Components that change frequently — every intentional change requires `--update-snapshots`, and reviewers must manually verify the diffs are correct
- Components with dynamic data (dates, IDs, random values) — snapshots become flaky without stable fixtures
- Large, deeply nested components — snapshot diffs are hard to read and easy to blindly accept
- As a substitute for behavioural tests — snapshots don't tell you *why* something broke, only *what* changed

**Rule of thumb**: use snapshots for stable, presentational components. Use interaction/integration tests for behaviour.
