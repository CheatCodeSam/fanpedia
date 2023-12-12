import { test } from '@japa/runner'
import { S3WMergeService } from 'App/Diff/Service'

test.group('S3WMergeService', () => {
	test('Test for complex merge and conflict.', async ({ assert }) => {
		const a = [
			'LineREVISION1',
			' ',
			'Line3',
			' ',
			'Line4',
			' ',
			'Line5',
			' ',
			'LineCONFLICT6',
		]
		const o = [
			'LineREVISION1',
			' ',
			'Line2',
			' ',
			'Line3',
			' ',
			'Line4',
			' ',
			'Line5',
			' ',
			'LineREVISION6',
		]
		const b = [
			'LineREV1',
			' ',
			'Line2',
			' ',
			'Line3',
			' ',
			'Line4',
			' ',
			'REV',
			' ',
			'Line5',
			' ',
			'LineREV6',
		]

		const M = S3WMergeService.selectiveThreeWayMerge(a, o, b)

		const expectedValue = {
			l: [
				{ tag: 'replace', value: 'LineREVISION1' },
				{ tag: 'equal', value: ' ' },
				{ tag: 'equal', value: 'Line3' },
				{ tag: 'equal', value: ' ' },
				{ tag: 'equal', value: 'Line4' },
				{ tag: 'equal', value: ' ' },
				{ tag: 'equal', value: 'Line5' },
				{ tag: 'equal', value: ' ' },
				{ tag: 'conflict', value: 'LineCONFLICT6' },
			],
			r: [
				{ tag: 'replace', value: 'LineREV1' },
				{ tag: 'equal', value: ' ' },
				{ tag: 'equal', value: 'Line3' },
				{ tag: 'equal', value: ' ' },
				{ tag: 'equal', value: 'Line4' },
				{ tag: 'insert', value: ' ' },
				{ tag: 'insert', value: 'REV' },
				{ tag: 'equal', value: ' ' },
				{ tag: 'equal', value: 'Line5' },
				{ tag: 'equal', value: ' ' },
				{ tag: 'conflict', value: 'LineREV6' },
			],
		}

		assert.deepEqual(M, expectedValue)
	})

	test('Test for deletions.', async ({ assert }) => {
		const a = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
		const o = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
		const b = ['a', 'b', 'e', 'f', 'g']

		const M = S3WMergeService.selectiveThreeWayMerge(a, o, b)

		const expectedValue = {
			l: [
				{ tag: 'equal', value: 'a' },
				{ tag: 'equal', value: 'b' },
				{ tag: 'delete', value: 'c' },
				{ tag: 'delete', value: 'd' },
				{ tag: 'equal', value: 'e' },
				{ tag: 'equal', value: 'f' },
				{ tag: 'equal', value: 'g' },
			],
			r: [
				{ tag: 'equal', value: 'a' },
				{ tag: 'equal', value: 'b' },
				{ tag: 'equal', value: 'e' },
				{ tag: 'equal', value: 'f' },
				{ tag: 'equal', value: 'g' },
			],
		}

		assert.deepEqual(M, expectedValue)
	})

	test('Test for insertion.', async ({ assert }) => {
		const a = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
		const o = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
		const b = ['a', 'b', 'c', 'd', 'X', 'Y', 'e', 'f', 'g']

		const M = S3WMergeService.selectiveThreeWayMerge(a, o, b)

		const expectedValue = {
			l: [
				{ tag: 'equal', value: 'a' },
				{ tag: 'equal', value: 'b' },
				{ tag: 'equal', value: 'c' },
				{ tag: 'equal', value: 'd' },
				{ tag: 'equal', value: 'e' },
				{ tag: 'equal', value: 'f' },
				{ tag: 'equal', value: 'g' },
			],
			r: [
				{ tag: 'equal', value: 'a' },
				{ tag: 'equal', value: 'b' },
				{ tag: 'equal', value: 'c' },
				{ tag: 'equal', value: 'd' },
				{ tag: 'insert', value: 'X' },
				{ tag: 'insert', value: 'Y' },
				{ tag: 'equal', value: 'e' },
				{ tag: 'equal', value: 'f' },
				{ tag: 'equal', value: 'g' },
			],
		}

		assert.deepEqual(M, expectedValue)
	})

	test('Test for simple conflict.', async ({ assert }) => {
		const a = ['a', 'b', 'c', 'Y', 'e', 'f', 'g']
		const o = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
		const b = ['a', 'b', 'c', 'X', 'e', 'f', 'g']

		const M = S3WMergeService.selectiveThreeWayMerge(a, o, b)

		const expectedValue = {
			l: [
				{ tag: 'equal', value: 'a' },
				{ tag: 'equal', value: 'b' },
				{ tag: 'equal', value: 'c' },
				{ tag: 'conflict', value: 'Y' },
				{ tag: 'equal', value: 'e' },
				{ tag: 'equal', value: 'f' },
				{ tag: 'equal', value: 'g' },
			],
			r: [
				{ tag: 'equal', value: 'a' },
				{ tag: 'equal', value: 'b' },
				{ tag: 'equal', value: 'c' },
				{ tag: 'conflict', value: 'X' },
				{ tag: 'equal', value: 'e' },
				{ tag: 'equal', value: 'f' },
				{ tag: 'equal', value: 'g' },
			],
		}

		assert.deepEqual(M, expectedValue)
	})

	test('Test for conflict involving insertion', async ({ assert }) => {
		const a = ['a', 'b', 'c', 'd', 'Y', 'e', 'f', 'g']
		const o = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
		const b = ['a', 'b', 'c', 'd', 'X', 'e', 'f', 'g']

		const M = S3WMergeService.selectiveThreeWayMerge(a, o, b)

		const expectedValue = {
			l: [
				{ tag: 'equal', value: 'a' },
				{ tag: 'equal', value: 'b' },
				{ tag: 'equal', value: 'c' },
				{ tag: 'equal', value: 'd' },
				{ tag: 'conflict', value: 'Y' },
				{ tag: 'equal', value: 'e' },
				{ tag: 'equal', value: 'f' },
				{ tag: 'equal', value: 'g' },
			],
			r: [
				{ tag: 'equal', value: 'a' },
				{ tag: 'equal', value: 'b' },
				{ tag: 'equal', value: 'c' },
				{ tag: 'equal', value: 'd' },
				{ tag: 'conflict', value: 'X' },
				{ tag: 'equal', value: 'e' },
				{ tag: 'equal', value: 'f' },
				{ tag: 'equal', value: 'g' },
			],
		}

		assert.deepEqual(M, expectedValue)
	})

	test('Test for conflict involving deletion', async ({ assert }) => {
		const a = ['a', 'b', 'e', 'f', 'g']
		const o = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
		const b = ['a', 'b', 'c', 'X', 'e', 'f', 'g']

		const M = S3WMergeService.selectiveThreeWayMerge(a, o, b)

		const expectedValue = {
			l: [
				{ tag: 'equal', value: 'a' },
				{ tag: 'equal', value: 'b' },
				{ tag: 'equal', value: 'e' },
				{ tag: 'equal', value: 'f' },
				{ tag: 'equal', value: 'g' },
			],
			r: [
				{ tag: 'equal', value: 'a' },
				{ tag: 'equal', value: 'b' },
				{ tag: 'conflict', value: 'c' },
				{ tag: 'conflict', value: 'X' },
				{ tag: 'equal', value: 'e' },
				{ tag: 'equal', value: 'f' },
				{ tag: 'equal', value: 'g' },
			],
		}

		assert.deepEqual(M, expectedValue)
	})

	test('Test for proper merge from A and conflict', async ({ assert }) => {
		const a = ['X', 'b', 'c', 'd', 'e', 'f', 'g']
		const o = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
		const b = ['Y', 'b', 'c', 'd', 'e', 'Z', 'f', 'g']

		const M = S3WMergeService.selectiveThreeWayMerge(a, o, b)

		const expectedValue = {
			l: [
				{ tag: 'conflict', value: 'X' },
				{ tag: 'equal', value: 'b' },
				{ tag: 'equal', value: 'c' },
				{ tag: 'equal', value: 'd' },
				{ tag: 'equal', value: 'e' },
				{ tag: 'equal', value: 'f' },
				{ tag: 'equal', value: 'g' },
			],
			r: [
				{ tag: 'conflict', value: 'Y' },
				{ tag: 'equal', value: 'b' },
				{ tag: 'equal', value: 'c' },
				{ tag: 'equal', value: 'd' },
				{ tag: 'equal', value: 'e' },
				{ tag: 'insert', value: 'Z' },
				{ tag: 'equal', value: 'f' },
				{ tag: 'equal', value: 'g' },
			],
		}

		assert.deepEqual(M, expectedValue)
	})

	test('Test for proper merge from B and conflict', async ({ assert }) => {
		const a = ['X', 'b', 'c', 'd', 'e', 'Z', 'f', 'g']
		const o = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
		const b = ['Y', 'b', 'c', 'd', 'e', 'f', 'g']

		const M = S3WMergeService.selectiveThreeWayMerge(a, o, b)

		const expectedValue = {
			l: [
				{ tag: 'conflict', value: 'X' },
				{ tag: 'equal', value: 'b' },
				{ tag: 'equal', value: 'c' },
				{ tag: 'equal', value: 'd' },
				{ tag: 'equal', value: 'e' },
				{ tag: 'equal', value: 'Z' },
				{ tag: 'equal', value: 'f' },
				{ tag: 'equal', value: 'g' },
			],
			r: [
				{ tag: 'conflict', value: 'Y' },
				{ tag: 'equal', value: 'b' },
				{ tag: 'equal', value: 'c' },
				{ tag: 'equal', value: 'd' },
				{ tag: 'equal', value: 'e' },
				{ tag: 'equal', value: 'Z' },
				{ tag: 'equal', value: 'f' },
				{ tag: 'equal', value: 'g' },
			],
		}

		assert.deepEqual(M, expectedValue)
	})
})
