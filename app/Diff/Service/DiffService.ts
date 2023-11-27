import { Changes } from '../Types'

export default class DiffService {
  public static twoWayDiff(a: string[], b: string[]): Changes {
    return this.findThreeWayDiff(a, a, b)
  }

  public static findThreeWayDiff(a: string[], o: string[], b: string[]): Changes {
    return []
  }
}
