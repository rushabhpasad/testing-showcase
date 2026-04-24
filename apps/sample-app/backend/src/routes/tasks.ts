import { Router } from 'express'
import * as store from '../store/tasks.store'
import { sortByPriority } from '../utils/sort'
import { filterByStatus, filterByPriority } from '../utils/filter'
import { validateTask } from '../utils/validate'

export const tasksRouter = Router()

tasksRouter.get('/', (req, res) => {
  let tasks = store.getAll()
  const { status, priority } = req.query
  if (status && status !== 'all') {
    tasks = filterByStatus(tasks, status as 'active' | 'completed')
  }
  if (priority && priority !== 'all') {
    tasks = filterByPriority(tasks, priority as 'high' | 'medium' | 'low')
  }
  res.json(sortByPriority(tasks))
})

tasksRouter.post('/', (req, res) => {
  const errors = validateTask(req.body)
  if (errors.length > 0) return res.status(400).json({ errors })
  const { title, priority } = req.body
  const task = store.create(title, priority)
  res.status(201).json(task)
})

tasksRouter.patch('/:id', (req, res) => {
  const task = store.update(req.params.id, req.body)
  if (!task) return res.status(404).json({ error: 'Task not found' })
  res.json(task)
})

tasksRouter.delete('/:id', (req, res) => {
  const deleted = store.remove(req.params.id)
  if (!deleted) return res.status(404).json({ error: 'Task not found' })
  res.status(204).send()
})
