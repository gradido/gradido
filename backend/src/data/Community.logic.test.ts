// AI-GENERATED — not an architecture reference
import { describe, expect, it } from '@jest/globals'
import { isSameCommunity } from './Community.logic'

describe('isSameCommunity', () => {
  it('says yes only for the same uuid', () => {
    expect(isSameCommunity('a-uuid', 'a-uuid')).toBe(true)
    expect(isSameCommunity('a-uuid', 'another-uuid')).toBe(false)
  })

  /**
   * ⛔ Missing is "cannot say", and that answers false. Callers use this to decide whether
   * they may speak FOR a community -- name it, build a member's address in it -- so a
   * wrong yes puts a wrong address in front of somebody, while a wrong no only leaves a
   * line off.
   */
  it.each([
    [null, null],
    [undefined, undefined],
    ['', ''],
    ['a-uuid', null],
    [null, 'a-uuid'],
    ['a-uuid', ''],
  ])('cannot say for (%s, %s)', (left, right) => {
    expect(isSameCommunity(left, right)).toBe(false)
  })
})
