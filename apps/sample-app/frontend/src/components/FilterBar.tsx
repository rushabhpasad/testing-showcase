interface Props {
  status: string
  priority: string
  onStatusChange: (s: string) => void
  onPriorityChange: (p: string) => void
}

export function FilterBar({ status, priority, onStatusChange, onPriorityChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }} role="group" aria-label="Filters">
      <select
        value={status}
        onChange={e => onStatusChange(e.target.value)}
        aria-label="Filter by status"
        style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4 }}
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
      </select>
      <select
        value={priority}
        onChange={e => onPriorityChange(e.target.value)}
        aria-label="Filter by priority"
        style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4 }}
      >
        <option value="all">All Priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>
  )
}
