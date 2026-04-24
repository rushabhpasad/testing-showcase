import type { Suite } from './types'

const BASE = 'http://localhost:3002'

export const getSuites = async (): Promise<Suite[]> => {
  const res = await fetch(`${BASE}/suites`)
  if (!res.ok) throw new Error('Failed to fetch suites')
  return res.json()
}

export const runSuite = (
  id: string,
  onOutput: (line: string) => void,
  onDone: (exitCode: number) => void
): (() => void) => {
  const source = new EventSource(`${BASE}/suites/${id}/run`)
  source.addEventListener('output', (e: MessageEvent) => onOutput(JSON.parse(e.data) as string))
  source.addEventListener('done', (e: MessageEvent) => {
    const { exitCode } = JSON.parse(e.data) as { exitCode: number }
    onDone(exitCode)
    source.close()
  })
  source.onerror = () => {
    onOutput('[connection error]')
    source.close()
  }
  return () => source.close()
}
