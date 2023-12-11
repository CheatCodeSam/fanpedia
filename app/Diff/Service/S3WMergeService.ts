import { OpCode } from '../Types'
import DiffService from './DiffService'
import MergeService from './MergeService'

interface LeftSideChanges {
  tag: Exclude<OpCode, 'insert'>
  value: string
}

interface RightSideChanges {
  tag: Exclude<OpCode, 'delete'>
  value: string
}

interface ReturnValue {
  l: LeftSideChanges[]
  r: RightSideChanges[]
}

/**
 * Selective Three Way Merge Service
 *
 * @remarks
 * Performs a selective merge operation between three source files, creating a merged file with a preference towards one source in case of conflicts.
 * It then compares the original and merged files, labeling each element to indicate changes such as conflicts, replacements, or insertions.
 */
export default class S3WMergeService {
  private static merge = MergeService
  private static diff = DiffService

  public static selectiveThreeWayMerge(a: string[], o: string[], b: string[]): ReturnValue {
    const threeWayDiff = S3WMergeService.diff.threeWayDiff(a, o, b)
    const merge = S3WMergeService.merge.threeWayMerge(a, o, b)
    const bSidedMerge = merge.flatMap((item) => {
      if (item.status === 'conflict') return item.b
      return item.merge
    })

    const leftSide: LeftSideChanges[] = []
    const rightSide: RightSideChanges[] = []

    a.forEach((el) => leftSide.push({ tag: 'equal', value: el }))

    threeWayDiff.forEach((diff) => {
      if (diff[0]?.tag === 'conflict') {
        for (let i = diff[0].startB; i < diff[0].endB; i++) {
          leftSide[i].tag = 'conflict'
        }
      }
    })

    merge.forEach((item) => {
      if (item.status === 'conflict') {
        item.b.forEach((val) => {
          rightSide.push({ tag: 'conflict', value: val })
        })
      } else {
        rightSide.push({ tag: 'equal', value: item.merge })
      }
    })

    const twoWayDiff = S3WMergeService.diff.twoWayDiff(bSidedMerge, a).flatMap((el) => el[0]!)

    twoWayDiff.forEach((diff) => {
      if (diff.tag === 'replace') {
        for (let i = diff.startA; i < diff.endA; i++) {
          if (leftSide[i].tag !== 'conflict') leftSide[i].tag = 'replace'
        }
        for (let i = diff.startB; i < diff.endB; i++) {
          if (rightSide[i].tag !== 'conflict') rightSide[i].tag = 'replace'
        }
      }
      if (diff.tag === 'insert') {
        for (let i = diff.startB; i < diff.endB; i++) {
          if (rightSide[i].tag !== 'conflict') rightSide[i].tag = 'insert'
        }
      }
      if (diff.tag === 'delete') {
        for (let i = diff.startA; i < diff.endA; i++) {
          if (rightSide[i].tag !== 'conflict') leftSide[i].tag = 'delete'
        }
      }
    })

    return { l: leftSide, r: rightSide }
  }
}
