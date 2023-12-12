export default class TokenizerService {
	public static tokenize(str: string): string[] {
		const pattern = /\S+| +|\n+|\t+/g
		return str.match(pattern) || []
	}
}
