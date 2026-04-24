import { Router } from 'express'
import { spawn } from 'child_process'
import path from 'path'
import { suites } from '../suites.config'

export const suitesRouter = Router()

suitesRouter.get('/', (_req, res) => {
  res.json(suites)
})

suitesRouter.get('/:id', (req, res) => {
  const suite = suites.find(s => s.id === req.params.id)
  if (!suite) {
    res.status(404).json({ error: 'Suite not found' })
    return
  }
  res.json(suite)
})

suitesRouter.get('/:id/run', (req, res) => {
  const suite = suites.find(s => s.id === req.params.id)
  if (!suite) {
    res.status(404).json({ error: 'Suite not found' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  // Resolve monorepo root: compiled output is at dist/ inside the package,
  // so __dirname is apps/dashboard/backend/dist — 4 levels up is monorepo root
  const monoRoot = path.resolve(__dirname, '../../../..')
  const cwd = path.join(monoRoot, suite.cwd)

  // Use shell:true so the OS resolves `pnpm` via the shell's PATH, matching what
  // the terminal does. Commands come from a static config file — no user input —
  // so there is no injection risk here.
  const child = spawn(suite.command, {
    cwd,
    env: { ...process.env, FORCE_COLOR: '0' },
    shell: true,
  })

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  child.stdout.on('data', (chunk: Buffer) => send('output', chunk.toString()))
  child.stderr.on('data', (chunk: Buffer) => send('output', chunk.toString()))

  child.on('error', (err) => {
    send('output', `[error] Failed to start process: ${err.message}`)
    res.end()
  })

  child.on('close', (code) => {
    send('done', { exitCode: code })
    res.end()
  })

  req.on('close', () => {
    child.kill()
  })
})
