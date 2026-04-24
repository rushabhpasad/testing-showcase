# Contract Tests (Pact)

Consumer-driven contract testing using [Pact](https://docs.pact.io/).

## What is contract testing?

In a consumer-driven contract test:
1. The **consumer** (frontend) defines what it expects from the **provider** (backend) — the shape and status of responses.
2. Those expectations are encoded in a **pact file** (a JSON contract).
3. The **provider** runs the pact file against the real backend to verify it can satisfy every interaction the consumer defined.

Neither side needs the other running at the same time. The pact file is the shared artifact.

## How it works here

```
Consumer test (src/consumer.test.ts)
  → spins up a Pact mock server
  → frontend makes real HTTP calls against the mock
  → Pact records each interaction
  → writes pacts/task-manager-frontend-task-manager-backend.json

Provider test (src/provider.test.ts)
  → starts the real Express backend on an ephemeral port
  → replays every interaction from the pact file against it
  → fails if any response doesn't match the contract
```

## Running

**Step 1 — Generate the pact (consumer side):**

```bash
pnpm test
```

This runs `src/consumer.test.ts` and writes the pact file to `./pacts/`.

**Step 2 — Verify against the real backend (provider side):**

```bash
pnpm test:provider
```

This runs `src/provider.test.ts`, starts the Express app, and replays all interactions from the pact file.

**See a failure example:**

```bash
pnpm test:failures   # generates a pact with an "owner" field the backend doesn't return
pnpm test:provider   # provider verification fails — contract broken
```

## The pact file

`pacts/task-manager-frontend-task-manager-backend.json` contains a machine-readable description of every interaction:

- The request (method, path, headers, body)
- The expected response (status, headers, body shape using matchers)

The pact file is committed to the repo so learners can inspect what a real contract looks like.

## Covered interactions

| # | Interaction | Consumer assertion |
|---|-------------|-------------------|
| 1 | `GET /tasks` | Returns an array with task shape (id, title, priority, completed, createdAt) |
| 2 | `POST /tasks` | Returns 201 with created task shape |
| 3 | `PATCH /tasks/:id` | Returns 200 with updated task shape |
