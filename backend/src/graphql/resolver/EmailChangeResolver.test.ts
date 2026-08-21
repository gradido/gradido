// AI-GENERATED — not an architecture reference
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { CONFIG as CORE_CONFIG } from 'core'
import { AppDatabase, User as DbUser, UserContact as DbUserContact } from 'database'
import { GraphQLError } from 'graphql'
import { CONFIG } from '@/config'
import { userFactory } from '@/seeds/factory/user'
import {
  adminReplaceUnconfirmedEmail,
  cancelEmailChange,
  confirmEmailChange,
  createUser,
  login,
  requestEmailChange,
  resendEmailChange,
  revokeEmailChange,
  setPassword,
} from '@/seeds/graphql/mutations'
import { adminEmailStatus, pendingEmailChange, queryOptIn } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'

// The mock derives the key the same way (salt by encryption type, gradido id for the
// current type), just without the real argon2 cost - so the address change is still
// exercised against the salt rule it has to survive.
jest.mock('@/password/EncryptorUtils')

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  db: AppDatabase
}

CONFIG.EMAIL_CODE_VALID_TIME = 1440
CONFIG.EMAIL_CODE_REQUEST_TIME = 10
CORE_CONFIG.EMAIL = false

const PASSWORD = 'Aa12345_'
const CODE_INVALID = new GraphQLError('Invalid or expired code')

const loginAs = (email: string) =>
  mutate({ mutation: login, variables: { email, password: PASSWORD } })

const pendingRow = (userId: number) =>
  DbUserContact.findOne({ where: { userId, emailChecked: false } })

/**
 * The rate limit reads the request event, not the clock - so instead of faking timers
 * (which would also age the login token) the events are aged by hand.
 */
const ageRequestEvents = async (userId: number, minutesAgo: number) => {
  await db
    .getDataSource()
    .query('UPDATE events SET created_at = ? WHERE type = ? AND affected_user_id = ?', [
      new Date(Date.now() - minutesAgo * 60 * 1000),
      'EMAIL_CHANGE_REQUEST',
      userId,
    ])
}

const ageContactRow = async (id: number, hoursAgo: number) => {
  const then = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
  await db
    .getDataSource()
    .query('UPDATE user_contacts SET created_at = ?, updated_at = ? WHERE id = ?', [then, then, id])
}

