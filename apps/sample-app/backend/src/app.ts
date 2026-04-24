import express from 'express'
import cors from 'cors'
import { tasksRouter } from './routes/tasks'

export const app = express()

app.disable('x-powered-by')
app.use(cors())
app.use(express.json())
app.use('/tasks', tasksRouter)
app.get('/health', (_req, res) => res.json({ status: 'ok' }))
