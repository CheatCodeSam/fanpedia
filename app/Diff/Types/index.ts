export type OpCode = 'replace' | 'insert' | 'delete' | 'conflict' | 'equal'

export interface DiffChunk {
  tag: OpCode
  startA: number
  endA: number
  startB: number
  endB: number
}

export type Changes = [DiffChunk, DiffChunk][]
