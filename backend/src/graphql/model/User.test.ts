// AI-GENERATED — not an architecture reference

import { User } from '@model/User'
import { User as DbUser } from 'database'

import { CONFIG } from '@/config'
import { Location2Point } from '@/graphql/resolver/util/Location2Point'

// The member as the schema hands them out, built from a row. Here only what the pin in the
// admin interface reads: whether the member stands on the map, worked out when the object is
// built. Who is told is the field resolver's (UserResolver.test.ts, findableOnMap.test.ts).
describe('User', () => {
  const originalGms = CONFIG.GMS_ACTIVE
  const originalMatching = CONFIG.MATCHING_ACTIVE
  const PLACE = { longitude: 9.495606, latitude: 51.314472 }

  const row = (more: Partial<DbUser> = {}) =>
    ({
      id: 7,
      foreign: false,
      gradidoID: '1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d',
      communityUuid: '9f8e7d6c-5b4a-4c3d-9e2f-1a0b9c8d7e6f',
      alias: 'bibi',
      firstName: 'Bibi',
      lastName: 'Bloxberg',
      gmsAllowed: true,
      location: Location2Point(PLACE),
      deletedAt: null,
      createdAt: new Date('2025-03-01T10:00:00.000Z'),
      language: 'de',
      ...more,
    }) as DbUser

  beforeEach(() => {
    CONFIG.GMS_ACTIVE = true
    CONFIG.MATCHING_ACTIVE = true
  })

  afterEach(() => {
    CONFIG.GMS_ACTIVE = originalGms
    CONFIG.MATCHING_ACTIVE = originalMatching
  })

  describe('findableOnMap', () => {
    it('is yes for a member who allows being found and has a place pinned', () => {
      const user = new User(row())
      expect(user.findableOnMap).toBe(true)
      // The fixture proves itself: this is a row with a place.
      expect(user.userLocation).toEqual(PLACE)
    })

    it.each([
      ['does not allow being found', { gmsAllowed: false }],
      ['has no place pinned', { location: null }],
      ['is deleted', { deletedAt: new Date() }],
    ])('is no for a member who %s', (_name, more) => {
      expect(new User(row(more)).findableOnMap).toBe(false)
    })

    it('is no for everybody where matching is off', () => {
      CONFIG.MATCHING_ACTIVE = false
      expect(new User(row()).findableOnMap).toBe(false)
    })

    // A member object that was not built from a row -- the sender of a link from another
    // community -- carries no answer at all, and the field resolver reads that as null.
    it('is not set on a member object without a row', () => {
      expect(new User(null).findableOnMap).toBeUndefined()
    })
  })
})
