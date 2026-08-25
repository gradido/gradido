// AI-GENERATED — not an architecture reference
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import {
  sendAccountMultiRegistrationEmail,
  sendAssistedRegistrationConfirmEmail,
  sendEmailChangeConfirmEmail,
  sendEmailChangeNoticeEmail,
} from 'core'
import {
  AppDatabase,
  assistedRegistrationsTable,
  User as DbUser,
  UserContact as DbUserContact,
  dbFindOldestUserContact,
} from 'database'
import { GraphQLError } from 'graphql'
import { OptInType } from 'shared'
import { CONFIG } from '@/config'
import { EventType } from '@/event/EventType'
import { userFactory } from '@/seeds/factory/user'
import {
  completeAssistedRegistration,
  confirmEmail,
  confirmEmailChange,
  createContribution,
  createUser,
  login,
  requestEmailChange,
  resendConfirmationEmail,
} from '@/seeds/graphql/mutations'
import { assistedRegistrationInfo } from '@/seeds/graphql/queries'
import { peterLustig } from '@/seeds/users/peter-lustig'

jest.mock('@/password/EncryptorUtils')

jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    sendAccountActivationEmail: jest.fn(),
    sendAccountMultiRegistrationEmail: jest.fn(),
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
const NEUTRAL = 'Assist code invalid or expired'

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase

const loginAs = (email: string, password = PASSWORD) =>
  mutate({ mutation: login, variables: { email, password } })

const parkedRows = () =>
  AppDatabase.getInstance().getDrizzleDataSource().select().from(assistedRegistrationsTable)

/** The doorbell: registering with an existing member's address parks the attempt. */
const ringDoorbell = (redeemCode: string | null = 'CL-cafe') =>
  mutate({
    mutation: createUser,
    variables: {
      email: 'peter@lustig.de',
      firstName: 'Guest',
      lastName: 'Person',
      language: 'de',
      redeemCode,
    },
  })

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
  await AppDatabase.getInstance().getDrizzleDataSource().delete(assistedRegistrationsTable)
  await userFactory(testEnv, peterLustig)
})

afterAll(async () => {
  await cleanDB()
  await AppDatabase.getInstance().getDrizzleDataSource().delete(assistedRegistrationsTable)
  await db.destroy()
})

afterEach(() => {
  resetToken()
})

