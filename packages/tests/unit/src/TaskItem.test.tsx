import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TaskItem } from '../../../../apps/sample-app/frontend/src/components/TaskItem'
import type { Task } from '../../../../apps/sample-app/frontend/src/types'

const task: Task = {
  id: '1',
  title: 'Write tests',
  priority: 'high',
  completed: false,
  createdAt: '2024-01-01T00:00:00.000Z',
}

describe('TaskItem', () => {
  it('renders the task title', () => {
    render(<TaskItem task={task} onToggle={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Write tests')).toBeInTheDocument()
  })

  it('renders the priority label', () => {
    render(<TaskItem task={task} onToggle={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText(/high/i)).toBeInTheDocument()
  })

  it('calls onToggle with id and new completed state when checkbox clicked', () => {
    const onToggle = vi.fn()
    render(<TaskItem task={task} onToggle={onToggle} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('1', true)
  })

  it('calls onDelete with task id when delete button clicked', () => {
    const onDelete = vi.fn()
    render(<TaskItem task={task} onToggle={vi.fn()} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('applies line-through style when task is completed', () => {
    const completed = { ...task, completed: true }
    render(<TaskItem task={completed} onToggle={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Write tests')).toHaveStyle('text-decoration: line-through')
  })
})

const showFailures = process.env.SHOW_FAILURES === 'true'

describe.skipIf(!showFailures)('[FAILURE EXAMPLE] TaskItem', () => {
  it('fails: queries for text that does not exist in the DOM', () => {
    render(<TaskItem task={task} onToggle={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('This text does not exist')).toBeInTheDocument()
  })
})
