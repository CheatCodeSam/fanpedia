import { DiffChunk } from '../Types'
import DiffService from './DiffService'

interface OkMergeStatus {
	status: 'ok'
	merge: string
}

interface ConflictMergeStatus {
	status: 'conflict'
	a: string[]
	o: string[]
	b: string[]
}

export type MergeStatus = OkMergeStatus | ConflictMergeStatus

export default class MergeService {
	private static differ = DiffService

	private static applyChange(
		text: string[],
		change: DiffChunk,
		mergedText: MergeStatus[]
	): number {
		if (change.tag === 'insert') {
			for (let i = change.startB; i < change.endB; i++) {
				mergedText.push({ status: 'ok', merge: text[i] })
			}
			return 0
		}
		if (change.tag === 'replace') {
			for (let i = change.startB; i < change.endB; i++) {
				mergedText.push({ status: 'ok', merge: text[i] })
			}
		}
		return change.endA - change.startA
	}

	public static threeWayMerge(
		a: string[],
		o: string[],
		b: string[]
	): MergeStatus[] {
		let lastLine = 0
		const mergedText: MergeStatus[] = []

		MergeService.differ.threeWayDiff(a, o, b).forEach((change) => {
			let lowMark = lastLine
			if (change[0] !== null) {
				lowMark = change[0].startA
			}
			if (change[1] !== null) {
				if (change[1].startA > lowMark) {
					lowMark = change[1].startA
				}
			}

			// Handle non-conflicting lines
			for (let i = lastLine; i < lowMark; i++) {
				mergedText.push({ status: 'ok', merge: o[i] })
			}
			lastLine = lowMark

			// Handle conflicts
			if (
				change[0] !== null &&
				change[1] !== null &&
				change[0].tag === 'conflict'
			) {
				const highMark = Math.max(change[0].endA, change[1].endA)

				mergedText.push({
					status: 'conflict',
					a: a.slice(change[0].startB, change[0].endB),
					o: o.slice(lowMark, highMark),
					b: b.slice(change[1].startB, change[1].endB),
				})

				lastLine = highMark
			} else {
				// Apply changes without conflicts
				if (change[0] !== null) {
					lastLine += MergeService.applyChange(a, change[0], mergedText)
				} else {
					lastLine += MergeService.applyChange(b, change[1]!, mergedText)
				}
			}
		})

		// Add remaining original lines
		const baseLen = o.length
		for (let i = lastLine; i < baseLen; i++) {
			mergedText.push({ status: 'ok', merge: o[i] })
		}

		return mergedText
	}
}
