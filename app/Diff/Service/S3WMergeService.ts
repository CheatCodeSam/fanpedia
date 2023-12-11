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
    const bSidedMerge = S3WMergeService.merge
      .threeWayMerge(a, o, b)
      .flatMap((item) => (item.status === 'ok' ? item.merge : item.b))

    return { l: [], r: [] }
  }
}
