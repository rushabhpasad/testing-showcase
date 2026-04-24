export type Priority = 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: string
  priority: Priority
  completed: boolean
  createdAt: string
}

export interface ValidationError {
  field: string
  message: string
}
