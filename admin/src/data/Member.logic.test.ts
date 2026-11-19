// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { isTheModerator, memberKey } from './Member.logic'

const moderator = { communityUuid: 'AB-cd', gradidoID: 'EF-01' }

describe('memberKey', () => {
  it('names a member the same in upper and lower case', () => {
    expect(memberKey(moderator)).toBe(memberKey({ communityUuid: 'ab-CD', gradidoID: 'ef-01' }))
  })
})

describe('isTheModerator', () => {
  it('knows the moderator by their pair', () => {
    expect(isTheModerator(moderator, { communityUuid: 'ab-cd', gradidoID: 'ef-01' })).toBe(true)
    expect(isTheModerator(moderator, { communityUuid: 'ab-cd', gradidoID: 'ef-02' })).toBe(false)
  })

  it('takes nobody for the moderator where no moderator with a pair is signed in', () => {
    expect(isTheModerator(null, moderator)).toBe(false)
    expect(isTheModerator({ communityUuid: 'ab-cd' }, { communityUuid: 'ab-cd' })).toBe(false)
  })
})
