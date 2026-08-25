// AI-GENERATED — not an architecture reference

import { User as DbUser } from 'database'

import { UpdateUserInfosArgs } from '@/graphql/arg/UpdateUserInfosArgs'
import { PublishNameType } from '@/graphql/enum/PublishNameType'

import { compareGmsRelevantUserSettings } from './compareGmsRelevantUserSettings'

/**
 * Whether a settings change has to travel to the GMS.
 *
 * ⛔ Written for a silent under-sync: the alias clause used to also require the
 * publish-name setting to stand at ALIAS_OR_INITIALS. Since NU-024 the alias travels
 * regardless of that setting, so for every member whose stored setting still reads FULL
 * -- and nothing in the wallet can change it any more, the switch is gone -- a renamed
 * member kept their old alias in the GMS for good. Nothing crashed; the name over there
 * simply stopped following.
 */
describe('compareGmsRelevantUserSettings', () => {
  // ⚠️ The entity declares `alias: string` while the column is `nullable: true`, so a
  // member without one carries null at runtime and the type cannot say so. The cast is
  // that gap, named rather than hidden -- it is why the callers of this field reach for
  // `?? gradidoID` even though TypeScript says they need not.
  const NO_ALIAS = null as unknown as string

  const member = (overrides: Partial<DbUser> = {}): DbUser =>
    ({
      id: 1,
      alias: 'bibi-one',
      firstName: 'Bibi',
      lastName: 'Bloxberg',
      language: 'de',
      gmsAllowed: true,
      gmsPublishName: PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS,
      gmsPublishLocation: 0,
      aboutMe: null,
      location: null,
      ...overrides,
    }) as DbUser

  const change = (overrides: Partial<UpdateUserInfosArgs> = {}): UpdateUserInfosArgs =>
    overrides as UpdateUserInfosArgs

  describe('a changed alias', () => {
    it('travels', () => {
      expect(compareGmsRelevantUserSettings(member(), change({ alias: 'bibi-two' }))).toBe(true)
    })

    // The repair. Before it, this member's rename never reached the GMS.
    it('travels even when the old publish-name setting says something else', () => {
      const user = member({ gmsPublishName: PublishNameType.PUBLISH_NAME_FULL })

      expect(compareGmsRelevantUserSettings(user, change({ alias: 'bibi-two' }))).toBe(true)
    })

    it('travels for a member who had no alias before', () => {
      const user = member({
        alias: NO_ALIAS,
        gmsPublishName: PublishNameType.PUBLISH_NAME_INITIALS,
      })

      expect(compareGmsRelevantUserSettings(user, change({ alias: 'bibi-two' }))).toBe(true)
    })
  })

  describe('an unchanged alias', () => {
    it('does not travel', () => {
      expect(compareGmsRelevantUserSettings(member(), change({ alias: 'bibi-one' }))).toBe(false)
    })
  })

  // The publish-name setting steers nothing that goes over any more: `GmsUser` sets the
  // alias from the user itself and never assigns a name. A change to it is therefore not
  // a reason to talk to the GMS -- and it cannot arrive from the wallet at all.
  it('does not travel for the publish-name setting on its own', () => {
    const user = member({ gmsPublishName: PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS })

    expect(
      compareGmsRelevantUserSettings(
        user,
        change({ gmsPublishName: PublishNameType.PUBLISH_NAME_FULL }),
      ),
    ).toBe(false)
  })

  it('still lets the other settings through', () => {
    expect(compareGmsRelevantUserSettings(member(), change({ firstName: 'Benjamin' }))).toBe(true)
    expect(compareGmsRelevantUserSettings(member(), change({ language: 'en' }))).toBe(true)
    expect(compareGmsRelevantUserSettings(member(), change({ aboutMe: 'Hallo' }))).toBe(true)
  })

  it('reports nothing to do when nothing changed', () => {
    expect(compareGmsRelevantUserSettings(member(), change({}))).toBe(false)
  })
})
