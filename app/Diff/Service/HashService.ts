import { sha3_256 } from '@noble/hashes/sha3'
import { bytesToHex } from '@noble/hashes/utils'

export default class HashService {
	public static hash(
		parentCommits: string[],
		body: string,
		datetime: string
	): string {
		const prehash = `${parentCommits.join(',')}:${body}:${datetime}`
		const h5a = sha3_256(prehash)
		return bytesToHex(h5a)
	}
}
