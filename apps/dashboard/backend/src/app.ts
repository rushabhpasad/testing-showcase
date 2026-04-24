import express from 'express'
import cors from 'cors'
import { suitesRouter } from './routes/suites'

export const app = express()

app.disable('x-powered-by')
app.use(cors())
app.use(express.json())
app.use('/suites', suitesRouter)
app.get('/health', (_req, res) => res.json({ status: 'ok' }))
