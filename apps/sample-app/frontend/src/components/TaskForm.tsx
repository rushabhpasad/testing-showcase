import { useState } from 'react'
import { Priority } from '../types'

interface Props {
  onSubmit: (title: string, priority: Priority) => void
}

export function TaskForm({ onSubmit }: Props) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit(title.trim(), priority)
    setTitle('')
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="New task..."
        aria-label="Task title"
        style={{ flex: 1, padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 4 }}
      />
      <select
        value={priority}
        onChange={e => setPriority(e.target.value as Priority)}
        aria-label="Priority"
        style={{ padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 4 }}
      >
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <button
        type="submit"
        style={{ padding: '6px 16px', background: '#111827', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
      >
        Add
      </button>
    </form>
  )
}
