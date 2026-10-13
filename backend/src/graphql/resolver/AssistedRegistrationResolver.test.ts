// AI-GENERATED — not an architecture reference
import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import { ApolloServerTestClient, cleanDB, resetToken, testEnvironment } from '@test/helpers'
import {
  sendEmailChangeConfirmEmail,
  sendEmailChangeNoticeEmail,
  sendEmailChangeSupportEmail,
} from 'core'
import {
  AccountState,
  AppDatabase,
  User as DbUser,
  UserContact as DbUserContact,
  dbFindOldestUserContact,
} from 'database'
import { GraphQLError } from 'graphql'
import { CONFIG } from '@/config'
import { mintGuarantorCode } from '@/data/GuarantorCode.logic'
import { writeHomeCommunityEntry } from '@/seeds/community'
import { userFactory } from '@/seeds/factory/user'
import {
  confirmEmail,
  confirmEmailChange,
  createContribution,
  createMatchingEntry,
  createUser,
  login,
  requestEmailChange,
  resendConfirmationEmail,
} from '@/seeds/graphql/mutations'
import { listMatchingEntries } from '@/seeds/graphql/queries'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'

jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    sendAccountActivationEmail: jest.fn(),
    sendAssistedRegistrationConfirmEmail: jest.fn(),
    sendEmailChangeConfirmEmail: jest.fn(),
    sendEmailChangeNoticeEmail: jest.fn(),
    sendEmailChangeDoneEmail: jest.fn(),
    sendEmailChangeSupportEmail: jest.fn(),
    sendEmailTranslated: jest.fn(),
  }
})

jest.mock('@/apis/KlicktippController', () => {
  return {
    __esModule: true,
    subscribe: jest.fn(),
    getKlickTippUser: jest.fn(),
  }
})

CONFIG.EMAIL_CODE_VALID_TIME = 1440
CONFIG.EMAIL_CODE_REQUEST_TIME = 10

const PASSWORD = 'Aa12345_'

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let communityUuid: string
let bob: DbUser

const loginAs = (email: string, password = PASSWORD) =>
  mutate({ mutation: login, variables: { email, password } })

/**
 * An account that holds a password while its address is unconfirmed - the state this
 * resolver works on. It is opened the one way there is: at the table, where a guest who
 * scanned Bob's live card chooses a password in the registration form (createUser with a
 * guarantor code). Checked rather than trusted: a taken address would get the silent answer
 * of every registration, and no account.
 *
 * `more`: what else the registration brings -- the entry of an event link.
 */
const openAtTheTable = async (
  email: string,
  more: Record<string, unknown> = {},
): Promise<DbUser> => {
  const result = await mutate({
    mutation: createUser,
    variables: {
      email,
      firstName: 'Guest',
      lastName: 'Person',
      language: 'de',
      referrerAlias: 'MeisterBob',
      guarantorCode: mintGuarantorCode(bob.id, communityUuid).code,
      password: PASSWORD,
      ...more,
    },
  })
  expect(result.errors).toBeUndefined()
  const guest = await DbUser.findOneOrFail({
    where: { emailContact: { email } },
    relations: ['emailContact'],
  })
  expect(guest.passwordEncryptionType).toBe(PasswordEncryptionType.GRADIDO_ID)
  expect(guest.emailContact.emailChecked).toBe(false)
  expect(guest.accountState).toBe(AccountState.PARTLY_ACTIVATED_GUARANTOR)
  return guest
}

const ageUserRow = async (userId: number, hoursAgo: number) => {
  const then = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
  await db.getDataSource().query('UPDATE users SET created_at = ? WHERE id = ?', [then, userId])
}

const ageContactRow = async (id: number, hoursAgo: number) => {
  const then = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
  await db
    .getDataSource()
    .query('UPDATE user_contacts SET created_at = ?, updated_at = ? WHERE id = ?', [then, then, id])
}

