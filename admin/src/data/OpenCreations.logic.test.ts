// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import type { HandledCreationGroups } from './CreationGroup.schema'
import { openCreationsOf } from './OpenCreations.logic'

const NONE: HandledCreationGroups = { groupIds: [], untagged: false, off: false }

const counts = (
  forModeration: number,
  forMember: number,
  allOpen: number,
  everythingOpen = forModeration + forMember,
  handledCreationGroups = NONE,
) => ({
  waitingForModeration: { contributionCount: forModeration },
  waitingForMember: { contributionCount: forMember },
  allOpen: { contributionCount: allOpen },
  everythingOpen: { contributionCount: everythingOpen },
  handledCreationGroups,
})

describe('openCreationsOf', () => {
  it('counts as open what waits for the moderation or the member, the rest as resubmission', () => {
    expect(openCreationsOf(counts(2, 1, 5))).toEqual({
      forModeration: 2,
      forMember: 1,
      open: 3,
      onResubmission: 2,
      elsewhere: 0,
      off: false,
    })
  })

  it('counts nothing less than nothing on resubmission', () => {
    expect(openCreationsOf(counts(2, 1, 2)).onResubmission).toBe(0)
  })

  // "Meine Gruppen" (MG1)
  it('counts what is open outside the groups chosen', () => {
    expect(
      openCreationsOf(counts(2, 1, 5, 7, { groupIds: [3], untagged: false, off: false })).elsewhere,
    ).toBe(4)
    expect(
      openCreationsOf(counts(0, 0, 0, 2, { groupIds: [], untagged: true, off: false })).elsewhere,
    ).toBe(2)
  })

  // Without a choice the counts take everything: a creation arriving between them is no rest.
  it('counts nothing elsewhere where nothing is chosen', () => {
    expect(openCreationsOf(counts(2, 1, 5, 4)).elsewhere).toBe(0)
  })

  it('counts nothing less than nothing elsewhere', () => {
    expect(
      openCreationsOf(counts(2, 1, 5, 2, { groupIds: [3], untagged: false, off: false })).elsewhere,
    ).toBe(0)
  })
})

// MG5: the creations switched off -- the page says nothing of them
describe('openCreationsOf, switched off', () => {
  it('hands the switch on', () => {
    expect(
      openCreationsOf(counts(0, 0, 0, 3, { groupIds: [3], untagged: false, off: true })).off,
    ).toBe(true)
  })
})
