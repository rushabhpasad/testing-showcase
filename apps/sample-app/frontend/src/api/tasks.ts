import { Task, Priority } from '../types'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export const getTasks = async (params?: {
  status?: string
  priority?: string
}): Promise<Task[]> => {
  const url = new URL(`${BASE}/tasks`)
  if (params?.status && params.status !== 'all') url.searchParams.set('status', params.status)
  if (params?.priority && params.priority !== 'all') url.searchParams.set('priority', params.priority)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Failed to fetch tasks')
  return res.json()
}

export const createTask = async (
  title: string,
  priority: Priority = 'medium'
): Promise<Task> => {
  const res = await fetch(`${BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, priority }),
  })
  if (!res.ok) throw new Error('Failed to create task')
  return res.json()
}

export const updateTask = async (
  id: string,
  updates: Partial<Pick<Task, 'title' | 'priority' | 'completed'>>
): Promise<Task> => {
  const res = await fetch(`${BASE}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error('Failed to update task')
  return res.json()
}

export const deleteTask = async (id: string): Promise<void> => {
  const res = await fetch(`${BASE}/tasks/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete task')
}
