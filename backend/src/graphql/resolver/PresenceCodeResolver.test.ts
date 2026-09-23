// AI-GENERATED — not an architecture reference

import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import {
  AppDatabase,
  User as DbUser,
  UserContact as DbUserContact,
  getHomeCommunity,
} from 'database'
import { GraphQLError } from 'graphql'
import {
  PRESENCE_CODE_VALID_MINUTES,
  PRESENCE_MAX_UNCONFIRMED,
  verifyPresenceCode,
} from '@/data/PresenceCode.logic'
import { encryptPassword } from '@/password/PasswordEncryptor'
import { userFactory } from '@/seeds/factory/user'
import { login } from '@/seeds/graphql/mutations'
import { presenceCode } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'

jest.mock('@/password/EncryptorUtils')

jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    sendAssistedRegistrationConfirmEmail: jest.fn(),
    sendEmailTranslated: jest.fn(),
  }
})

const PASSWORD = 'Aa12345_'
const GUEST_EMAIL = 'carla@table.example'

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let communityUuid: string
let bob: DbUser

/**
 * An account opened at the referrer's table, in the state `registerAccount` leaves it in when
 * it gets a password (`passwordPlain`): the referrer recorded, the password set, the address
 * unconfirmed. Written here directly, because nothing opens such an account over `createUser`
 * yet - the table code is only minted so far, not taken.
 */
const openTableAccount = async (
  guest: { email: string; firstName: string; lastName: string; alias: string },
  referrerAlias: string,
): Promise<DbUser> => {
  const referrer = await DbUser.findOneOrFail({ where: { alias: referrerAlias } })
  const dbUser = await userFactory(null, { ...guest, emailChecked: false, language: 'de' })
  // Type first, then encrypt - the derivation salts by the type, as in registerAccount.
  dbUser.passwordEncryptionType = PasswordEncryptionType.GRADIDO_ID
  dbUser.password = await encryptPassword(dbUser, PASSWORD)
  dbUser.referrerId = referrer.id
  await dbUser.save()
  return dbUser
}

const loginAs = async (email: string): Promise<void> => {
  resetToken()
  const { errors } = await mutate({ mutation: login, variables: { email, password: PASSWORD } })
  expect(errors).toBeUndefined()
}

const ageRows = async (user: DbUser, hoursAgo: number): Promise<void> => {
  const then = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
  await db.getDataSource().query('UPDATE users SET created_at = ? WHERE id = ?', [then, user.id])
  await db
    .getDataSource()
    .query('UPDATE user_contacts SET created_at = ?, updated_at = ? WHERE id = ?', [
      then,
      then,
      user.emailId,
    ])
}

