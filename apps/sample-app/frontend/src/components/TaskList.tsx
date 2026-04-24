import { Task } from '../types'
import { TaskItem } from './TaskItem'

interface Props {
  tasks: Task[]
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
}

export function TaskList({ tasks, onToggle, onDelete }: Props) {
  if (tasks.length === 0) {
    return <p style={{ color: '#9ca3af', textAlign: 'center' }}>No tasks yet. Add one above!</p>
  }
  return (
    <div role="list" aria-label="Tasks">
      {tasks.map(task => (
        <div role="listitem" key={task.id}>
          <TaskItem task={task} onToggle={onToggle} onDelete={onDelete} />
        </div>
      ))}
    </div>
  )
}
