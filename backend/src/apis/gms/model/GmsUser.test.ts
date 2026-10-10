// AI-GENERATED — not an architecture reference
import { User as dbUser } from 'database'

import { CONFIG } from '@/config'
import { GmsPublishLocationType } from '@/graphql/enum/GmsPublishLocationType'
import { PublishNameType } from '@/graphql/enum/PublishNameType'

import {
  APPROXIMATE_MAX_METERS,
  APPROXIMATE_MIN_METERS,
  approximatePoint,
} from '../approximatePoint'
import { GmsUser } from './GmsUser'

const ABOUT_ME = 'I grow tomatoes and lend out my cargo bike.'

// Only the fields the constructor reads. Cast, because a real dbUser carries a lot that
// has no say in what is sent over.
function member(gmsAllowed: boolean): dbUser {
  return {
    gradidoID: '3a2f6f1e-6c1a-4e1a-9d3e-2f1b7c8d9e01',
    language: 'de',
    aboutMe: ABOUT_ME,
    gmsAllowed,
    alias: 'bibi',
    firstName: 'Bibi',
    lastName: 'Bloxberg',
    gmsPublishName: PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS,
    gmsPublishLocation: GmsPublishLocationType.GMS_LOCATION_TYPE_APPROXIMATE,
    location: { type: 'Point', coordinates: [9.69, 49.28] },
    emailContact: { email: 'bibi@bloxberg.de', gmsPublishEmail: true },
  } as unknown as dbUser
}

