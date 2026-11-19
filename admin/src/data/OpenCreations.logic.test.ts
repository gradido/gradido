// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { openCreationsOf } from './OpenCreations.logic'

const counts = (forModeration: number, forMember: number, allOpen: number) => ({
  waitingForModeration: { contributionCount: forModeration },
  waitingForMember: { contributionCount: forMember },
  allOpen: { contributionCount: allOpen },
})

describe('openCreationsOf', () => {
  it('counts as open what waits for the moderation or the member, the rest as resubmission', () => {
    expect(openCreationsOf(counts(2, 1, 5))).toEqual({
      forModeration: 2,
      forMember: 1,
      open: 3,
      onResubmission: 2,
    })
  })

  it('counts nothing less than nothing on resubmission', () => {
    expect(openCreationsOf(counts(2, 1, 2)).onResubmission).toBe(0)
  })
})
