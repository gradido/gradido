// AI-GENERATED — not an architecture reference

import { Location } from '@model/Location'

import { MODERATOR_RIGHTS } from '@/auth/MODERATOR_RIGHTS'
import { RIGHTS } from '@/auth/RIGHTS'
import {
  ROLE_ADMIN,
  ROLE_MODERATOR,
  ROLE_MODERATOR_AI,
  ROLE_UNAUTHORIZED,
  ROLE_USER,
} from '@/auth/ROLES'
import { Role } from '@/auth/Role'
import { USER_RIGHTS } from '@/auth/USER_RIGHTS'
import { CONFIG } from '@/config'
import { Context } from '@/server/context'

import { isFindableOnMap, mayKnowFindable } from './findableOnMap'
import { Location2Point } from './Location2Point'

/**
 * The pin behind a member's name in the admin interface stands for one sentence: this member
 * can be shown on the wallet's map. Two questions carry it -- who stands on the map, and who
 * is told -- and both are answered here without a database. What the schema makes of them is
 * in UserResolver.test.ts.
 */
describe('findableOnMap', () => {
  const place = (longitude: number, latitude: number) => {
    const location = new Location()
    location.longitude = longitude
    location.latitude = latitude
    return Location2Point(location)
  }
  // Everything the rule asks for, so that each case below takes away exactly one thing.
  const onTheMap = () => ({
    gmsAllowed: true,
    location: place(9.495606, 51.314472),
    deletedAt: null as Date | null,
  })

  describe('isFindableOnMap', () => {
    const originalGms = CONFIG.GMS_ACTIVE
    const originalMatching = CONFIG.MATCHING_ACTIVE

    beforeEach(() => {
      CONFIG.GMS_ACTIVE = true
      CONFIG.MATCHING_ACTIVE = true
    })

    afterEach(() => {
      CONFIG.GMS_ACTIVE = originalGms
      CONFIG.MATCHING_ACTIVE = originalMatching
    })

    // First of all a yes: every other case here expects false, and a rule that never says
    // yes would pass them all.
    it('says yes for a member who allows being found and has a place pinned', () => {
      expect(isFindableOnMap(onTheMap())).toBe(true)
    })

    it('says no where the member does not allow being found, pinned or not', () => {
      expect(isFindableOnMap({ ...onTheMap(), gmsAllowed: false })).toBe(false)
      expect(isFindableOnMap({ ...onTheMap(), gmsAllowed: null })).toBe(false)
    })

    it('says no where no place is pinned, allowed or not', () => {
      expect(isFindableOnMap({ ...onTheMap(), location: null })).toBe(false)
      expect(isFindableOnMap({ ...onTheMap(), location: undefined })).toBe(false)
    })

    // What "unset" looks like in the column: Location2Point writes an empty point for a
    // missing pair, and a point that exists is not a place that is known.
    it('says no for a point without coordinates', () => {
      expect(isFindableOnMap({ ...onTheMap(), location: Location2Point(new Location()) })).toBe(
        false,
      )
    })

    // Rows older than the range check can hold one; the wallet's map opens for no such member.
    it('says no for a point off the globe', () => {
      expect(isFindableOnMap({ ...onTheMap(), location: place(9.49, 91) })).toBe(false)
    })

    // The admin's search loads deleted members as well; a deleted account takes no part in
    // matching any more.
    it('says no for a deleted member, whatever their row still holds', () => {
      expect(isFindableOnMap({ ...onTheMap(), deletedAt: new Date() })).toBe(false)
    })

    // GMS_ACTIVE alone is the older integration and is on in production; the wallet has the
    // map route only with MATCHING_ACTIVE. Each switch on its own, so that neither can stand
    // in for the other.
    it('says no on a server without the GMS', () => {
      CONFIG.GMS_ACTIVE = false
      expect(isFindableOnMap(onTheMap())).toBe(false)
    })

    it('says no where matching is switched off', () => {
      CONFIG.MATCHING_ACTIVE = false
      expect(isFindableOnMap(onTheMap())).toBe(false)
    })

    it('says no where both are off', () => {
      CONFIG.GMS_ACTIVE = false
      CONFIG.MATCHING_ACTIVE = false
      expect(isFindableOnMap(onTheMap())).toBe(false)
    })

    it('answers with a boolean, never with what it read', () => {
      expect(isFindableOnMap(onTheMap())).toStrictEqual(true)
      expect(isFindableOnMap({ ...onTheMap(), deletedAt: new Date() })).toStrictEqual(false)
      CONFIG.GMS_ACTIVE = false
      expect(isFindableOnMap(onTheMap())).toStrictEqual(false)
    })
  })

  describe('mayKnowFindable', () => {
    const BIBI = { id: 7 }
    const caller = (role: Role | undefined, id?: number): Context =>
      ({ role, user: id === undefined ? undefined : { id } }) as unknown as Context

    it.each([
      ['a moderator', ROLE_MODERATOR],
      ['a moderator with the AI rights', ROLE_MODERATOR_AI],
      ['an administrator', ROLE_ADMIN],
    ])('tells %s about any member', (_name, role) => {
      expect(mayKnowFindable(caller(role, 8), BIBI)).toBe(true)
    })

    it('tells a member about themselves', () => {
      expect(mayKnowFindable(caller(ROLE_USER, 7), BIBI)).toBe(true)
    })

    // The login runs on an inalienable right, so its role is that of nobody; it names the
    // member it has just authenticated before it returns, and that is who is asking.
    it('tells a member about themselves with the login itself', () => {
      expect(mayKnowFindable(caller(ROLE_UNAUTHORIZED, 7), BIBI)).toBe(true)
    })

    it('does not tell another member', () => {
      expect(mayKnowFindable(caller(ROLE_USER, 8), BIBI)).toBe(false)
    })

    // Whoever holds the code of a link reads the member who made it without a login.
    it('does not tell a caller without a login', () => {
      expect(mayKnowFindable(caller(ROLE_UNAUTHORIZED), BIBI)).toBe(false)
      expect(mayKnowFindable(caller(undefined), BIBI)).toBe(false)
    })

    // ⛔ Somebody has to be asking. A member object without an id exists -- a link from
    // another community names its sender that way -- and to a caller without a login the two
    // ids compare as the same: undefined on both sides.
    it('does not take a member object without an id for the own view of nobody', () => {
      expect(mayKnowFindable(caller(ROLE_UNAUTHORIZED), {})).toBe(false)
      expect(mayKnowFindable(caller(undefined), {})).toBe(false)
      expect(mayKnowFindable(caller(ROLE_UNAUTHORIZED), { id: null })).toBe(false)
      // Nor for the own view of a member who is logged in.
      expect(mayKnowFindable(caller(ROLE_USER, 7), {})).toBe(false)
    })

    // SEARCH_USERS and no other: the right to look members up in the admin interface.
    it('goes by the right to search members, not by the role or its other rights', () => {
      const everythingButTheSearch = new Role('all but the search', [
        ...USER_RIGHTS,
        ...MODERATOR_RIGHTS.filter((right) => right !== RIGHTS.SEARCH_USERS),
      ])
      const theSearchAlone = new Role('the search alone', [RIGHTS.SEARCH_USERS])
      // The fixture proves itself: the first role really lost one right and kept the rest.
      expect(MODERATOR_RIGHTS).toContain(RIGHTS.SEARCH_USERS)
      expect(everythingButTheSearch.rights).toHaveLength(
        USER_RIGHTS.length + MODERATOR_RIGHTS.length - 1,
      )

      expect(mayKnowFindable(caller(everythingButTheSearch, 8), BIBI)).toBe(false)
      expect(mayKnowFindable(caller(theSearchAlone, 8), BIBI)).toBe(true)
    })
  })
})
