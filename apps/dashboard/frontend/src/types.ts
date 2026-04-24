export type SuiteType = 'unit' | 'integration' | 'e2e' | 'contract' | 'snapshot' | 'performance' | 'security' | 'accessibility'

export interface Suite {
  id: string
  name: string
  description: string
  type: SuiteType
  tool: string
  command: string
  cwd: string
  requiresServer: boolean
}
