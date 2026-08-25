// AI-GENERATED — not an architecture reference
import { User as dbUser } from 'database'

import { GmsPublishLocationType } from '@/graphql/enum/GmsPublishLocationType'
import { PublishNameType } from '@/graphql/enum/PublishNameType'

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
    location: null,
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
