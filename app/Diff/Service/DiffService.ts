import { Changes, DiffChunk, OpCode } from '../Types'
import { MyersSequencer } from './MyersSequencer'

export default class DiffService {
  private static mergeBlocks(
    using: [DiffChunk[], DiffChunk[]]
  ): [number, number, number, number, number, number] {
    const lowc = Math.min(using[0][0].startA, using[1][0].startA)
    const highc = Math.max(using[0][using[0].length - 1].endA, using[1][using[1].length - 1].endA)

    let low: number[] = []
    let high: number[] = []

    for (let i = 0; i <= 1; i++) {
      let d = using[i][0]
      low.push(lowc - d.startA + d.startB)
      d = using[i][using[i].length - 1]
      high.push(highc - d.endA + d.endB)
    }

    return [low[0], high[0], lowc, highc, low[1], high[1]]
  }

  public static twoWayDiff(a: string[], b: string[]): Changes {
    return this.threeWayDiff(a, b, b)
  }

  public static threeWayDiff(a: string[], o: string[], b: string[]): Changes {
    const retval: Changes = []

    const diffs: [DiffChunk[], DiffChunk[]] = [[], []]

    const m1 = new MyersSequencer(o, a)
    const m2 = new MyersSequencer(o, b)
    diffs[0] = m1.getDifferenceOpcodes()
    diffs[1] = m2.getDifferenceOpcodes()

    const seq0 = Array.from(diffs[0])
    const seq1 = Array.from(diffs[1])
    const seq = [seq0, seq1]

    let highSeq: 1 | 0 = 0
    while (seq0.length || seq1.length) {
      if (!seq0.length) {
        highSeq = 1
      } else if (!seq1.length) {
        highSeq = 0
      } else {
        highSeq = seq1[0].startA < seq0[0].startA ? 1 : 0
        if (seq1[0].startA === seq0[0].startA) {
          if (seq0[0].tag === 'insert') highSeq = 0
          else if (seq1[0].tag === 'insert') highSeq = 1
        }
      }
      const highDiff = seq[highSeq].shift()!
      let highMark = highDiff.endA
      let otherSeq: 1 | 0 = highSeq === 1 ? 0 : 1
      const using: [DiffChunk[], DiffChunk[]] = [[], []]
      using[highSeq].push(highDiff)
      while (seq[otherSeq].length > 0) {
        let otherDiff = seq[otherSeq][0]
        if (highMark < otherDiff.startA) {
          break
        }
        if (
          highMark === otherDiff.startA &&
          !(highDiff.tag === otherDiff.tag && otherDiff.tag === 'insert')
        ) {
          break
        }
        using[otherSeq].push(otherDiff)
        seq[otherSeq].shift()
        if (highMark < otherDiff.endA) {
          ;[highSeq, otherSeq] = [otherSeq, highSeq]
          highMark = otherDiff.endA
        }
      }

      if (using[0].length === 0) {
        retval.push([null, using[1][0]])
      } else if (using[1].length === 0) {
        retval.push([using[0][0], null])
      } else {
        const [l0, h0, l1, h1, l2, h2] = DiffService.mergeBlocks(using)
        let tag: OpCode
        if (h0 - l0 === h2 - l2 && a.slice(l0, h0).join('') === b.slice(l2, h2).join('')) {
          if (l1 !== h1 && l0 === h0) {
            tag = 'delete'
          } else if (l1 !== h1) {
            tag = 'replace'
          } else {
            tag = 'insert'
          }
        } else {
          tag = 'conflict'
        }
        const out0: DiffChunk = { tag: tag, startA: l1, endA: h1, startB: l0, endB: h0 }
        const out1: DiffChunk = { tag: tag, startA: l1, endA: h1, startB: l2, endB: h2 }
        retval.push([out0, out1])
      }
    }

    return retval
  }
}
