// AI-GENERATED — not an architecture reference

import { inspect } from 'node:util'
import { getLogger } from 'config-schema/test/testSetup'
import { User as DbUser } from 'database'

import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
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

  // The comparison is handed everything updateUserInfos was asked for -- with a change of
  // password the old one and the new one, with a pinned place its coordinates. Its debug line
  // says which settings the request names and never what it sets them to.
  describe('its debug line', () => {
    const logger = getLogger(
      `${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.compareGmsRelevantUserSettings`,
    )
    // The line as the log would write it: strings as they are, objects through inspect.
    const written = (): string =>
      (logger.debug as jest.Mock).mock.calls
        .map((args) =>
          args
            .map((arg: unknown) => (typeof arg === 'string' ? arg : inspect(arg, { depth: 5 })))
            .join(' '),
        )
        .join('\n')

    beforeEach(() => {
      ;(logger.debug as jest.Mock).mockClear()
    })

    it('writes neither a password nor a position, only which settings are named', () => {
      const asked = change({
        password: 'Aa12345_',
        passwordNew: 'Bb12345_',
        gmsLocation: { latitude: 49.679437, longitude: 9.573224 },
        aboutMe: null,
        language: undefined,
      })

      expect(compareGmsRelevantUserSettings(member(), asked)).toBe(true)

      const line = written()
      for (const value of ['Aa12345_', 'Bb12345_', '49.679437', '9.573224']) {
        expect(line).not.toContain(value)
      }
      // A setting that is being cleared is named, one that was not sent is not.
      for (const name of ['password', 'passwordNew', 'gmsLocation', 'aboutMe']) {
        expect(line).toContain(`'${name}'`)
      }
      expect(line).not.toContain("'language'")
      // The member the comparison is about stands there as before.
      expect(line).toContain('"alias":"bibi-one"')
    })

    it('leaves what it was handed as it is', () => {
      const asked = change({ password: 'Aa12345_', passwordNew: 'Bb12345_' })

      compareGmsRelevantUserSettings(member(), asked)

      expect(asked).toEqual({ password: 'Aa12345_', passwordNew: 'Bb12345_' })
    })
  })
})
