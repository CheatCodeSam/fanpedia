import { Changes } from '../Types'

export default class DiffService {
  public static twoWayDiff(a: string[], b: string[]): Changes {
    return this.threeWayDiff(a, b, b)
  }

  public static threeWayDiff(a: string[], o: string[], b: string[]): Changes {
    return []
  }
}
