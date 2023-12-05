import { DiffChunk } from '../Types'
import DiffService from './DiffService'

export default class MergeService {
  private static differ = DiffService

  private static applyChange(text: string[], change: DiffChunk, mergedText: string[]): number {
    if (change.tag === 'insert') {
      for (let i = change.startB; i < change.endB; i++) {
        mergedText.push(text[i])
      }
      return 0
    } else if (change.tag === 'replace') {
      for (let i = change.startB; i < change.endB; i++) {
        mergedText.push(text[i])
      }
      return change.endA - change.startA
    } else {
      return change.endA - change.startA
    }
  }

  public static threeWayMerge(a: string[], o: string[], b: string[]): string[] {
    const unresolved = []
    let lastLine = 0
    let mergedLine = 0
    const mergedText: string[] = []

    this.differ.threeWayDiff(a, o, b).forEach((change) => {
      let lowMark = lastLine
      if (change[0] !== null) {
        lowMark = change[0].startA
      }
      if (change[1] !== null) {
        if (change[1].startA > lowMark) {
          lowMark = change[1].startA
        }
      }
      for (let i = lastLine; i < lowMark; i++) {
        mergedText.push(o[i])
      }
      mergedLine += lowMark - lastLine
      lastLine = lowMark

      if (change[0] !== null && change[1] !== null && change[0].tag === 'conflict') {
        let highMark = Math.max(change[0].endA, change[1].endA)
      } else if (change[0] !== null) {
        lastLine += MergeService.applyChange(a, change[0], mergedText)
        mergedLine += change[0].endB - change[0].startB
      } else {
        lastLine += MergeService.applyChange(b, change[1]!, mergedText)
        mergedLine += change[1]!.endB - change[1]!.startB
      }
    })

    const baseLen = o.length
    for (let i: number = lastLine; i < baseLen; i++) {
      mergedText.push(o[i])
    }

    return mergedText
  }
}