beforeAll(async () => {
  testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

describe('EmailChangeResolver', () => {
  let bibi: DbUser

  beforeAll(async () => {
    bibi = await userFactory(testEnv, bibiBloxberg)
    await userFactory(testEnv, peterLustig)
  })

  describe('unauthenticated', () => {
    it('refuses to start a change', async () => {
      await expect(
        mutate({
          mutation: requestEmailChange,
          variables: { email: 'bibi-new@bloxberg.de', password: PASSWORD },
        }),
      ).resolves.toMatchObject({
        data: null,
        errors: [new GraphQLError('401 Unauthorized')],
      })
    })
  })

  describe('as bibi', () => {
    beforeAll(async () => {
      await loginAs('bibi@bloxberg.de')
    })

    afterAll(() => {
      resetToken()
    })

    it('refuses without the right password - and writes nothing', async () => {
      await expect(
        mutate({
          mutation: requestEmailChange,
          variables: { email: 'bibi-new@bloxberg.de', password: 'Wrong123_' },
        }),
      ).resolves.toMatchObject({
        data: null,
        errors: [new GraphQLError('Password is invalid')],
      })
      expect(await pendingRow(bibi.id)).toBeNull()
    })

    it('refuses an address somebody else holds', async () => {
      await expect(
        mutate({
          mutation: requestEmailChange,
          variables: { email: 'peter@lustig.de', password: PASSWORD },
        }),
      ).resolves.toMatchObject({
        data: null,
        errors: [new GraphQLError('Email address already in use')],
      })
    })

    it('refuses the address the account already has', async () => {
      await expect(
        mutate({
          mutation: requestEmailChange,
          variables: { email: 'Bibi@Bloxberg.de', password: PASSWORD },
        }),
      ).resolves.toMatchObject({
        data: null,
        errors: [new GraphQLError('This is already the email address of this account')],
      })
    })

    it('has nothing pending before the first request', async () => {
      await expect(query({ query: pendingEmailChange })).resolves.toMatchObject({
        data: { pendingEmailChange: null },
        errors: undefined,
      })
    })

    describe('a change under way', () => {
      let code: string
      let vetoCode: string

      beforeAll(async () => {
        const {
          data: { requestEmailChange: pending },
        } = await mutate({
          mutation: requestEmailChange,
          variables: { email: ' Bibi-New@Bloxberg.de ', password: PASSWORD },
        })
        expect(pending.email).toBe('bibi-new@bloxberg.de')
        const row = await pendingRow(bibi.id)
        code = row!.emailVerificationCode.toString()
        vetoCode = row!.changeVetoCode!.toString()
      })

      it('carries two different codes', () => {
        expect(code).not.toBe(vetoCode)
      })

      it('is reported as pending', async () => {
        await expect(query({ query: pendingEmailChange })).resolves.toMatchObject({
          data: { pendingEmailChange: { email: 'bibi-new@bloxberg.de' } },
          errors: undefined,
        })
      })

      it('refuses a second request inside the resend window', async () => {
        await expect(
          mutate({
            mutation: requestEmailChange,
            variables: { email: 'bibi-other@bloxberg.de', password: PASSWORD },
          }),
        ).resolves.toMatchObject({
          data: null,
          errors: [new GraphQLError('Email already sent less than 10 minutes ago')],
        })
        // The request that was refused must not have touched the pending one.
        expect((await pendingRow(bibi.id))?.email).toBe('bibi-new@bloxberg.de')
      })

      it('refuses to resend inside the window as well', async () => {
        await expect(mutate({ mutation: resendEmailChange })).resolves.toMatchObject({
          data: null,
          errors: [new GraphQLError('Email already sent less than 10 minutes ago')],
        })
      })

      it('does not let the change code log anybody in or answer the opt-in query', async () => {
        await expect(
          mutate({ mutation: setPassword, variables: { code, password: 'Bb12345_' } }),
        ).resolves.toMatchObject({ data: null })
        await expect(
          query({ query: queryOptIn, variables: { optIn: code } }),
        ).resolves.toMatchObject({
          data: null,
        })
      })

      it('never lets one code do the job of the other', async () => {
        await expect(
          mutate({ mutation: confirmEmailChange, variables: { code: vetoCode } }),
        ).resolves.toMatchObject({ data: null, errors: [CODE_INVALID] })
        await expect(
          mutate({ mutation: revokeEmailChange, variables: { vetoCode: code } }),
        ).resolves.toMatchObject({ data: null, errors: [CODE_INVALID] })
      })

      it('issues fresh codes on resend once the window has passed', async () => {
        await ageRequestEvents(bibi.id, 11)
        await expect(mutate({ mutation: resendEmailChange })).resolves.toMatchObject({
          data: { resendEmailChange: { email: 'bibi-new@bloxberg.de' } },
          errors: undefined,
        })
        const row = await pendingRow(bibi.id)
        expect(row!.emailVerificationCode.toString()).not.toBe(code)
        expect(row!.changeVetoCode!.toString()).not.toBe(vetoCode)
        code = row!.emailVerificationCode.toString()
        vetoCode = row!.changeVetoCode!.toString()
      })

      it('moves the account to the new address on confirmation and keeps the old row', async () => {
        await expect(
          mutate({ mutation: confirmEmailChange, variables: { code } }),
        ).resolves.toMatchObject({
          data: { confirmEmailChange: 'bibi-new@bloxberg.de' },
          errors: undefined,
        })
        const user = await DbUser.findOneOrFail({
          where: { id: bibi.id },
          relations: ['emailContact'],
        })
        expect(user.emailContact.email).toBe('bibi-new@bloxberg.de')
        expect(user.emailContact.emailChecked).toBe(true)
        expect(user.emailContact.changeVetoCode).toBeNull()
        // The old row stays - it is the address the GDT server knows bibi by.
        expect(await DbUserContact.count({ where: { userId: bibi.id } })).toBe(2)
        const oldest = await DbUserContact.findOne({
          where: { userId: bibi.id },
          order: { createdAt: 'ASC' },
        })
        expect(oldest!.email).toBe('bibi@bloxberg.de')
      })

      it('does not accept the used code a second time', async () => {
        await expect(
          mutate({ mutation: confirmEmailChange, variables: { code } }),
        ).resolves.toMatchObject({ data: null, errors: [CODE_INVALID] })
      })

      it('lets the member in with the new address and no longer with the old one', async () => {
        resetToken()
        await expect(loginAs('bibi-new@bloxberg.de')).resolves.toMatchObject({ errors: undefined })
        resetToken()
        await expect(loginAs('bibi@bloxberg.de')).resolves.toMatchObject({ data: null })
      })
    })
  })

  describe('the veto from the old address', () => {
    let vetoCode: string

    beforeAll(async () => {
      await ageRequestEvents(bibi.id, 11)
      await loginAs('bibi-new@bloxberg.de')
      await mutate({
        mutation: requestEmailChange,
        variables: { email: 'bibi-third@bloxberg.de', password: PASSWORD },
      })
      vetoCode = (await pendingRow(bibi.id))!.changeVetoCode!.toString()
    })

    afterAll(() => {
      resetToken()
    })

    it('drops the pending change and frees the address', async () => {
      await expect(
        mutate({ mutation: revokeEmailChange, variables: { vetoCode } }),
      ).resolves.toMatchObject({ data: { revokeEmailChange: true }, errors: undefined })
      expect(await pendingRow(bibi.id)).toBeNull()
      expect(
        await DbUserContact.findOne({
          where: { email: 'bibi-third@bloxberg.de' },
          withDeleted: true,
        }),
      ).toBeNull()
    })

    it('is spent with that', async () => {
      await expect(
        mutate({ mutation: revokeEmailChange, variables: { vetoCode } }),
      ).resolves.toMatchObject({ data: null, errors: [CODE_INVALID] })
    })
  })

  describe('cancelling and replacing', () => {
    beforeAll(async () => {
      await loginAs('bibi-new@bloxberg.de')
    })

    afterAll(() => {
      resetToken()
    })

    it('cancel drops the pending change', async () => {
      await ageRequestEvents(bibi.id, 11)
      await mutate({
        mutation: requestEmailChange,
        variables: { email: 'bibi-fourth@bloxberg.de', password: PASSWORD },
      })
      expect(await pendingRow(bibi.id)).not.toBeNull()
      await expect(mutate({ mutation: cancelEmailChange })).resolves.toMatchObject({
        data: { cancelEmailChange: true },
      })
      expect(await pendingRow(bibi.id)).toBeNull()
    })

    it('a new request replaces the pending one and frees its address', async () => {
      await ageRequestEvents(bibi.id, 11)
      await mutate({
        mutation: requestEmailChange,
        variables: { email: 'bibi-fifth@bloxberg.de', password: PASSWORD },
      })
      await ageRequestEvents(bibi.id, 11)
      await mutate({
        mutation: requestEmailChange,
        variables: { email: 'bibi-sixth@bloxberg.de', password: PASSWORD },
      })
      expect((await pendingRow(bibi.id))?.email).toBe('bibi-sixth@bloxberg.de')
      expect(
        await DbUserContact.findOne({
          where: { email: 'bibi-fifth@bloxberg.de' },
          withDeleted: true,
        }),
      ).toBeNull()
    })

    it('an expired change is refused and its row removed', async () => {
      const row = await pendingRow(bibi.id)
      await ageContactRow(row!.id, 25)
      await expect(
        mutate({
          mutation: confirmEmailChange,
          variables: { code: row!.emailVerificationCode.toString() },
        }),
      ).resolves.toMatchObject({ data: null, errors: [CODE_INVALID] })
      expect(await pendingRow(bibi.id)).toBeNull()
      await expect(query({ query: pendingEmailChange })).resolves.toMatchObject({
        data: { pendingEmailChange: null },
      })
    })
  })

  describe('the admin side: status, and correcting a never-confirmed address', () => {
    let unconfirmed: DbUser

    beforeAll(async () => {
      resetToken()
      const {
        data: { createUser: created },
      } = await mutate({
        mutation: createUser,
        variables: {
          email: 'raeuber@hotzenplotz.de',
          firstName: 'Räuber',
          lastName: 'Hotzenplotz',
          language: 'de',
        },
      })
      unconfirmed = await DbUser.findOneOrFail({
        where: { id: created.id },
        relations: ['emailContact'],
      })
      // Peter is the admin of the seeds.
      await loginAs('peter@lustig.de')
    })

    afterAll(() => {
      resetToken()
    })

    it('names the address the GDT server is asked with - the first one, after a change', async () => {
      await expect(
        query({ query: adminEmailStatus, variables: { userId: bibi.id } }),
      ).resolves.toMatchObject({
        data: {
          adminEmailStatus: {
            gdtEmail: 'bibi@bloxberg.de',
            currentConfirmed: true,
            elopageBuysOnCurrent: false,
            pendingEmail: null,
          },
        },
        errors: undefined,
      })
    })

    it('corrects a never-confirmed address in place - one row, the old address gone', async () => {
      await expect(
        mutate({
          mutation: adminReplaceUnconfirmedEmail,
          variables: { userId: unconfirmed.id, email: ' Raeuber@Hotzenplotz.org ' },
        }),
      ).resolves.toMatchObject({
        data: { adminReplaceUnconfirmedEmail: 'raeuber@hotzenplotz.org' },
        errors: undefined,
      })
      const rows = await DbUserContact.find({ where: { userId: unconfirmed.id } })
      expect(rows.map((row) => row.email)).toEqual(['raeuber@hotzenplotz.org'])
      expect(
        await DbUserContact.findOne({
          where: { email: 'raeuber@hotzenplotz.de' },
          withDeleted: true,
        }),
      ).toBeNull()
    })

    it("refuses to touch a confirmed address - that is the member's own to change", async () => {
      await expect(
        mutate({
          mutation: adminReplaceUnconfirmedEmail,
          variables: { userId: bibi.id, email: 'somebody@else.org' },
        }),
      ).resolves.toMatchObject({
        data: null,
        errors: [new GraphQLError('The address is confirmed - only the member can change it')],
      })
    })

    it('is no right of a member', async () => {
      resetToken()
      await loginAs('bibi-new@bloxberg.de')
      await expect(
        mutate({
          mutation: adminReplaceUnconfirmedEmail,
          variables: { userId: unconfirmed.id, email: 'taken@over.org' },
        }),
      ).resolves.toMatchObject({
        data: null,
        errors: [new GraphQLError('401 Unauthorized')],
      })
    })
  })
})
