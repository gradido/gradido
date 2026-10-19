// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'vitest'
import { isTheModerator, moderatorKey } from './theModerator'

describe('theModerator', () => {
  const moderator = { gradidoID: 'AB-12', communityUuid: 'Home', role: 'ADMIN' }

  describe('moderatorKey', () => {
    it('names the moderator by their pair, lowercased', () => {
      expect(moderatorKey(moderator)).toBe('home/ab-12')
    })

    it('is null where no moderator with a pair is signed in', () => {
      expect(moderatorKey(null)).toBeNull()
      expect(moderatorKey({ role: 'ADMIN' })).toBeNull()
    })
  })

  describe('isTheModerator', () => {
    it('is true for a row naming the moderator, however the pair is written', () => {
      expect(isTheModerator(moderator, { gradidoID: 'ab-12', communityUuid: 'home' })).toBe(true)
    })

    it('is false for somebody else, also of the same id in another community', () => {
      expect(isTheModerator(moderator, { gradidoID: 'cd-34', communityUuid: 'home' })).toBe(false)
      expect(isTheModerator(moderator, { gradidoID: 'ab-12', communityUuid: 'away' })).toBe(false)
    })

    it('is false where either side names nobody', () => {
      expect(isTheModerator(null, { gradidoID: 'ab-12', communityUuid: 'home' })).toBe(false)
      expect(isTheModerator(moderator, {})).toBe(false)
      expect(isTheModerator(moderator, undefined)).toBe(false)
    })
  })
})
