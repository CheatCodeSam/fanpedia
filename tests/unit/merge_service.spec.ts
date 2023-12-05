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
})
