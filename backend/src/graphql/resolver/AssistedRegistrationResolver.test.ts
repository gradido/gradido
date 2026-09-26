// AI-GENERATED — not an architecture reference
import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import {
  sendEmailChangeConfirmEmail,
  sendEmailChangeNoticeEmail,
  sendEmailChangeSupportEmail,
} from 'core'
import {
  AppDatabase,
  User as DbUser,
  UserContact as DbUserContact,
  dbFindOldestUserContact,
} from 'database'
import { GraphQLError } from 'graphql'
import { CONFIG } from '@/config'
import { mintPresenceCode } from '@/data/PresenceCode.logic'
import { writeHomeCommunityEntry } from '@/seeds/community'
import { userFactory } from '@/seeds/factory/user'
import {
  confirmEmail,
  confirmEmailChange,
  createContribution,
  createUser,
  login,
  requestEmailChange,
  resendConfirmationEmail,
} from '@/seeds/graphql/mutations'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'

jest.mock('@/password/EncryptorUtils')

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
let db: AppDatabase
let communityUuid: string

const loginAs = (email: string, password = PASSWORD) =>
  mutate({ mutation: login, variables: { email, password } })

/**
 * An account that holds a password while its address is unconfirmed - the state this
 * resolver works on. It is opened the one way there is: at the table, where a guest who
 * scanned Bob's live card chooses a password in the registration form (createUser with a
 * presence code). Checked rather than trusted: a taken address would get the silent answer
 * of every registration, and no account.
 */
const openAtTheTable = async (email: string): Promise<DbUser> => {
  const result = await mutate({
    mutation: createUser,
    variables: {
      email,
      firstName: 'Guest',
      lastName: 'Person',
      language: 'de',
      referrerAlias: 'MeisterBob',
      presenceCode: mintPresenceCode('MeisterBob', communityUuid).code,
      password: PASSWORD,
    },
  })
  expect(result.errors).toBeUndefined()
  const guest = await DbUser.findOneOrFail({
    where: { emailContact: { email } },
    relations: ['emailContact'],
  })
  expect(guest.passwordEncryptionType).toBe(PasswordEncryptionType.GRADIDO_ID)
  expect(guest.emailContact.emailChecked).toBe(false)
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
  db = testEnv.db
  await cleanDB()
  communityUuid = (await writeHomeCommunityEntry()).communityUuid as string
  await userFactory(testEnv, bobBaumeister)
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

      // ... and the support mail must not ask to merge a typo that never reached the
      // GDT server: the typo-correction flag switches its todo text.
      expect(sendEmailChangeSupportEmail).toBeCalledWith(
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
})
