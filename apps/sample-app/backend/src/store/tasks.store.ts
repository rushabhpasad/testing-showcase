import { Task, Priority } from '../types'
import { randomUUID } from 'crypto'

let tasks: Task[] = []

export const getAll = (): Task[] => [...tasks]

export const getById = (id: string): Task | undefined =>
  tasks.find(t => t.id === id)

export const create = (title: string, priority: Priority = 'medium'): Task => {
  const task: Task = {
    id: randomUUID(),
    title,
    priority,
    completed: false,
    createdAt: new Date().toISOString(),
  }
  tasks.push(task)
  return task
}

export const update = (
  id: string,
  updates: Partial<Pick<Task, 'title' | 'priority' | 'completed'>>
): Task | null => {
  const idx = tasks.findIndex(t => t.id === id)
  if (idx === -1) return null
  tasks[idx] = { ...tasks[idx], ...updates }
  return tasks[idx]
}

export const remove = (id: string): boolean => {
  const before = tasks.length
  tasks = tasks.filter(t => t.id !== id)
  return tasks.length < before
}

export const reset = (): void => {
  tasks = []
}
