import { useState, useEffect, useCallback } from 'react'
import { Task, Priority } from './types'
import { getTasks, createTask, updateTask, deleteTask } from './api/tasks'
import { TaskForm } from './components/TaskForm'
import { FilterBar } from './components/FilterBar'
import { TaskList } from './components/TaskList'

export function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')

  const load = useCallback(() => {
    getTasks({ status, priority }).then(setTasks).catch(console.error)
  }, [status, priority])

  useEffect(() => { load() }, [load])

  const handleCreate = async (title: string, prio: Priority) => {
    await createTask(title, prio)
    load()
  }

  const handleToggle = async (id: string, completed: boolean) => {
    await updateTask(id, { completed })
    load()
  }

  const handleDelete = async (id: string) => {
    await deleteTask(id)
    load()
  }

  return (
    <main style={{ maxWidth: 600, margin: '40px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: 24 }}>Task Manager</h1>
      <TaskForm onSubmit={handleCreate} />
      <FilterBar status={status} priority={priority} onStatusChange={setStatus} onPriorityChange={setPriority} />
      <TaskList tasks={tasks} onToggle={handleToggle} onDelete={handleDelete} />
    </main>
  )
}
