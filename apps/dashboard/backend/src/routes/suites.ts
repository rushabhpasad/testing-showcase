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
  if (!suite) return res.status(404).json({ error: 'Suite not found' })
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

  const monoRoot = path.resolve(__dirname, '../../../..')
  const cwd = path.join(monoRoot, suite.cwd)

  const [program, ...args] = suite.command.split(' ')

  const child = spawn(program, args, {
    cwd,
    env: { ...process.env, FORCE_COLOR: '0' },
    shell: true,
  })

  const send = (event: string, data: string) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  child.stdout.on('data', (chunk: Buffer) => send('output', chunk.toString()))
  child.stderr.on('data', (chunk: Buffer) => send('output', chunk.toString()))

  child.on('close', (code) => {
    send('done', JSON.stringify({ exitCode: code }))
    res.end()
  })

  req.on('close', () => {
    child.kill()
  })
})