describe('AssistedRegistrationResolver', () => {
  describe('the doorbell: createUser with an existing address', () => {
    it('parks the attempt and offers the helper branch when a redeem code is present', async () => {
      const before = (await parkedRows()).length
      const result = await ringDoorbell('CL-cafe')
      // The answer to the form is the fake success — byte-identical to the case
      // without a redeem code (silence rule).
      expect(result.data.createUser.id).toEqual(expect.any(Number))
      const rows = await parkedRows()
      expect(rows.length).toBe(before + 1)
      const row = rows[rows.length - 1]
      expect(row.firstName).toBe('Guest')
      expect(row.redeemCode).toBe('CL-cafe')
      expect(sendAccountMultiRegistrationEmail).toBeCalledWith(
        expect.objectContaining({
          email: 'peter@lustig.de',
          helperLink: expect.stringContaining('/register-assist/'),
        }),
      )
    })

    it('parks nothing without a redeem code — the mail stays as it always was', async () => {
      const before = (await parkedRows()).length
      await ringDoorbell(null)
      expect((await parkedRows()).length).toBe(before)
      expect(sendAccountMultiRegistrationEmail).toBeCalledWith(
        expect.objectContaining({ helperLink: null }),
      )
    })
  })

  describe('assistedRegistrationInfo', () => {
    it('answers with the guest name for a valid code', async () => {
      const rows = await parkedRows()
      const code = rows[rows.length - 1].assistCode.toString()
      const result = await query({
        query: assistedRegistrationInfo,
        variables: { assistCode: code },
      })
      expect(result.data.assistedRegistrationInfo).toEqual({
        firstName: 'Guest',
        lastName: 'Person',
      })
    })

    it('gives one neutral answer for an unknown and for a malformed code alike', async () => {
      const unknown = await query({
        query: assistedRegistrationInfo,
        variables: { assistCode: '12345' },
      })
      expect(unknown.errors).toEqual([new GraphQLError(NEUTRAL)])
      const malformed = await query({
        query: assistedRegistrationInfo,
        variables: { assistCode: 'not-a-code' },
      })
      expect(malformed.errors).toEqual([new GraphQLError(NEUTRAL)])
    })

    it('gives the same neutral answer for an expired code', async () => {
      const rows = await parkedRows()
      const row = rows[rows.length - 1]
      const then = new Date(Date.now() - 25 * 60 * 60 * 1000)
      await db
        .getDataSource()
        .query('UPDATE assisted_registrations SET created_at = ? WHERE id = ?', [then, row.id])
      const result = await query({
        query: assistedRegistrationInfo,
        variables: { assistCode: row.assistCode.toString() },
      })
      expect(result.errors).toEqual([new GraphQLError(NEUTRAL)])
      // fresh again for the tests below
      await db
        .getDataSource()
        .query('UPDATE assisted_registrations SET created_at = ? WHERE id = ?', [
          new Date(),
          row.id,
        ])
    })
  })

  describe('completeAssistedRegistration', () => {
    let assistCode: string

    beforeAll(async () => {
      const rows = await parkedRows()
      assistCode = rows[rows.length - 1].assistCode.toString()
    })

    it('refuses a weak password', async () => {
      const result = await mutate({
        mutation: completeAssistedRegistration,
        variables: { assistCode, email: 'guest@example.org', password: 'weak' },
      })
      expect(result.errors?.[0]?.message).toContain('valid password')
    })

    it('says openly when the address already has an account', async () => {
      const result = await mutate({
        mutation: completeAssistedRegistration,
        variables: { assistCode, email: 'peter@lustig.de', password: PASSWORD },
      })
      expect(result.errors).toEqual([new GraphQLError('Email address already in use')])
    })

    it('creates the account with the guest address, unconfirmed, password set — and hands back the redeem code', async () => {
      const result = await mutate({
        mutation: completeAssistedRegistration,
        variables: { assistCode, email: 'guest@example.org', password: PASSWORD },
      })
      expect(result.errors).toBeUndefined()
      expect(result.data.completeAssistedRegistration.redeemCode).toBe('CL-cafe')

      const guest = await DbUser.findOneOrFail({
        where: { emailContact: { email: 'guest@example.org' } },
        relations: ['emailContact'],
      })
      expect(guest.emailContact.emailChecked).toBe(false)
      expect(guest.emailContact.emailOptInTypeId).toBe(OptInType.EMAIL_OPT_IN_REGISTER)
      expect(guest.password).not.toBe(BigInt(0))
      // the confirm-only mail went to the guest's own address
      expect(sendAssistedRegistrationConfirmEmail).toBeCalledWith(
        expect.objectContaining({
          email: 'guest@example.org',
          confirmLink: expect.stringContaining('/confirm-email/'),
        }),
      )
    })

    it('records who helped whom', async () => {
      const guest = await DbUser.findOneOrFail({
        where: { emailContact: { email: 'guest@example.org' } },
      })
      const host = await DbUser.findOneOrFail({
        where: { emailContact: { email: 'peter@lustig.de' } },
      })
      const events = await db
        .getDataSource()
        .query('SELECT affected_user_id, acting_user_id FROM events WHERE type = ?', [
          EventType.USER_REGISTER_ASSISTED,
        ])
      // bigint columns arrive as strings from a raw query — compare as numbers
      const pairs = events.map((e: { affected_user_id: unknown; acting_user_id: unknown }) => ({
        affected: Number(e.affected_user_id),
        acting: Number(e.acting_user_id),
      }))
      expect(pairs).toContainEqual({ affected: guest.id, acting: host.id })
    })

    it('deletes the parked attempt: its code stops answering', async () => {
      const result = await query({ query: assistedRegistrationInfo, variables: { assistCode } })
      expect(result.errors).toEqual([new GraphQLError(NEUTRAL)])
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
      await ringDoorbell('CL-cafe2')
      const rows = await parkedRows()
      const assistCode = rows[rows.length - 1].assistCode.toString()
      const created = await mutate({
        mutation: completeAssistedRegistration,
        variables: { assistCode, email: guest2Email, password: PASSWORD },
      })
      expect(created.errors).toBeUndefined()
      const guest2 = await DbUser.findOneOrFail({
        where: { emailContact: { email: guest2Email } },
        relations: ['emailContact'],
      })
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
      await ringDoorbell('CL-cafe3')
      const rows = await parkedRows()
      const assistCode = rows[rows.length - 1].assistCode.toString()
      const created = await mutate({
        mutation: completeAssistedRegistration,
        variables: { assistCode, email: typoEmail, password: PASSWORD },
      })
      expect(created.errors).toBeUndefined()
    })

    it('sends NO veto to a never-confirmed address when the guest corrects a typo', async () => {
      await loginAs(typoEmail)
      const result = await mutate({
        mutation: requestEmailChange,
        variables: { email: realEmail, password: PASSWORD },
      })
      expect(result.errors).toBeUndefined()
      expect(sendEmailChangeConfirmEmail).toBeCalledWith(
        expect.objectContaining({ email: realEmail }),
      )
      expect(sendEmailChangeNoticeEmail).not.toBeCalled()
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
    })
  })
})
