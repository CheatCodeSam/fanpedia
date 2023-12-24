export default class MapToObjectService {
	public static toObject(map: Map<any, any>): object {
		const obj = {}
		for (const [key, value] of map) {
			if (value instanceof Map) {
				obj[key] = MapToObjectService.toObject(value)
			} else {
				obj[key] = value
			}
		}
		return obj
	}
}
