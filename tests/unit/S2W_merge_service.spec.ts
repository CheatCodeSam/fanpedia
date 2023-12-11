import { test } from '@japa/runner'
import { S3WMergeService } from 'App/Diff/Service'

test.group('S3WMergeService', () => {
  test('Test for Similar Strings.', async ({ assert }) => {
    const a = ['LineREVISION1', ' ', 'Line3', ' ', 'Line4', ' ', 'Line5', ' ', 'LineCONFLICT6']
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
        { tag: 'equal', value: ' ' },
        { tag: 'insert', value: 'REV' },
        { tag: 'insert', value: ' ' },
        { tag: 'equal', value: 'Line5' },
        { tag: 'equal', value: ' ' },
        { tag: 'conflict', value: 'LineREV6' },
      ],
    }

    assert.deepEqual(M, expectedValue)
  })
})
