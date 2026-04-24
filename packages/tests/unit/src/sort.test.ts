import { describe, it, expect } from 'vitest'
import { sortByPriority } from '../../../../apps/sample-app/backend/src/utils/sort'
import type { Task } from '../../../../apps/sample-app/backend/src/types'

const make = (id: string, priority: Task['priority']): Task => ({
  id, title: `Task ${id}`, priority, completed: false, createdAt: '2024-01-01T00:00:00.000Z',
})

describe('sortByPriority', () => {
  it('sorts high before medium before low', () => {
    const result = sortByPriority([make('1', 'low'), make('2', 'high'), make('3', 'medium')])
    expect(result.map(t => t.priority)).toEqual(['high', 'medium', 'low'])
  })

  it('returns a new array without mutating the input', () => {
    const input = [make('1', 'low'), make('2', 'high')]
    const result = sortByPriority(input)
    expect(result).not.toBe(input)
    expect(input[0].priority).toBe('low') // input unchanged
  })

  it('handles an empty array', () => {
    expect(sortByPriority([])).toEqual([])
  })

  it('preserves order for equal priorities', () => {
    const input = [make('1', 'medium'), make('2', 'medium')]
    expect(sortByPriority(input).map(t => t.id)).toEqual(['1', '2'])
  })
})

const showFailures = process.env.SHOW_FAILURES === 'true'

describe.skipIf(!showFailures)('[FAILURE EXAMPLE] sortByPriority', () => {
  it('fails: asserts wrong sort order to show failure output', () => {
    const result = sortByPriority([make('1', 'low'), make('2', 'high')])
    // Wrong expectation — demonstrates what a failing unit test looks like
    expect(result.map(t => t.priority)).toEqual(['low', 'high'])
  })
})
