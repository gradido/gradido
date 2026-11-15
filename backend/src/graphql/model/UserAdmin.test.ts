// AI-GENERATED — not an architecture reference

import { UserAdmin } from '@model/UserAdmin'
import { User } from 'database'

import { CONFIG } from '@/config'
import { Location2Point } from '@/graphql/resolver/util/Location2Point'

// A row of the admin's member search, built from the columns `searchUsers` selects. The pin
// behind the username reads three things off it: the pair that names the member, and whether
// they stand on the map. Without a database -- what the search really loads is asked in
// UserResolver.test.ts.
describe('UserAdmin', () => {
  const originalGms = CONFIG.GMS_ACTIVE
  const originalMatching = CONFIG.MATCHING_ACTIVE
  const GRADIDO_ID = '1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d'
  const COMMUNITY_UUID = '9f8e7d6c-5b4a-4c3d-9e2f-1a0b9c8d7e6f'

  const member = (more: Partial<User> = {}) =>
    ({
      id: 7,
      firstName: 'Bibi',
      lastName: 'Bloxberg',
      alias: 'bibi',
      gradidoID: GRADIDO_ID,
      communityUuid: COMMUNITY_UUID,
      gmsAllowed: true,
      location: Location2Point({ longitude: 9.495606, latitude: 51.314472 }),
      deletedAt: null,
      createdAt: new Date('2025-03-01T10:00:00.000Z'),
      creationAllowed: true,
      ...more,
    }) as User
  const row = (more: Partial<User> = {}, readsSupportDuty = false) =>
    new UserAdmin(member(more), [], '', readsSupportDuty)

  beforeEach(() => {
    CONFIG.GMS_ACTIVE = true
    CONFIG.MATCHING_ACTIVE = true
  })

  afterEach(() => {
    CONFIG.GMS_ACTIVE = originalGms
    CONFIG.MATCHING_ACTIVE = originalMatching
  })

  // Two different values, so that neither half of the pair can stand in for the other.
  it('names the member by their pair', () => {
    expect(row()).toEqual(
      expect.objectContaining({ gradidoID: GRADIDO_ID, communityUuid: COMMUNITY_UUID }),
    )
  })

  it('says of a member who allows being found and has a place pinned that they stand on the map', () => {
    expect(row().findableOnMap).toBe(true)
  })

  it.each([
    ['does not allow being found', { gmsAllowed: false }],
    ['has no place pinned', { location: null }],
    ['is deleted', { deletedAt: new Date() }],
  ])('says no of a member who %s', (_name, more) => {
    expect(row(more).findableOnMap).toBe(false)
  })

  it('says no of everybody where matching is off', () => {
    CONFIG.MATCHING_ACTIVE = false
    expect(row().findableOnMap).toBe(false)
  })

  // The username cell stays what it was: no gradidoID stands in where there is no username.
  it('leaves the username empty where the member has none', () => {
    expect(row({ alias: '' }).alias).toBeNull()
    expect(row({ alias: null as unknown as string }).alias).toBeNull()
  })

  it('carries no place', () => {
    expect(JSON.stringify(row())).not.toContain('9.495606')
    expect(Object.keys(row())).not.toContain('location')
    expect(Object.keys(row())).not.toContain('userLocation')
  })

  // Support-Anfragen K6: the tick "may handle support requests" goes to whoever may set it -- the
  // raw column, on every role row -- and to no other caller of the search.
  describe('supportDuty', () => {
    const ticked = { userRole: { role: 'MODERATOR', supportDuty: true } as User['userRole'] }

    it('tells whoever may set it the tick on the row, and no where there is no row', () => {
      expect(row(ticked, true).supportDuty).toBe(true)
      expect(
        row({ userRole: { role: 'ADMIN', supportDuty: false } as User['userRole'] }, true)
          .supportDuty,
      ).toBe(false)
      expect(row({ userRole: null }, true).supportDuty).toBe(false)
    })

    it('tells no other caller, also of a row with the tick', () => {
      const answer = row(ticked, false)
      // The fixture proves itself: the row is the moderator's.
      expect(answer.role).toBe('MODERATOR')
      expect(answer.supportDuty).toBeNull()
    })
  })
})
