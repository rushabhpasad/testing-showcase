import { Router } from 'express'
import * as store from '../store/tasks.store'
import { sortByPriority } from '../utils/sort'
import { filterByStatus, filterByPriority } from '../utils/filter'
import { validateTask } from '../utils/validate'
import { Task } from '../types'

export const tasksRouter = Router()

const VALID_STATUSES = ['active', 'completed', 'all'] as const
const VALID_PRIORITIES: Array<Task['priority'] | 'all'> = ['high', 'medium', 'low', 'all']

tasksRouter.get('/', (req, res) => {
  let tasks = store.getAll()
  const { status, priority } = req.query

  if (status && typeof status === 'string') {
    if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` })
    }
    if (status !== 'all') {
      tasks = filterByStatus(tasks, status as 'active' | 'completed')
    }
  }

  if (priority && typeof priority === 'string') {
    if (!VALID_PRIORITIES.includes(priority as Task['priority'] | 'all')) {
      return res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` })
    }
    if (priority !== 'all') {
      tasks = filterByPriority(tasks, priority as Task['priority'])
    }
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
  const { title, priority, completed } = req.body
  const updates: Partial<Pick<Task, 'title' | 'priority' | 'completed'>> = {}
  if (title !== undefined) updates.title = title
  if (priority !== undefined) updates.priority = priority
  if (completed !== undefined) updates.completed = completed
  const task = store.update(req.params.id, updates)
  if (!task) return res.status(404).json({ error: 'Task not found' })
  res.json(task)
})

tasksRouter.delete('/:id', (req, res) => {
  const deleted = store.remove(req.params.id)
  if (!deleted) return res.status(404).json({ error: 'Task not found' })
  res.status(204).send()
})
