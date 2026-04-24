import { Task } from '../types'

export const filterByStatus = (
  tasks: Task[],
  status: 'active' | 'completed' | 'all'
): Task[] => {
  if (status === 'all') return tasks
  return tasks.filter(t => (status === 'completed') === t.completed)
}

export const filterByPriority = (
  tasks: Task[],
  priority: Task['priority'] | 'all'
): Task[] => {
  if (priority === 'all') return tasks
  return tasks.filter(t => t.priority === priority)
}
