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