beforeAll(async () => {
  const testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
  await userFactory(testEnv, bibiBloxberg)
  bob = await userFactory(testEnv, bobBaumeister)
  // No user name: the seed gives him none.
  await userFactory(testEnv, peterLustig)
  const homeCom = await getHomeCommunity()
  communityUuid = homeCom?.communityUuid ?? ''
  expect(communityUuid).not.toBe('')
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

describe('PresenceCodeResolver', () => {
  it('refuses a caller who is not signed in', async () => {
    resetToken()
    await expect(query({ query: presenceCode })).resolves.toMatchObject({
      errors: [new GraphQLError('401 Unauthorized')],
    })
  })

  // The query takes no argument: what comes back is minted for the caller's own name.
  it("mints a code for the caller's own name and this community, good for ten minutes", async () => {
    await loginAs('bibi@bloxberg.de')
    const before = Date.now()
    const { data, errors } = await query({ query: presenceCode })
    const after = Date.now()

    expect(errors).toBeUndefined()
    const { code, alias, expiresAt, remainingMs } = data.presenceCode
    expect(verifyPresenceCode(code, 'BBB', communityUuid)).toBe(true)
    expect(verifyPresenceCode(code, 'MeisterBob', communityUuid)).toBe(false)
    // The name the code is sealed for, so the wallet builds the link from it.
    expect(alias).toBe('BBB')
    const expiry = new Date(expiresAt).getTime()
    const validMs = PRESENCE_CODE_VALID_MINUTES * 60 * 1000
    // Whole seconds in the code, so up to a second earlier than the clock said.
    expect(expiry).toBeGreaterThan(before + validMs - 1000)
    expect(expiry).toBeLessThanOrEqual(after + validMs)
    expect(code.split('.')[0]).toBe(String(expiry / 1000))
    // What the wallet counts down from the arrival, whatever the device's clock says.
    expect(remainingMs).toBeGreaterThan(validMs - 1000)
    expect(remainingMs).toBeLessThanOrEqual(validMs)
    expect(data.presenceCode.unconfirmedGuests).toEqual([])
  })

  // The expected answer for a member without a user name, on every visit: no code, and no
  // error either, so the wallet offers no new try and the log holds no error line.
  it('mints none for a member without a user name, and says so without an error', async () => {
    await loginAs('peter@lustig.de')
    await expect(query({ query: presenceCode })).resolves.toMatchObject({
      data: { presenceCode: null },
      errors: undefined,
    })
  })

  // The session loads deleted users too, and registerAccount does not find them: a code of
  // theirs would open accounts with nobody recorded as having vouched.
  it('mints none for a member deleted while still signed in', async () => {
    const bibi = await DbUser.findOneOrFail({ where: { alias: 'BBB' } })
    await loginAs('bibi@bloxberg.de')
    await DbUser.update(bibi.id, { deletedAt: new Date() })
    try {
      await expect(query({ query: presenceCode })).resolves.toMatchObject({
        data: { presenceCode: null },
        errors: undefined,
      })
    } finally {
      await DbUser.update(bibi.id, { deletedAt: null })
    }
  })

  // Not on RESTRICTED_FOR_PROJECT_ACCOUNT: an account that does not create may still show.
  it('mints one for a project account too', async () => {
    await DbUser.update(bob.id, { creationAllowed: false })
    try {
      await loginAs('bob@baumeister.de')
      const { data, errors } = await query({ query: presenceCode })

      expect(errors).toBeUndefined()
      expect(verifyPresenceCode(data.presenceCode.code, 'MeisterBob', communityUuid)).toBe(true)
    } finally {
      await DbUser.update(bob.id, { creationAllowed: true })
    }
  })

  /**
   * E-019 and E-020: under the code the member sees the guests they vouch for who have not
   * confirmed yet, with first name, last name and user name. At PRESENCE_MAX_UNCONFIRMED there
   * is no code - the member sees it on their own screen before a guest scans.
   */
  describe('the guests a member vouches for', () => {
    const guestEmail = (n: number): string => `tischgast${n}@table.example`

    const openGuest = async (n: number, referrer = 'BBB'): Promise<void> => {
      await openTableAccount(
        {
          email: guestEmail(n),
          firstName: `Vorname${n}`,
          lastName: `Nachname${n}`,
          alias: `tischgast${n}`,
        },
        referrer,
      )
    }

    const askAs = async (email: string) => {
      await loginAs(email)
      const { data, errors } = await query({ query: presenceCode })
      expect(errors).toBeUndefined()
      return data.presenceCode
    }
    const aliases = (answer: { unconfirmedGuests: { alias: string }[] }) =>
      answer.unconfirmedGuests.map((guest) => guest.alias)

    beforeAll(async () => {
      for (const n of [1, 2, 3]) {
        await openGuest(n)
      }
    })

    it('lists three unconfirmed guests with their names, and mints a code', async () => {
      const answer = await askAs('bibi@bloxberg.de')

      expect(verifyPresenceCode(answer.code, 'BBB', communityUuid)).toBe(true)
      expect(answer.unconfirmedGuests).toEqual(
        [1, 2, 3].map((n) => ({
          firstName: `Vorname${n}`,
          lastName: `Nachname${n}`,
          alias: `tischgast${n}`,
          createdAt: expect.any(String),
        })),
      )
    })

    it('mints no code once they are as many as the limit, and lists them all', async () => {
      for (let n = 4; n <= PRESENCE_MAX_UNCONFIRMED; n++) {
        await openGuest(n)
      }
      const answer = await askAs('bibi@bloxberg.de')

      expect(answer).toMatchObject({ code: null, expiresAt: null, remainingMs: 0 })
      expect(aliases(answer)).toHaveLength(PRESENCE_MAX_UNCONFIRMED)
      expect(aliases(answer).slice(0, 3)).toEqual(['tischgast1', 'tischgast2', 'tischgast3'])
    })

    it('mints again once one of them confirms, and lists the others', async () => {
      const contact = await DbUserContact.findOneOrFail({ where: { email: guestEmail(1) } })
      await DbUserContact.update(contact.id, { emailChecked: true })
      const answer = await askAs('bibi@bloxberg.de')

      expect(verifyPresenceCode(answer.code, 'BBB', communityUuid)).toBe(true)
      expect(aliases(answer)).toHaveLength(PRESENCE_MAX_UNCONFIRMED - 1)
      expect(aliases(answer)).not.toContain('tischgast1')
    })

    // The way back through support: a dead guest account deleted in the admin.
    it('leaves out a guest account that was deleted', async () => {
      const guest = await DbUser.findOneOrFail({ where: { alias: 'tischgast2' } })
      await DbUser.update(guest.id, { deletedAt: new Date() })
      try {
        const answer = await askAs('bibi@bloxberg.de')

        expect(aliases(answer)).toHaveLength(PRESENCE_MAX_UNCONFIRMED - 2)
        expect(aliases(answer)).not.toContain('tischgast2')
      } finally {
        // Put back, like the deleted-member test above: everything after this would otherwise
        // run with a half-deleted guest whose user_aliases row still holds their name.
        await DbUser.update(guest.id, { deletedAt: null })
      }
    })

    // ⛔ E-020 rests on this one: the list carries real names, so it must never reach past the
    // caller. The other member needs guests of their own for the test to be able to fail - with
    // an empty fixture on the far side it passes with or without the referrer clause.
    it("never shows a member another member's guests", async () => {
      await openGuest(9, 'MeisterBob')

      const bobs = await askAs('bob@baumeister.de')
      const bibis = await askAs('bibi@bloxberg.de')

      expect(aliases(bobs)).toEqual(['tischgast9'])
      expect(aliases(bibis)).not.toContain('tischgast9')
      expect(aliases(bibis).length).toBeGreaterThan(0)
    })

    // A name is nullable in the database, and a non-null field over it would take the whole
    // answer down: the null travels up through [UnconfirmedGuest!]! to presenceCode, and the
    // member sees no code at all until somebody repairs that other account.
    it('still answers when a guest has no name', async () => {
      const guest = await DbUser.findOneOrFail({ where: { alias: 'tischgast3' } })
      const { firstName, lastName } = guest
      // Over SQL, because the columns are `nullable: true` while the entity's TypeScript type
      // says `string` - which is the very mismatch this test is here for.
      const setNames = async (first: string | null, last: string | null): Promise<void> => {
        await DbUser.getRepository().query(
          'UPDATE users SET first_name = ?, last_name = ? WHERE id = ?',
          [first, last, guest.id],
        )
      }
      await setNames(null, null)
      try {
        const answer = await askAs('bibi@bloxberg.de')

        expect(aliases(answer)).toContain('tischgast3')
        expect(
          answer.unconfirmedGuests.find(
            (g: { alias: string }) => g.alias === 'tischgast3',
          ) as unknown,
        ).toMatchObject({ firstName: null, lastName: null })
      } finally {
        await setNames(firstName, lastName)
      }
    })
  })

  /**
   * E-018: only a confirmed member vouches. A guest of a table code holds every other right
   * while their grace period runs, but not this one - checked at once, not through
   * RESTRICTED_WHILE_UNCONFIRMED, which takes hold only after the grace period. Once the
   * address is confirmed, the new member shows the next guest a code.
   */
  describe('a guest who came in with a table code', () => {
    let guest: DbUser

    beforeAll(async () => {
      await openTableAccount(
        { email: GUEST_EMAIL, firstName: 'Carla', lastName: 'Tisch', alias: 'CarlaTisch' },
        'MeisterBob',
      )
      guest = await DbUser.findOneOrFail({
        where: { emailContact: { email: GUEST_EMAIL } },
        relations: ['emailContact'],
      })
      expect(guest.emailContact.emailChecked).toBe(false)
    })

    it('may not show a code while the address is unconfirmed, inside the grace period too', async () => {
      await loginAs(GUEST_EMAIL)

      await expect(query({ query: presenceCode })).resolves.toMatchObject({
        errors: [new GraphQLError('Confirm your address first')],
      })
    })

    it('may not once the grace period is over and the address is still unconfirmed', async () => {
      await ageRows(guest, 25)
      await loginAs(GUEST_EMAIL)

      await expect(query({ query: presenceCode })).resolves.toMatchObject({
        errors: [new GraphQLError('401 Unauthorized')],
      })
    })

    it('shows the next guest a code once the address is confirmed', async () => {
      await DbUserContact.update(guest.emailContact.id, { emailChecked: true })
      await loginAs(GUEST_EMAIL)
      const { data, errors } = await query({ query: presenceCode })

      expect(errors).toBeUndefined()
      expect(verifyPresenceCode(data.presenceCode.code, guest.alias, communityUuid)).toBe(true)
    })
  })
})
