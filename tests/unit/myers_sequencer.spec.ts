import { test } from '@japa/runner'
import { MyersSequencer } from 'App/Diff/Service/MyersSequencer'
import { DiffChunk } from 'App/Diff/Types'

test.group('MyersSequencer', () => {
	test('Test for Similar Strings.', async ({ assert }) => {
		const a = 'ABCABBA'.split('')
		const b = 'CBABAC'.split('')

		const m = new MyersSequencer(a, b)

		const opcodes = m.getOpcodes()

		const expectedOpcodes: DiffChunk[] = [
			{ tag: 'replace', startA: 0, endA: 1, startB: 0, endB: 1 },
			{ tag: 'equal', startA: 1, endA: 2, startB: 1, endB: 2 },
			{ tag: 'delete', startA: 2, endA: 3, startB: 2, endB: 2 },
			{ tag: 'equal', startA: 3, endA: 5, startB: 2, endB: 4 },
			{ tag: 'delete', startA: 5, endA: 6, startB: 4, endB: 4 },
			{ tag: 'equal', startA: 6, endA: 7, startB: 4, endB: 5 },
			{ tag: 'insert', startA: 7, endA: 7, startB: 5, endB: 6 },
		]
		assert.deepEqual(opcodes, expectedOpcodes)
	})

	test('Test for Identical Strings.', async ({ assert }) => {
		const a = 'HELLO'.split('')
		const b = 'HELLO'.split('')

		const m = new MyersSequencer(a, b)

		const opcodes = m.getOpcodes()

		const expectedOpcodes: DiffChunk[] = [
			{ tag: 'equal', startA: 0, endA: 5, startB: 0, endB: 5 },
		]
		assert.deepEqual(opcodes, expectedOpcodes)
	})

	test('Test for Starting with an Equal.', async ({ assert }) => {
		const a = '12345'.split('')
		const b = '123'.split('')

		const m = new MyersSequencer(a, b)

		const opcodes = m.getOpcodes()

		const expectedOpcodes: DiffChunk[] = [
			{ tag: 'equal', startA: 0, endA: 3, startB: 0, endB: 3 },
			{ tag: 'delete', startA: 3, endA: 5, startB: 3, endB: 3 },
		]
		assert.deepEqual(opcodes, expectedOpcodes)
	})

	test('Test for Ending in an Equal.', async ({ assert }) => {
		const a = 'ABC'.split('')
		const b = 'XYZABC'.split('')

		const m = new MyersSequencer(a, b)

		const opcodes = m.getOpcodes()

		const expectedOpcodes: DiffChunk[] = [
			{ tag: 'insert', startA: 0, endA: 0, startB: 0, endB: 3 },
			{ tag: 'equal', startA: 0, endA: 3, startB: 3, endB: 6 },
		]
		assert.deepEqual(opcodes, expectedOpcodes)
	})

	test('Test for Insert and Delete.', async ({ assert }) => {
		const a = 'ABCD'.split('')
		const b = 'AEBF'.split('')

		const m = new MyersSequencer(a, b)

		const opcodes = m.getOpcodes()

		const expectedOpcodes: DiffChunk[] = [
			{ tag: 'equal', startA: 0, endA: 1, startB: 0, endB: 1 },
			{ tag: 'insert', startA: 1, endA: 1, startB: 1, endB: 2 },
			{ tag: 'equal', startA: 1, endA: 2, startB: 2, endB: 3 },
			{ tag: 'replace', startA: 2, endA: 4, startB: 3, endB: 4 },
		]
		assert.deepEqual(opcodes, expectedOpcodes)
	})

	test('Test with Complex Changes', async ({ assert }) => {
		const a = 'MNOXYZ'.split('')
		const b = 'OPQRXYZ'.split('')

		const m = new MyersSequencer(a, b)

		const opcodes = m.getOpcodes()

		const expectedOpcodes: DiffChunk[] = [
			{ tag: 'delete', startA: 0, endA: 2, startB: 0, endB: 0 },
			{ tag: 'equal', startA: 2, endA: 3, startB: 0, endB: 1 },
			{ tag: 'insert', startA: 3, endA: 3, startB: 1, endB: 4 },
			{ tag: 'equal', startA: 3, endA: 6, startB: 4, endB: 7 },
		]
		assert.deepEqual(opcodes, expectedOpcodes)
	})

	test('Test difference with Complex Changes', async ({ assert }) => {
		const a = 'MNOXYZ'.split('')
		const b = 'OPQRXYZ'.split('')

		const m = new MyersSequencer(a, b)

		const opcodes = m.getDifferenceOpcodes()

		const expectedOpcodes: DiffChunk[] = [
			{ tag: 'delete', startA: 0, endA: 2, startB: 0, endB: 0 },
			{ tag: 'insert', startA: 3, endA: 3, startB: 1, endB: 4 },
		]
		assert.deepEqual(opcodes, expectedOpcodes)
	})

	test('Test difference with Identical Strings', async ({ assert }) => {
		const a = 'HELLOWORLD'.split('')
		const b = 'HELLOWORLD'.split('')

		const m = new MyersSequencer(a, b)

		const opcodes = m.getDifferenceOpcodes()
		assert.empty(opcodes)
	})
})