beforeAll(async () => {
  const testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
  communityUuid = (await writeHomeCommunityEntry()).communityUuid as string
  bob = await userFactory(testEnv, bobBaumeister)
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

afterEach(() => {
  resetToken()
})

describe('AssistedRegistrationResolver', () => {
  describe('an account opened at the table', () => {
    beforeAll(async () => {
      await openAtTheTable('guest@example.org')
    })

    it('lets the guest sign in right away — unconfirmed, but holding a password', async () => {
      const result = await loginAs('guest@example.org')
      expect(result.errors).toBeUndefined()
      expect(result.data.login.emailChecked).toBe(false)
    })
  })

  describe('the login gate for classic registrations stays', () => {
    it('still refuses an unconfirmed account without a password', async () => {
      await mutate({
        mutation: createUser,
        variables: {
          email: 'classic@example.org',
          firstName: 'Classic',
          lastName: 'Registrant',
          language: 'de',
        },
      })
      const result = await loginAs('classic@example.org')
      expect(result.errors).toEqual([new GraphQLError('The Users email is not validate yet')])
    })
  })

  describe('confirmEmail', () => {
    it('refuses the code of a classic (password-less) registration', async () => {
      const contact = await DbUserContact.findOneOrFail({
        where: { email: 'classic@example.org' },
      })
      const result = await mutate({
        mutation: confirmEmail,
        variables: { code: contact.emailVerificationCode.toString() },
      })
      expect(result.errors).toEqual([new GraphQLError('Could not confirm with this code')])
    })

    it('confirms the guest address — and the second click stays friendly', async () => {
      const contact = await DbUserContact.findOneOrFail({
        where: { email: 'guest@example.org' },
      })
      const first = await mutate({
        mutation: confirmEmail,
        variables: { code: contact.emailVerificationCode.toString() },
      })
      expect(first.errors).toBeUndefined()
      expect(first.data.confirmEmail).toBe(true)

      const reloaded = await DbUserContact.findOneOrFail({ where: { id: contact.id } })
      expect(reloaded.emailChecked).toBe(true)
      await expect(DbUser.findOneOrFail({ where: { id: contact.userId } })).resolves.toMatchObject({
        accountState: AccountState.ACTIVATED,
      })

      const second = await mutate({
        mutation: confirmEmail,
        variables: { code: contact.emailVerificationCode.toString() },
      })
      expect(second.data.confirmEmail).toBe(true)
    })
  })

  describe('the blockade after the grace period', () => {
    const guest2Email = 'guest2@example.org'

    beforeAll(async () => {
      const guest2 = await openAtTheTable(guest2Email)
      // past the grace period: account and contact row both aged
      await ageUserRow(guest2.id, 25)
      await ageContactRow(guest2.emailContact.id, 25)
    })

    it('still lets the guest sign in', async () => {
      const result = await loginAs(guest2Email)
      expect(result.errors).toBeUndefined()
    })

    it('refuses creating value once overdue', async () => {
      await loginAs(guest2Email)
      const result = await mutate({
        mutation: createContribution,
        variables: {
          amount: '100',
          memo: 'a contribution from behind the blockade',
          contributionDate: new Date().toISOString(),
        },
      })
      expect(result.errors).toEqual([new GraphQLError('401 Unauthorized')])
    })

    it('keeps the way out open: the confirmation mail can be resent', async () => {
      await loginAs(guest2Email)
      const result = await mutate({ mutation: resendConfirmationEmail })
      expect(result.errors).toBeUndefined()
      expect(result.data.resendConfirmationEmail).toBe(true)
    })

    it('lifts the blockade the moment the address is confirmed', async () => {
      const contact = await DbUserContact.findOneOrFail({ where: { email: guest2Email } })
      const confirmed = await mutate({
        mutation: confirmEmail,
        variables: { code: contact.emailVerificationCode.toString() },
      })
      expect(confirmed.data.confirmEmail).toBe(true)

      await loginAs(guest2Email)
      const result = await mutate({
        mutation: createContribution,
        variables: {
          amount: '100',
          memo: 'a contribution after confirming the address',
          contributionDate: new Date().toISOString(),
        },
      })
      expect(result.errors).toBeUndefined()
    })
  })

  describe('the veto rule and the typo row (EM-013 in the e-mail change)', () => {
    const typoEmail = 'guest3-typo@example.org'
    const realEmail = 'guest3-real@example.org'

    beforeAll(async () => {
      await openAtTheTable(typoEmail)
    })

    it('sends NO veto to a never-confirmed address when the guest corrects a typo', async () => {
      await loginAs(typoEmail)
      const result = await mutate({
        mutation: requestEmailChange,
        variables: { email: realEmail, password: PASSWORD },
      })
      expect(result.errors).toBeUndefined()
      expect(sendEmailChangeConfirmEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: realEmail }),
      )
      expect(sendEmailChangeNoticeEmail).not.toHaveBeenCalled()
    })

    it('hard-deletes the never-confirmed row on completion: the real address becomes the oldest', async () => {
      const pending = await DbUserContact.findOneOrFail({ where: { email: realEmail } })
      const result = await mutate({
        mutation: confirmEmailChange,
        variables: { code: pending.emailVerificationCode.toString() },
      })
      expect(result.errors).toBeUndefined()

      // the typo row is gone — hard, not soft
      const typoRow = await DbUserContact.findOne({
        where: { email: typoEmail },
        withDeleted: true,
      })
      expect(typoRow).toBeNull()

      // the real address is now the oldest living row = the GDT anchor
      const guest3 = await DbUser.findOneOrFail({
        where: { emailContact: { email: realEmail } },
      })
      const oldest = await dbFindOldestUserContact(guest3.id)
      expect(oldest?.email).toBe(realEmail)
      // confirming the corrected address is what activates the account
      expect(guest3.accountState).toBe(AccountState.ACTIVATED)

      // ... and the support mail must not ask to merge a typo that never reached the
      // GDT server: the typo-correction flag switches its todo text.
      expect(sendEmailChangeSupportEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          oldEmail: typoEmail,
          newEmail: realEmail,
          gdtEmail: realEmail,
          takeBack: false,
          typoCorrection: true,
        }),
      )
    })
  })

  /**
   * Event-Matching. A guest at the table may have come through an event link as well: the
   * registration then brings the entry the link offered. Such an account signs in at once --
   * and the entry waits all the same, until the address is confirmed, by whichever of the two
   * doors this account takes.
   */
  describe('the entry of an event link', () => {
    const eventMatchingEntry = {
      summary: 'Kongress Frequency Healing',
      details: 'Selbstheilung, Biohacking',
      remote: true,
    }
    const madeEntry = {
      matching_type: 'interest',
      summary: 'Kongress Frequency Healing',
      details: 'Selbstheilung, Biohacking',
      remote: 1,
      active: 1,
    }
    const notesOf = (userId: number): Promise<unknown[]> =>
      db
        .getDataSource()
        .query('SELECT summary, details, remote FROM event_matching_entries WHERE user_id = ?', [
          userId,
        ])
    const entriesOf = (userId: number): Promise<unknown[]> =>
      db
        .getDataSource()
        .query(
          'SELECT matching_type, summary, details, remote, active FROM matching_entries WHERE user_id = ?',
          [userId],
        )

    describe('at an account that confirms its address by the mail', () => {
      const email = 'event-guest@example.org'
      let guest: DbUser

      beforeAll(async () => {
        guest = await openAtTheTable(email, { eventMatchingEntry })
      })

      it('waits while the address is unconfirmed: the guest signs in and has no entry', async () => {
        expect(await notesOf(guest.id)).toEqual([
          {
            summary: 'Kongress Frequency Healing',
            details: 'Selbstheilung, Biohacking',
            remote: 1,
          },
        ])
        expect(await entriesOf(guest.id)).toEqual([])

        await loginAs(email)
        const listed = await query({ query: listMatchingEntries })
        expect(listed.errors).toBeUndefined()
        expect(listed.data.listMatchingEntries).toEqual([])
      })

      it('is made when the address is confirmed, and the note is gone', async () => {
        const confirmed = await mutate({
          mutation: confirmEmail,
          variables: { code: guest.emailContact.emailVerificationCode.toString() },
        })
        expect(confirmed.errors).toBeUndefined()
        expect(confirmed.data.confirmEmail).toBe(true)

        expect(await entriesOf(guest.id)).toEqual([madeEntry])
        expect(await notesOf(guest.id)).toEqual([])
      })

      it('stands in the guest’s own list like an entry they saved', async () => {
        await loginAs(email)
        const listed = await query({ query: listMatchingEntries })

        expect(listed.errors).toBeUndefined()
        expect(listed.data.listMatchingEntries).toEqual([
          {
            uuid: expect.any(String),
            matchingType: 'interest',
            summary: 'Kongress Frequency Healing',
            details: 'Selbstheilung, Biohacking',
            remote: true,
            active: true,
          },
        ])
      })

      // The second click finds the address confirmed and answers at once (confirmEmail): it
      // does not come near the entry. Held here as what the member sees.
      it('the second click on the mail finds the address confirmed, and makes nothing more', async () => {
        const again = await mutate({
          mutation: confirmEmail,
          variables: { code: guest.emailContact.emailVerificationCode.toString() },
        })
        expect(again.data.confirmEmail).toBe(true)

        expect(await entriesOf(guest.id)).toHaveLength(1)
      })
    })

    /**
     * Such an account signs in at once. Before its mail is clicked it may open the link again,
     * find the form and save the entry itself -- the note then has nothing left to make: no
     * second entry with the same words.
     */
    describe('at an account that saved the entry itself before it confirmed', () => {
      const email = 'event-early@example.org'
      let guest: DbUser

      beforeAll(async () => {
        guest = await openAtTheTable(email, { eventMatchingEntry })
        await loginAs(email)
        const saved = await mutate({
          mutation: createMatchingEntry,
          variables: {
            input: {
              matchingType: 'interest',
              summary: 'kongress frequency HEALING',
              details: 'Mit eigenen Worten',
              remote: false,
            },
          },
        })
        expect(saved.errors).toBeUndefined()
        resetToken()
      })

      it('makes no second entry when the address is confirmed, and lets the note go', async () => {
        const confirmed = await mutate({
          mutation: confirmEmail,
          variables: { code: guest.emailContact.emailVerificationCode.toString() },
        })
        expect(confirmed.data.confirmEmail).toBe(true)

        expect(await entriesOf(guest.id)).toEqual([
          {
            matching_type: 'interest',
            summary: 'kongress frequency HEALING',
            details: 'Mit eigenen Worten',
            remote: 0,
            active: 1,
          },
        ])
        expect(await notesOf(guest.id)).toEqual([])
      })
    })

    // The third door: the guest mistyped the address at the table and corrects it. Confirming
    // the corrected address is what confirms this account -- and what makes its entry.
    describe('at an account that corrects its address before it confirmed one', () => {
      const typoEmail = 'event-typo@example.org'
      const realEmail = 'event-real@example.org'
      let guest: DbUser

      beforeAll(async () => {
        guest = await openAtTheTable(typoEmail, {
          eventMatchingEntry: { summary: 'Training Rücken', details: null, remote: false },
        })
        await loginAs(typoEmail)
        const requested = await mutate({
          mutation: requestEmailChange,
          variables: { email: realEmail, password: PASSWORD },
        })
        expect(requested.errors).toBeUndefined()
        resetToken()
      })

      it('waits until the corrected address is confirmed, and is made then', async () => {
        expect(await entriesOf(guest.id)).toEqual([])

        const pending = await DbUserContact.findOneOrFail({ where: { email: realEmail } })
        const result = await mutate({
          mutation: confirmEmailChange,
          variables: { code: pending.emailVerificationCode.toString() },
        })
        expect(result.errors).toBeUndefined()

        // Only where the member lives, and without details: as the link said.
        expect(await entriesOf(guest.id)).toEqual([
          {
            matching_type: 'interest',
            summary: 'Training Rücken',
            details: null,
            remote: 0,
            active: 1,
          },
        ])
        expect(await notesOf(guest.id)).toEqual([])
      })
    })

    // Every account without an event link -- nearly all of them: the confirmation is the one
    // it was, and no entry appears.
    it('makes nothing for an account that came without one', async () => {
      const plain = await openAtTheTable('no-event@example.org')
      const confirmed = await mutate({
        mutation: confirmEmail,
        variables: { code: plain.emailContact.emailVerificationCode.toString() },
      })
      expect(confirmed.data.confirmEmail).toBe(true)

      expect(await notesOf(plain.id)).toEqual([])
      expect(await entriesOf(plain.id)).toEqual([])
    })
  })
})
