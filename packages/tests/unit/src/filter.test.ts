import { describe, it, expect } from 'vitest'
import { filterByStatus, filterByPriority } from '../../../../apps/sample-app/backend/src/utils/filter'
import type { Task } from '../../../../apps/sample-app/backend/src/types'

const make = (id: string, priority: Task['priority'], completed = false): Task => ({
  id, title: `Task ${id}`, priority, completed, createdAt: '2024-01-01T00:00:00.000Z',
})

describe('filterByStatus', () => {
  const tasks = [make('1', 'high', false), make('2', 'medium', true), make('3', 'low', false)]

  it('returns all tasks for status=all', () => {
    expect(filterByStatus(tasks, 'all')).toHaveLength(3)
  })

  it('returns only incomplete tasks for status=active', () => {
    const result = filterByStatus(tasks, 'active')
    expect(result).toHaveLength(2)
    expect(result.every(t => !t.completed)).toBe(true)
  })

  it('returns only completed tasks for status=completed', () => {
    const result = filterByStatus(tasks, 'completed')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })
})

describe('filterByPriority', () => {
  const tasks = [make('1', 'high'), make('2', 'medium'), make('3', 'high')]

  it('returns all tasks for priority=all', () => {
    expect(filterByPriority(tasks, 'all')).toHaveLength(3)
  })

  it('filters to only the given priority', () => {
    expect(filterByPriority(tasks, 'high')).toHaveLength(2)
  })

  it('returns empty array when no tasks match', () => {
    expect(filterByPriority(tasks, 'low')).toHaveLength(0)
  })
})

const showFailures = process.env.SHOW_FAILURES === 'true'

describe.skipIf(!showFailures)('[FAILURE EXAMPLE] filterByStatus', () => {
  it('fails: wrong count — expects 99 active tasks', () => {
    const tasks = [make('1', 'high', false), make('2', 'medium', true)]
    expect(filterByStatus(tasks, 'active')).toHaveLength(99)
  })
})