describe('GmsUser', () => {
  describe('alias', () => {
    // NU-024: the display is the alias, no longer steered by the publish-name setting.
    // The key the GMS recognises the member by is uuid and does not move.
    it('is the member alias, whatever the old publish-name setting says', () => {
      const withFullNameSetting = {
        ...member(true),
        gmsPublishName: PublishNameType.PUBLISH_NAME_FULL,
      } as dbUser
      expect(new GmsUser(withFullNameSetting).alias).toBe('bibi')
      expect(new GmsUser(withFullNameSetting).uuid).toBe('3a2f6f1e-6c1a-4e1a-9d3e-2f1b7c8d9e01')
    })

    it('falls back to the full gradidoID without one', () => {
      const nameless = { ...member(true), alias: null } as unknown as dbUser
      expect(new GmsUser(nameless).alias).toBe('3a2f6f1e-6c1a-4e1a-9d3e-2f1b7c8d9e01')
    })
  })

  /**
   * ⛔ The empty position, on its way OUT. Until 10.09.2026 this read the column straight --
   * `this.location = user.location.coordinates` -- so a point without coordinates became
   * `[]`, and `[]` is truthy: the fallback that exists for "no position" never fired, and a
   * member with none was published to the GMS at `location: []` with an exact publish type.
   */
  describe('location', () => {
    // Somebody who chose "exact": the pair travels as it is stored, so these read its form.
    const withPoint = (coordinates: number[]) =>
      ({
        ...member(true),
        gmsPublishLocation: GmsPublishLocationType.GMS_LOCATION_TYPE_EXACT,
        location: { type: 'Point', coordinates },
      }) as unknown as dbUser

    it('sends the pair the way the GMS reads it, longitude first', () => {
      const sent = new GmsUser(withPoint([9.69, 49.28]))
      expect(sent.location).toEqual([9.69, 49.28])
      expect(sent.type).toBe(GmsPublishLocationType[GmsPublishLocationType.GMS_LOCATION_TYPE_EXACT])
    })

    it('sends a zero coordinate too -- the prime meridian is a place', () => {
      expect(new GmsUser(withPoint([0, 51.5])).location).toEqual([0, 51.5])
    })

    it.each([
      ['a point with no coordinates -- the case that happened', [] as number[]],
      ['half a pair', [9.69]],
    ])('refuses to send a member without a place: %s', (_name, coordinates) => {
      expect(() => new GmsUser(withPoint(coordinates))).toThrow('Missing Location')
    })

    it('refuses to send a member without a point at all', () => {
      const pointless = { ...member(true), location: null } as unknown as dbUser
      expect(() => new GmsUser(pointless)).toThrow('Missing Location')
    })
  })

  /**
   * Somebody who lets themselves be found "approximately" -- what every member starts with --
   * is told: in the surroundings, never on the doorstep. So their home is not what is sent
   * (Bernd, 10.10.2026): this server moves the point before it hands it on.
   */
  describe('the point of a member who is to be found approximately', () => {
    const HOME = [9.69, 49.28]
    const approximately = (over: Partial<dbUser> = {}) =>
      ({ ...member(true), location: { type: 'Point', coordinates: HOME }, ...over }) as dbUser
    // Metres between two pairs as the GMS reads them, longitude first.
    const metersBetween = (a: number[], b: number[]) => {
      const rad = (degrees: number) => (degrees * Math.PI) / 180
      const h =
        Math.sin(rad(b[1] - a[1]) / 2) ** 2 +
        Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(rad(b[0] - a[0]) / 2) ** 2
      return 2 * 6_371_000 * Math.asin(Math.sqrt(h))
    }

    it('is not their home, and lies a few hundred metres from it', () => {
      const sent = new GmsUser(approximately())

      expect(sent.location).toHaveLength(2)
      expect(sent.location).not.toEqual(HOME)
      const meters = metersBetween(HOME, sent.location)
      expect(meters).toBeGreaterThanOrEqual(APPROXIMATE_MIN_METERS - 0.5)
      expect(meters).toBeLessThanOrEqual(APPROXIMATE_MAX_METERS + 0.5)
    })

    // Which point, is this server's to decide and nobody else's: by the member's gradidoID, their
    // home and the server's own secret. No other key, and nothing that differs between two runs
    // of the server (a second reader: no test noticed another key being handed in).
    it("is the point that this server's secret decides for this member at this home", () => {
      const expected = approximatePoint(
        { latitude: HOME[1], longitude: HOME[0] },
        '3a2f6f1e-6c1a-4e1a-9d3e-2f1b7c8d9e01',
        CONFIG.JWT_SECRET,
      )

      expect(new GmsUser(approximately()).location).toEqual([expected.longitude, expected.latitude])
    })

    it('is another one on a server with another secret', () => {
      const here = new GmsUser(approximately()).location
      const kept = CONFIG.JWT_SECRET
      CONFIG.JWT_SECRET = 'the secret of another server'
      try {
        expect(metersBetween(here, new GmsUser(approximately()).location)).toBeGreaterThan(10)
      } finally {
        CONFIG.JWT_SECRET = kept
      }
    })

    it('still says that it is an approximate one', () => {
      expect(new GmsUser(approximately()).type).toBe(
        GmsPublishLocationType[GmsPublishLocationType.GMS_LOCATION_TYPE_APPROXIMATE],
      )
    })

    // Every update of a member sends them again, and the point must not wander with it
    // (Bernd, 10.10.2026): the veiled place stays, or the mark would jump on the map of the
    // others. A new entry does not send the member's place at all (syncMatchingEntryToGms).
    it('is the same one every time the member is sent', () => {
      const first = new GmsUser(approximately()).location
      const afterAnUpdate = new GmsUser(approximately({ alias: 'bibi-neu', language: 'en' }))
        .location

      expect(afterAnUpdate).toEqual(first)
    })

    it('is another one for another member at the same address', () => {
      const one = new GmsUser(approximately()).location
      const other = new GmsUser(
        approximately({ gradidoID: '7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f' }),
      ).location

      expect(metersBetween(one, other)).toBeGreaterThan(10)
    })

    // The coarser reading is the one that never hands on more than the member allowed: only
    // "exact" sends the home.
    it('is moved as well for a setting this server does not know', () => {
      const sent = new GmsUser(approximately({ gmsPublishLocation: 2 }))

      const meters = metersBetween(HOME, sent.location)
      expect(meters).toBeGreaterThanOrEqual(APPROXIMATE_MIN_METERS - 0.5)
      expect(meters).toBeLessThanOrEqual(APPROXIMATE_MAX_METERS + 0.5)
    })

    it('leaves the home of a member who chose "exact" where it is', () => {
      const sent = new GmsUser(
        approximately({ gmsPublishLocation: GmsPublishLocationType.GMS_LOCATION_TYPE_EXACT }),
      )

      expect(sent.location).toEqual(HOME)
    })
  })

  describe('aboutMe', () => {
    it('travels along for a member who takes part', () => {
      expect(new GmsUser(member(true)).aboutMe).toBe(ABOUT_ME)
    })

    it('is not sent for a member who does not take part', () => {
      // null, not left out: leaving it out lets the GMS keep what it already has, and a
      // text written while consent was on has to go when it is switched off.
      expect(new GmsUser(member(false)).aboutMe).toBeNull()
    })

    it('is gated the same way as the email next to it', () => {
      // Proves the fixture rather than the field: without gmsAllowed doing any work here,
      // the test above could pass for the wrong reason.
      expect(new GmsUser(member(true)).email).toBe('bibi@bloxberg.de')
      expect(new GmsUser(member(false)).email).toBeUndefined()
    })
  })
})
