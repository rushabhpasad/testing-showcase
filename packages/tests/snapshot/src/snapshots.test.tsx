import { render } from '@testing-library/react'
import { TaskItem } from '../../../../apps/sample-app/frontend/src/components/TaskItem'
import { TaskForm } from '../../../../apps/sample-app/frontend/src/components/TaskForm'
import { FilterBar } from '../../../../apps/sample-app/frontend/src/components/FilterBar'
import { TaskList } from '../../../../apps/sample-app/frontend/src/components/TaskList'

const baseTask = {
  id: '1',
  title: 'Buy milk',
  priority: 'medium' as const,
  completed: false,
  createdAt: '2024-01-01T00:00:00.000Z',
}
const noop = () => {}

// TaskItem snapshots
it('TaskItem renders an incomplete task', () => {
  const { container } = render(<TaskItem task={baseTask} onToggle={noop} onDelete={noop} />)
  expect(container).toMatchSnapshot()
})

it('TaskItem renders a completed task with strikethrough', () => {
  const { container } = render(
    <TaskItem task={{ ...baseTask, completed: true }} onToggle={noop} onDelete={noop} />
  )
  expect(container).toMatchSnapshot()
})

it('TaskItem renders a high priority task', () => {
  const { container } = render(
    <TaskItem task={{ ...baseTask, priority: 'high' }} onToggle={noop} onDelete={noop} />
  )
  expect(container).toMatchSnapshot()
})

// TaskForm snapshot
it('TaskForm renders with default state', () => {
  const { container } = render(<TaskForm onSubmit={noop} />)
  expect(container).toMatchSnapshot()
})

// FilterBar snapshot
it('FilterBar renders with default filters', () => {
  const { container } = render(
    <FilterBar status="all" priority="all" onStatusChange={noop} onPriorityChange={noop} />
  )
  expect(container).toMatchSnapshot()
})

// TaskList snapshots
it('TaskList renders empty state', () => {
  const { container } = render(<TaskList tasks={[]} onToggle={noop} onDelete={noop} />)
  expect(container).toMatchSnapshot()
})

it('TaskList renders multiple tasks', () => {
  const tasks = [
    {
      id: '1',
      title: 'Buy milk',
      priority: 'high' as const,
      completed: false,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      title: 'Walk dog',
      priority: 'low' as const,
      completed: true,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ]
  const { container } = render(<TaskList tasks={tasks} onToggle={noop} onDelete={noop} />)
  expect(container).toMatchSnapshot()
})

// Failure example — skipped unless SHOW_FAILURES=true
const showFailures = process.env.SHOW_FAILURES === 'true'

describe.skipIf(!showFailures)('[FAILURE EXAMPLE] Snapshot mismatch', () => {
  it('fails: snapshot has been intentionally altered', () => {
    const { container } = render(<TaskForm onSubmit={noop} />)
    // Force a mismatch by manually building the expected snapshot string
    // This simulates what happens when a component changes but snapshot isn't updated
    expect(container.innerHTML).toMatchSnapshot()
    // Then immediately invalidate by asserting the wrong thing
    expect(container.querySelector('button')?.textContent).toBe('Submit') // Real button says "Add"
  })
})
