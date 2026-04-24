import { ValidationError } from '../types'

export const validateTask = (input: unknown): ValidationError[] => {
  const errors: ValidationError[] = []
  if (typeof input !== 'object' || input === null) {
    return [{ field: 'body', message: 'Request body must be an object' }]
  }
  const { title, priority } = input as Record<string, unknown>
  if (typeof title !== 'string' || title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title is required' })
  }
  if (typeof title === 'string' && title.length > 200) {
    errors.push({ field: 'title', message: 'Title must be 200 characters or fewer' })
  }
  if (priority !== undefined && !['high', 'medium', 'low'].includes(priority as string)) {
    errors.push({ field: 'priority', message: 'Priority must be high, medium, or low' })
  }
  return errors
}
