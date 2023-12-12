import { test } from '@japa/runner'
import { MergeService } from 'App/Diff/Service'

test.group('MergeService', () => {
	test('Merge single update from a', async ({ assert }) => {
		const o = ['Line 1', 'Line 2', 'Line 3', 'Line 4']
		const a = ['Line 1 REVISION', 'Line 2', 'Line 3', 'Line 4']
		const b = ['Line 1', 'Line 2', 'Line 3', 'Line 4']

		const changes = MergeService.threeWayMerge(a, o, b)

		const expectedChanges = [
			{ status: 'ok', merge: 'Line 1 REVISION' },
			{ status: 'ok', merge: 'Line 2' },
			{ status: 'ok', merge: 'Line 3' },
			{ status: 'ok', merge: 'Line 4' },
		]

		assert.deepEqual(changes, expectedChanges)
	})

	test('Merge single update from b.', async ({ assert }) => {
		const o = ['Line 1', 'Line 2', 'Line 3', 'Line 4']
		const a = ['Line 1', 'Line 2', 'Line 3', 'Line 4']
		const b = ['Line 1', 'Line 2', 'Line 3', 'Line 4 REVISION']

		const changes = MergeService.threeWayMerge(a, o, b)

		const expectedChanges = [
			{ status: 'ok', merge: 'Line 1' },
			{ status: 'ok', merge: 'Line 2' },
			{ status: 'ok', merge: 'Line 3' },
			{ status: 'ok', merge: 'Line 4 REVISION' },
		]

		assert.deepEqual(changes, expectedChanges)
	})

	test('Merge single update from a and b.', async ({ assert }) => {
		const o = ['Line 1', 'Line 2', 'Line 3', 'Line 4']
		const a = ['Line 1 REVISION', 'Line 2', 'Line 3', 'Line 4']
		const b = ['Line 1', 'Line 2', 'Line 3', 'Line 4 REVISION']

		const changes = MergeService.threeWayMerge(a, o, b)

		const expectedChanges = [
			{ status: 'ok', merge: 'Line 1 REVISION' },
			{ status: 'ok', merge: 'Line 2' },
			{ status: 'ok', merge: 'Line 3' },
			{ status: 'ok', merge: 'Line 4 REVISION' },
		]

		assert.deepEqual(changes, expectedChanges)
	})

	test('Merge complicated replace.', async ({ assert }) => {
		const o = ['a', 'b', 'c', 'd', 'e']
		const a = ['X', 'b', 'Y', 'd', 'Z']
		const b = ['a', 'W', 'c', 'V', 'e']

		const changes = MergeService.threeWayMerge(a, o, b)

		const expectedChanges = [
			{ status: 'ok', merge: 'X' },
			{ status: 'ok', merge: 'W' },
			{ status: 'ok', merge: 'Y' },
			{ status: 'ok', merge: 'V' },
			{ status: 'ok', merge: 'Z' },
		]

		assert.deepEqual(changes, expectedChanges)
	})

	test('Merge insert at end.', async ({ assert }) => {
		const o = ['a', 'b', 'c', 'd', 'e']
		const a = ['X', 'b', 'c', 'd', 'e']
		const b = ['a', 'b', 'c', 'd', 'e', 'f', 'g']

		const changes = MergeService.threeWayMerge(a, o, b)

		const expectedChanges = [
			{ status: 'ok', merge: 'X' },
			{ status: 'ok', merge: 'b' },
			{ status: 'ok', merge: 'c' },
			{ status: 'ok', merge: 'd' },
			{ status: 'ok', merge: 'e' },
			{ status: 'ok', merge: 'f' },
			{ status: 'ok', merge: 'g' },
		]

		assert.deepEqual(changes, expectedChanges)
	})

	test('Merge insert in middle.', async ({ assert }) => {
		const o = ['a', 'b', 'c', 'd', 'e']
		const a = ['X', 'b', 'c', 'd', 'e']
		const b = ['a', 'b', 'c', 'd', 'ADDITION', 'OTHERADDITION', 'e']

		const changes = MergeService.threeWayMerge(a, o, b)

		const expectedChanges = [
			{ status: 'ok', merge: 'X' },
			{ status: 'ok', merge: 'b' },
			{ status: 'ok', merge: 'c' },
			{ status: 'ok', merge: 'd' },
			{ status: 'ok', merge: 'ADDITION' },
			{ status: 'ok', merge: 'OTHERADDITION' },
			{ status: 'ok', merge: 'e' },
		]

		assert.deepEqual(changes, expectedChanges)
	})

	test('Merge deletion at end.', async ({ assert }) => {
		const o = ['a', 'b', 'c', 'd', 'e']
		const a = ['X', 'b', 'c', 'd', 'e']
		const b = ['a', 'b', 'c', 'd']

		const changes = MergeService.threeWayMerge(a, o, b)

		const expectedChanges = [
			{ status: 'ok', merge: 'X' },
			{ status: 'ok', merge: 'b' },
			{ status: 'ok', merge: 'c' },
			{ status: 'ok', merge: 'd' },
		]

		assert.deepEqual(changes, expectedChanges)
	})

	test('Merge deletion in middle.', async ({ assert }) => {
		const o = ['a', 'b', 'c', 'd', 'e']
		const a = ['X', 'b', 'c', 'd', 'e']
		const b = ['a', 'b', 'e']

		const changes = MergeService.threeWayMerge(a, o, b)

		const expectedChanges = [
			{ status: 'ok', merge: 'X' },
			{ status: 'ok', merge: 'b' },
			{ status: 'ok', merge: 'e' },
		]

		assert.deepEqual(changes, expectedChanges)
	})

	test('Expect conflict be detected', async ({ assert }) => {
		const o = ['a', 'b', 'c', 'd', 'e']
		const a = ['X', 'b', 'c', 'd', 'e']
		const b = ['Y', 'b', 'c', 'd', 'e']

		const changes = MergeService.threeWayMerge(a, o, b)

		const expectedChanges = [
			{ status: 'conflict', a: ['X'], o: ['a'], b: ['Y'] },
			{ status: 'ok', merge: 'b' },
			{ status: 'ok', merge: 'c' },
			{ status: 'ok', merge: 'd' },
			{ status: 'ok', merge: 'e' },
		]

		assert.deepEqual(changes, expectedChanges)
	})

	test('Expect conflict to be detected and still merge non-conflicts.', async ({
		assert,
	}) => {
		const o = ['a', 'b', 'c', 'd', 'e']
		const a = ['X', 'b', 'c', 'REVISION', 'e']
		const b = ['Y', 'b', 'c', 'd', 'e']

		const changes = MergeService.threeWayMerge(a, o, b)

		const expectedChanges = [
			{ status: 'conflict', a: ['X'], o: ['a'], b: ['Y'] },
			{ status: 'ok', merge: 'b' },
			{ status: 'ok', merge: 'c' },
			{ status: 'ok', merge: 'REVISION' },
			{ status: 'ok', merge: 'e' },
		]

		assert.deepEqual(changes, expectedChanges)
	})

	test('Expect conflict to be detected and handle large number of additions.', async ({
		assert,
	}) => {
		const o = ['a']
		const a = ['a', 'Z0', 'Z1', 'Z2']
		const b = ['a', 'Y0', 'Y1', 'Y2']

		const changes = MergeService.threeWayMerge(a, o, b)

		const expectedChanges = [
			{ status: 'ok', merge: 'a' },
			{
				status: 'conflict',
				a: ['Z0', 'Z1', 'Z2'],
				o: [],
				b: ['Y0', 'Y1', 'Y2'],
			},
		]

		assert.deepEqual(changes, expectedChanges)
	})

	test('Expect conflict to be detected and handle large number of deletions.', async ({
		assert,
	}) => {
		const o = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
		const a = ['d']
		const b = ['d', 'e', 'f']

		const changes = MergeService.threeWayMerge(a, o, b)

		const expectedChanges = [
			{ status: 'ok', merge: 'd' },
			{ status: 'conflict', a: [], o: ['e', 'f', 'g'], b: ['e', 'f'] },
		]

		assert.deepEqual(changes, expectedChanges)
	})

	test('Expect conflict to be detected and handle complex changes.', async ({
		assert,
	}) => {
		const o = ['a', 'b', 'c', 'd', 'e']
		const a = ['X', 'b1', 'Z', 'd', 'e']
		const b = ['Y', 'b2', 'C', 'd', 'E']

		const changes = MergeService.threeWayMerge(a, o, b)

		const expectedChanges = [
			{
				status: 'conflict',
				a: ['X', 'b1', 'Z'],
				o: ['a', 'b', 'c'],
				b: ['Y', 'b2', 'C'],
			},
			{ status: 'ok', merge: 'd' },
			{ status: 'ok', merge: 'E' },
		]

		assert.deepEqual(changes, expectedChanges)
	})
})
