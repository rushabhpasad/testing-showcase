import { describe, it, expect } from 'vitest'
import { validateTask } from '../../../../apps/sample-app/backend/src/utils/validate'

describe('validateTask', () => {
  it('returns no errors for valid input with all fields', () => {
    expect(validateTask({ title: 'Buy milk', priority: 'high' })).toEqual([])
  })

  it('returns no errors when priority is omitted (optional field)', () => {
    expect(validateTask({ title: 'Buy milk' })).toEqual([])
  })

  it('returns error when title is missing', () => {
    const errors = validateTask({ priority: 'low' })
    expect(errors).toContainEqual(expect.objectContaining({ field: 'title' }))
  })

  it('returns error when title is an empty string', () => {
    const errors = validateTask({ title: '   ' })
    expect(errors).toContainEqual(expect.objectContaining({ field: 'title' }))
  })

  it('returns error when title exceeds 200 characters', () => {
    const errors = validateTask({ title: 'a'.repeat(201) })
    expect(errors).toContainEqual(expect.objectContaining({ field: 'title' }))
  })

  it('returns error for invalid priority value', () => {
    const errors = validateTask({ title: 'Test', priority: 'urgent' })
    expect(errors).toContainEqual(expect.objectContaining({ field: 'priority' }))
  })

  it('returns error when body is not an object', () => {
    const errors = validateTask('not-an-object')
    expect(errors).toContainEqual(expect.objectContaining({ field: 'body' }))
  })
})

const showFailures = process.env.SHOW_FAILURES === 'true'

describe.skipIf(!showFailures)('[FAILURE EXAMPLE] validateTask', () => {
  it('fails: expects error on valid input', () => {
    const errors = validateTask({ title: 'Valid task', priority: 'low' })
    expect(errors.length).toBeGreaterThan(0)
  })
})
