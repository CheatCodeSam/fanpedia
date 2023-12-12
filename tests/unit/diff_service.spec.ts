import { test } from '@japa/runner'
import { DiffService } from 'App/Diff/Service'
import { Changes } from 'App/Diff/Types'

test.group('DiffService', () => {
	test('Find single update in a.', async ({ assert }) => {
		const o = ['Line 1', 'Line 2', 'Line 3', 'Line 4']
		const a = ['Line 1 REVISION', 'Line 2', 'Line 3', 'Line 4']
		const b = ['Line 1', 'Line 2', 'Line 3', 'Line 4']

		const changes = DiffService.threeWayDiff(a, o, b)

		const expectedChanges: Changes = [
			[{ tag: 'replace', startA: 0, endA: 1, startB: 0, endB: 1 }, null],
		]

		assert.deepEqual(changes, expectedChanges)
	})

	test('Find single update in b.', async ({ assert }) => {
		const o = ['Line 1', 'Line 2', 'Line 3', 'Line 4']
		const a = ['Line 1', 'Line 2', 'Line 3', 'Line 4']
		const b = ['Line 1 REVISION', 'Line 2', 'Line 3', 'Line 4']

		const changes = DiffService.threeWayDiff(a, o, b)

		const expectedChanges: Changes = [
			[null, { tag: 'replace', startA: 0, endA: 1, startB: 0, endB: 1 }],
		]

		assert.deepEqual(changes, expectedChanges)
	})

	test('Find no changes.', async ({ assert }) => {
		const o = ['Line 1', 'Line 2', 'Line 3', 'Line 4']
		const a = ['Line 1', 'Line 2', 'Line 3', 'Line 4']
		const b = ['Line 1', 'Line 2', 'Line 3', 'Line 4']

		const changes = DiffService.threeWayDiff(a, o, b)
		assert.isEmpty(changes)
	})

	test('Find one conflict.', async ({ assert }) => {
		const o = ['a', 'b', 'c', 'd', 'e']
		const a = ['a', 'b', 'X', 'd', 'e']
		const b = ['a', 'b', 'Y', 'd', 'e']

		const changes = DiffService.threeWayDiff(a, o, b)

		const expectedChanges: Changes = [
			[
				{ tag: 'conflict', startA: 2, endA: 3, startB: 2, endB: 3 },
				{ tag: 'conflict', startA: 2, endA: 3, startB: 2, endB: 3 },
			],
		]
		assert.deepEqual(changes, expectedChanges)
	})

	test('Find two conflicts.', async ({ assert }) => {
		const o = ['a', 'b', 'c', 'd', 'e']
		const a = ['a', 'X', 'c', 'X', 'e']
		const b = ['a', 'Y', 'c', 'Y', 'e']

		const changes = DiffService.threeWayDiff(a, o, b)

		const expectedChanges: Changes = [
			[
				{ tag: 'conflict', startA: 1, endA: 2, startB: 1, endB: 2 },
				{ tag: 'conflict', startA: 1, endA: 2, startB: 1, endB: 2 },
			],
			[
				{ tag: 'conflict', startA: 3, endA: 4, startB: 3, endB: 4 },
				{ tag: 'conflict', startA: 3, endA: 4, startB: 3, endB: 4 },
			],
		]
		assert.deepEqual(changes, expectedChanges)
	})

	test('Find conflicts at ends.', async ({ assert }) => {
		const o = ['a', 'b', 'c', 'd', 'e']
		const a = ['X', 'b', 'c', 'd', 'X']
		const b = ['y', 'b', 'c', 'd', 'Y']

		const changes = DiffService.threeWayDiff(a, o, b)

		const expectedChanges: Changes = [
			[
				{ tag: 'conflict', startA: 0, endA: 1, startB: 0, endB: 1 },
				{ tag: 'conflict', startA: 0, endA: 1, startB: 0, endB: 1 },
			],
			[
				{ tag: 'conflict', startA: 4, endA: 5, startB: 4, endB: 5 },
				{ tag: 'conflict', startA: 4, endA: 5, startB: 4, endB: 5 },
			],
		]
		assert.deepEqual(changes, expectedChanges)
	})

	test('Find complicated replace.', async ({ assert }) => {
		const o = ['a', 'b', 'c', 'd', 'e']
		const a = ['X', 'b', 'Y', 'd', 'Z']
		const b = ['a', 'W', 'c', 'V', 'e']

		const changes = DiffService.threeWayDiff(a, o, b)

		const expectedChanges: Changes = [
			[{ tag: 'replace', startA: 0, endA: 1, startB: 0, endB: 1 }, null],
			[null, { tag: 'replace', startA: 1, endA: 2, startB: 1, endB: 2 }],
			[{ tag: 'replace', startA: 2, endA: 3, startB: 2, endB: 3 }, null],
			[null, { tag: 'replace', startA: 3, endA: 4, startB: 3, endB: 4 }],
			[{ tag: 'replace', startA: 4, endA: 5, startB: 4, endB: 5 }, null],
		]
		assert.deepEqual(changes, expectedChanges)
	})

	test('Find conflict with adding text.', async ({ assert }) => {
		const o = ['a', 'b', 'c', 'd', 'e']
		const a = ['a', 'b', 'c', 'd', 'e', 'X']
		const b = ['a', 'b', 'c', 'd', 'e', 'Y']

		const changes = DiffService.threeWayDiff(a, o, b)

		const expectedChanges: Changes = [
			[
				{ tag: 'conflict', startA: 5, endA: 5, startB: 5, endB: 6 },
				{ tag: 'conflict', startA: 5, endA: 5, startB: 5, endB: 6 },
			],
		]
		assert.deepEqual(changes, expectedChanges)
	})

	test('Find multiple deletes.', async ({ assert }) => {
		const o = ['a', 'b', 'c', 'd', 'e']
		const a = ['b', 'c', 'd', 'e']
		const b = ['a', 'b', 'c', 'e']

		const changes = DiffService.threeWayDiff(a, o, b)

		const expectedChanges: Changes = [
			[{ tag: 'delete', startA: 0, endA: 1, startB: 0, endB: 0 }, null],
			[null, { tag: 'delete', startA: 3, endA: 4, startB: 3, endB: 3 }],
		]
		assert.deepEqual(changes, expectedChanges)
	})

	test('Find mixed replace and delete.', async ({ assert }) => {
		const o = ['a', 'b', 'c', 'd', 'e']
		const a = ['b', 'c', 'd', 'e']
		const b = ['a', 'b', 'c', 'd', 'e', 'f']

		const changes = DiffService.threeWayDiff(a, o, b)

		const expectedChanges: Changes = [
			[{ tag: 'delete', startA: 0, endA: 1, startB: 0, endB: 0 }, null],
			[null, { tag: 'insert', startA: 5, endA: 5, startB: 5, endB: 6 }],
		]
		assert.deepEqual(changes, expectedChanges)
	})

	test('Find two way diff.', async ({ assert }) => {
		const a = ['Line 1', 'Line 2', 'Line 3', 'Line 4']
		const b = ['Line 1', 'Line 2 DIFF', 'Line 3', 'Line 4']

		const expectedChanges: Changes = [
			[{ tag: 'replace', startA: 1, endA: 2, startB: 1, endB: 2 }, null],
		]

		const changes = DiffService.twoWayDiff(a, b)
		assert.deepEqual(changes, expectedChanges)
	})
})
