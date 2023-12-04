import { DiffChunk, OpCode } from '../../Types'
import * as myers from 'fast-myers-diff'

type Block = [number, number, number, number]

export interface Sequencer {
  getOpcodes(): DiffChunk[]
  getDifferenceOpcodes(): DiffChunk[]
}

export class MyersSequencer implements Sequencer {
  private differentBlocks: Block[] = []
  private a: string[]
  private b: string[]

  constructor(a: string[], b: string[]) {
    this.a = Array.from(a)
    this.b = Array.from(b)
    this.differentBlocks = Array.from(myers.diff(this.a, this.b))
  }

  public getOpcodes(): DiffChunk[] {
    const diffOpcodes: DiffChunk[] = this.getDifferenceOpcodes()
    const opcodes: DiffChunk[] = []
    let lastA = 0
    let lastB = 0
    diffOpcodes.forEach((opcode) => {
      if (opcode.startA > lastA || opcode.startB > lastB) {
        opcodes.push({
          tag: 'equal',
          startA: lastA,
          endA: opcode.startA,
          startB: lastB,
          endB: opcode.startB,
        })
      }
      opcodes.push(opcode)
      lastA = opcode.endA
      lastB = opcode.endB
    })
    if (lastA < this.a.length || lastB < this.b.length) {
      opcodes.push({
        tag: 'equal',
        startA: lastA,
        endA: this.a.length,
        startB: lastB,
        endB: this.b.length,
      })
    }
    return opcodes
  }

  public getDifferenceOpcodes(): DiffChunk[] {
    const opcodes: DiffChunk[] = []
    this.differentBlocks.forEach(([startA, endA, startB, endB]) => {
      let tag: OpCode
      if (startA === endA) {
        tag = 'insert'
      } else if (startB === endB) {
        tag = 'delete'
      } else {
        tag = 'replace'
      }
      opcodes.push({ tag, startA, endA, startB, endB })
    })
    return opcodes
  }
}
