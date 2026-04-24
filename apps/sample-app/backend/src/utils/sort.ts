import { Task } from '../types'

const PRIORITY_ORDER: Record<Task['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
}

export const sortByPriority = (tasks: Task[]): Task[] =>
  [...tasks].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
