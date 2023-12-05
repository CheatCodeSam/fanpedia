import { test } from '@japa/runner'
import { MergeService } from 'App/Diff/Service'

test.group('MergeService', () => {
  test('Merge single update from a', async ({ assert }) => {
    const o = ['Line 1', 'Line 2', 'Line 3', 'Line 4']
    const a = ['Line 1 REVISION', 'Line 2', 'Line 3', 'Line 4']
    const b = ['Line 1', 'Line 2', 'Line 3', 'Line 4']

    const changes = MergeService.threeWayMerge(a, o, b)

    const expectedChanges = ['Line 1 REVISION', 'Line 2', 'Line 3', 'Line 4']

    assert.deepEqual(changes, expectedChanges)
  })

  test('Merge single update from b.', async ({ assert }) => {
    const o = ['Line 1', 'Line 2', 'Line 3', 'Line 4']
    const a = ['Line 1', 'Line 2', 'Line 3', 'Line 4']
    const b = ['Line 1', 'Line 2', 'Line 3', 'Line 4 REVISION']

    const changes = MergeService.threeWayMerge(a, o, b)

    const expectedChanges = ['Line 1', 'Line 2', 'Line 3', 'Line 4 REVISION']

    assert.deepEqual(changes, expectedChanges)
  })

  test('Merge single update from a and b.', async ({ assert }) => {
    const o = ['Line 1', 'Line 2', 'Line 3', 'Line 4']
    const a = ['Line 1 REVISION', 'Line 2', 'Line 3', 'Line 4']
    const b = ['Line 1', 'Line 2', 'Line 3', 'Line 4 REVISION']

    const changes = MergeService.threeWayMerge(a, o, b)

    const expectedChanges = ['Line 1 REVISION', 'Line 2', 'Line 3', 'Line 4 REVISION']

    assert.deepEqual(changes, expectedChanges)
  })

  test('Merge complicated replace.', async ({ assert }) => {
    const o = ['a', 'b', 'c', 'd', 'e']
    const a = ['X', 'b', 'Y', 'd', 'Z']
    const b = ['a', 'W', 'c', 'V', 'e']

    const changes = MergeService.threeWayMerge(a, o, b)

    const expectedChanges: string[] = ['X', 'W', 'Y', 'V', 'Z']

    assert.deepEqual(changes, expectedChanges)
  })

  test('Merge insert at end.', async ({ assert }) => {
    const o = ['a', 'b', 'c', 'd', 'e']
    const a = ['X', 'b', 'c', 'd', 'e']
    const b = ['a', 'b', 'c', 'd', 'e', 'f', 'g']

    const changes = MergeService.threeWayMerge(a, o, b)

    const expectedChanges: string[] = ['X', 'b', 'c', 'd', 'e', 'f', 'g']

    assert.deepEqual(changes, expectedChanges)
  })

  test('Merge insert in middle.', async ({ assert }) => {
    const o = ['a', 'b', 'c', 'd', 'e']
    const a = ['X', 'b', 'c', 'd', 'e']
    const b = ['a', 'b', 'c', 'd', 'ADDITION', 'OTHERADDITION', 'e']

    const changes = MergeService.threeWayMerge(a, o, b)

    const expectedChanges: string[] = ['X', 'b', 'c', 'd', 'ADDITION', 'OTHERADDITION', 'e']

    assert.deepEqual(changes, expectedChanges)
  })

  test('Merge deletion at end.', async ({ assert }) => {
    const o = ['a', 'b', 'c', 'd', 'e']
    const a = ['X', 'b', 'c', 'd', 'e']
    const b = ['a', 'b', 'c', 'd']

    const changes = MergeService.threeWayMerge(a, o, b)

    const expectedChanges: string[] = ['X', 'b', 'c', 'd']

    assert.deepEqual(changes, expectedChanges)
  })

  test('Merge deletion in middle.', async ({ assert }) => {
    const o = ['a', 'b', 'c', 'd', 'e']
    const a = ['X', 'b', 'c', 'd', 'e']
    const b = ['a', 'b', 'e']

    const changes = MergeService.threeWayMerge(a, o, b)

    const expectedChanges: string[] = ['X', 'b', 'e']

    assert.deepEqual(changes, expectedChanges)
  })

  test('Expect conflict to default to o.', async ({ assert }) => {
    const o = ['a', 'b', 'c', 'd', 'e']
    const a = ['X', 'b', 'c', 'd', 'e']
    const b = ['Y', 'b', 'c', 'd', 'e']

    const changes = MergeService.threeWayMerge(a, o, b)

    const expectedChanges: string[] = ['a', 'b', 'c', 'd', 'e']

    assert.deepEqual(changes, expectedChanges)
  })

  test('Expect conflict to default to o and still merge non-conflicts.', async ({ assert }) => {
    const o = ['a', 'b', 'c', 'd', 'e']
    const a = ['X', 'b', 'c', 'REVISION', 'e']
    const b = ['Y', 'b', 'c', 'd', 'e']

    const changes = MergeService.threeWayMerge(a, o, b)

    const expectedChanges: string[] = ['a', 'b', 'c', 'REVISION', 'e']

    assert.deepEqual(changes, expectedChanges)
  })
})
