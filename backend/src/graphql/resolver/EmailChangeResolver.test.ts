// AI-GENERATED — not an architecture reference
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { CONFIG as CORE_CONFIG, sendEmailChangeNoticeEmail } from 'core'
import { AppDatabase, User as DbUser, UserContact as DbUserContact } from 'database'
import { GraphQLError } from 'graphql'
import { OptInType } from 'shared'
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
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { Context } from '@/server/context'
import { EmailChangeResolver } from './EmailChangeResolver'

// The mock derives the key the same way (salt by encryption type, gradido id for the
// current type), just without the real argon2 cost - so the address change is still
// exercised against the salt rule it has to survive.
jest.mock('@/password/EncryptorUtils')

// The mails become spies so a test can name their recipient - which mailbox the veto
// notice goes to IS the finding the race tests below guard. Everything else of `core`
// (its CONFIG above all) stays real.
jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    sendAccountActivationEmail: jest.fn(),
    sendEmailChangeConfirmEmail: jest.fn(),
    sendEmailChangeDoneEmail: jest.fn(),
    sendEmailChangeNoticeEmail: jest.fn(),
    sendEmailChangeSupportEmail: jest.fn(),
  }
})

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

// The same question the application asks: a change in flight is the row of the change
// type - which, since a change back borrows a confirmed row, is no longer the same as
// "unconfirmed".
const pendingRow = (userId: number) =>
  DbUserContact.findOne({ where: { userId, emailOptInTypeId: OptInType.EMAIL_OPT_IN_CHANGE } })

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

/**
 * Only `updated_at`: it alone drives expiry (`issuedAt` and the purge both read it
 * first, and the column is filled on insert). Aging `created_at` too would falsify the
 * history order of a CONFIRMED take-back row for the rest of the suite - and the oldest
 * row is the GDT anchor.
 */
const ageContactRow = async (id: number, hoursAgo: number) => {
  const then = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
  await db.getDataSource().query('UPDATE user_contacts SET updated_at = ? WHERE id = ?', [then, id])
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
        ).resolves.toMatchObject({
          data: null,
          errors: [new GraphQLError('Could not login with emailVerificationCode')],
        })
        // The answer an unknown code gets, byte for byte - so nothing is given away.
        await expect(
          query({ query: queryOptIn, variables: { optIn: code } }),
        ).resolves.toMatchObject({
          data: null,
          errors: [
            expect.objectContaining({
              message: expect.stringContaining('Could not find any entity of type "UserContact"'),
            }),
          ],
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

      it('resends the codes it already has, without buying another window', async () => {
        await ageRequestEvents(bibi.id, 11)
        const before = await pendingRow(bibi.id)
        const deadlineBefore = (before!.updatedAt ?? before!.createdAt).getTime()
        await expect(mutate({ mutation: resendEmailChange })).resolves.toMatchObject({
          data: { resendEmailChange: { email: 'bibi-new@bloxberg.de' } },
          errors: undefined,
        })
        const row = await pendingRow(bibi.id)
        // The mailed links keep working - the codes are the ones that already went out.
        expect(row!.emailVerificationCode.toString()).toBe(code)
        expect(row!.changeVetoCode!.toString()).toBe(vetoCode)
        // And this is the point of the test: the clock the whole change is measured by has
        // not moved. Every write to the row moves it (`updatedAt` is an @UpdateDateColumn
        // with `onUpdate`), and a change that could be renewed on every resend would hold a
        // stranger's address for good.
        expect((row!.updatedAt ?? row!.createdAt).getTime()).toBe(deadlineBefore)
      })

      it('asks again for the same address without buying another window', async () => {
        // The other door into the same hold. `resendEmailChange` stopped selling a new
        // window on 26.08.2026; asking again through `requestEmailChange` bought one anyway,
        // once every ten minutes, for as long as somebody kept asking.
        await ageRequestEvents(bibi.id, 11)
        const before = await pendingRow(bibi.id)
        const deadlineBefore = (before!.updatedAt ?? before!.createdAt).getTime()
        await expect(
          mutate({
            mutation: requestEmailChange,
            variables: { email: 'bibi-new@bloxberg.de', password: PASSWORD },
          }),
        ).resolves.toMatchObject({
          data: { requestEmailChange: { email: 'bibi-new@bloxberg.de' } },
          errors: undefined,
        })
        const row = await pendingRow(bibi.id)
        // Same row, same codes: the mail carries the link that already went out.
        expect(row!.id).toBe(before!.id)
        expect(row!.emailVerificationCode.toString()).toBe(code)
        expect(row!.changeVetoCode!.toString()).toBe(vetoCode)
        expect((row!.updatedAt ?? row!.createdAt).getTime()).toBe(deadlineBefore)
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

      it('refuses a password link that points at the address bibi left behind', async () => {
        // The order that makes this real: bibi asks for a new password, so a reset code is
        // written onto the row that is current at that moment - and then confirms the change
        // that was already under way. `users.email_id` moves on, and that row becomes
        // history while the code mailed to bibi still sits on it.
        const leftBehind = await DbUserContact.findOneOrFail({
          where: { userId: bibi.id, email: 'bibi@bloxberg.de' },
        })
        const strandedCode = '112233445566778899'
        await DbUserContact.update(
          { id: leftBehind.id },
          {
            emailVerificationCode: strandedCode,
            emailOptInTypeId: OptInType.EMAIL_OPT_IN_RESET_PASSWORD,
          },
        )
        // `UserContact.user` IS `users.email_id` seen from the other side, so this row has no
        // member on it. The link reached `userContact.user.id` and died there - before the
        // window check, so even a long-expired link answered with an internal error instead
        // of saying it had expired. It has to read like a code we never had.
        await expect(
          mutate({
            mutation: setPassword,
            variables: { code: strandedCode, password: 'Bb12345_' },
          }),
        ).resolves.toMatchObject({
          data: null,
          errors: [new GraphQLError('Could not login with emailVerificationCode')],
        })

        // ⛔ And the question BEFORE that one has to give the same answer. `queryOptIn` is
        // what the reset page asks before it shows the form; it used to say "valid" for this
        // very code, so the member got a password form whose submit button then refused. A
        // dead end at the END of the road is worse than a refusal at its start.
        //
        // Held against the answer to a code that was never issued, not against a phrase:
        // "the same answer" is the whole point, and `EntityNotFoundError` prints the
        // criteria it was built from - so loading a relation for the ownership check, or
        // building either refusal from anything but the plain code, makes the three
        // distinguishable and tells whoever asks which of them they hit.
        const strandedAnswer = await query({
          query: queryOptIn,
          variables: { optIn: strandedCode },
        })
        const neverIssued = await query({
          query: queryOptIn,
          variables: { optIn: 'a-code-nobody-ever-had' },
        })
        expect(strandedAnswer.data).toBeNull()
        expect(neverIssued.errors?.[0].message).toContain(
          'Could not find any entity of type "UserContact"',
        )
        expect(strandedAnswer.errors?.[0].message).toBe(
          neverIssued.errors?.[0].message.replace('a-code-nobody-ever-had', strandedCode),
        )
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

    it('answers expired once the change ran out - and still clears the row away', async () => {
      // The notice named this moment: "the link is valid until ... - after that the
      // change lapses of its own accord". A click past it must not report a stop it
      // did not cause.
      await ageRequestEvents(bibi.id, 11)
      await mutate({
        mutation: requestEmailChange,
        variables: { email: 'bibi-late@bloxberg.de', password: PASSWORD },
      })
      const row = await pendingRow(bibi.id)
      await ageContactRow(row!.id, 25)
      await expect(
        mutate({
          mutation: revokeEmailChange,
          variables: { vetoCode: row!.changeVetoCode!.toString() },
        }),
      ).resolves.toMatchObject({ data: null, errors: [CODE_INVALID] })
      // The refusal did not roll the cleanup back: the row is gone and the address free.
      expect(await pendingRow(bibi.id)).toBeNull()
      expect(
        await DbUserContact.findOne({
          where: { email: 'bibi-late@bloxberg.de' },
          withDeleted: true,
        }),
      ).toBeNull()
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

    it('resending does not renew an expired change - it drops it, and the address is free', async () => {
      const row = await pendingRow(bibi.id)
      await ageContactRow(row!.id, 25)
      await ageRequestEvents(bibi.id, 11)
      await expect(mutate({ mutation: resendEmailChange })).resolves.toMatchObject({
        data: null,
        errors: [new GraphQLError('No email change is pending')],
      })
      expect(await pendingRow(bibi.id)).toBeNull()
      expect(
        await DbUserContact.findOne({ where: { email: row!.email }, withDeleted: true }),
      ).toBeNull()
      // A new change can start at once.
      await mutate({
        mutation: requestEmailChange,
        variables: { email: 'bibi-seventh@bloxberg.de', password: PASSWORD },
      })
      expect((await pendingRow(bibi.id))?.email).toBe('bibi-seventh@bloxberg.de')
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

  /**
   * ⭐ Going back to an address one held before, found missing by Bernd at the device on
   * 24.08.2026: the wallet answered "already in use" for the member's OWN earlier address.
   * The alias has allowed taking a name back all along, and for the same reason - an
   * address one has already proven is not somebody else's.
   *
   * `user_contacts.email` is unique, so there is nothing to insert: the row is already
   * there and is borrowed for the change. What these tests watch is that it comes out of
   * that unharmed - the history must not shrink, and the marker must land on the old row.
   */
  describe('changing back to an address one held before', () => {
    let bob: DbUser

    const rowsOf = (userId: number) =>
      DbUserContact.find({ where: { userId }, order: { createdAt: 'ASC' }, withDeleted: true })

    const confirmPending = async (userId: number) => {
      const row = await pendingRow(userId)
      return mutate({
        mutation: confirmEmailChange,
        variables: { code: row!.emailVerificationCode.toString() },
      })
    }

    beforeAll(async () => {
      resetToken()
      bob = await userFactory(testEnv, bobBaumeister)
      await loginAs('bob@baumeister.de')
      // Away from the registration address, and confirmed - this is what leaves an earlier
      // address behind.
      await mutate({
        mutation: requestEmailChange,
        variables: { email: 'bob-second@baumeister.de', password: PASSWORD },
      })
      await confirmPending(bob.id)
      await ageRequestEvents(bob.id, 11)
    })

    afterAll(() => {
      resetToken()
    })

    it('leaves the earlier address behind as a confirmed row that is not in flight', async () => {
      const rows = await rowsOf(bob.id)

      expect(rows.map((row) => row.email)).toEqual([
        'bob@baumeister.de',
        'bob-second@baumeister.de',
      ])
      // ⛔ The settled row must not keep the change type, or every address the member ever
      // changed to would look like a change in flight to the finder.
      expect(rows.every((row) => row.emailOptInTypeId !== OptInType.EMAIL_OPT_IN_CHANGE)).toBe(true)
      expect(await pendingRow(bob.id)).toBeNull()
    })

    it('accepts the earlier address instead of calling it taken', async () => {
      await expect(
        mutate({
          mutation: requestEmailChange,
          variables: { email: 'bob@baumeister.de', password: PASSWORD },
        }),
      ).resolves.toMatchObject({
        data: { requestEmailChange: { email: 'bob@baumeister.de' } },
        errors: undefined,
      })
      // Borrowed, not inserted: still two rows, and the pending one is the old one.
      const rows = await rowsOf(bob.id)
      expect(rows).toHaveLength(2)
      expect((await pendingRow(bob.id))?.email).toBe('bob@baumeister.de')
    })

    it('still refuses an address that belongs to somebody else', async () => {
      await ageRequestEvents(bob.id, 11)
      await expect(
        mutate({
          mutation: requestEmailChange,
          variables: { email: 'bibi@bloxberg.de', password: PASSWORD },
        }),
      ).resolves.toMatchObject({
        data: null,
        errors: [new GraphQLError('Email address already in use')],
      })
    })

    it('restores the borrowed row when the change is called off, instead of deleting it', async () => {
      await ageRequestEvents(bob.id, 11)
      await mutate({
        mutation: requestEmailChange,
        variables: { email: 'bob@baumeister.de', password: PASSWORD },
      })
      await mutate({ mutation: cancelEmailChange })

      const rows = await rowsOf(bob.id)
      expect(rows.map((row) => row.email)).toEqual([
        'bob@baumeister.de',
        'bob-second@baumeister.de',
      ])
      expect(await pendingRow(bob.id)).toBeNull()
      // Still a confirmed address of theirs - the history is untouched.
      const earlier = rows.find((row) => row.email === 'bob@baumeister.de')
      expect(earlier?.emailChecked).toBe(true)
    })

    it('moves the marker back to the old row on confirmation, adding nothing', async () => {
      await ageRequestEvents(bob.id, 11)
      await mutate({
        mutation: requestEmailChange,
        variables: { email: 'bob@baumeister.de', password: PASSWORD },
      })
      await confirmPending(bob.id)

      const rows = await rowsOf(bob.id)
      expect(rows).toHaveLength(2)
      const stored = await DbUser.findOneOrFail({
        where: { id: bob.id },
        relations: ['emailContact'],
      })
      expect(stored.emailContact.email).toBe('bob@baumeister.de')
      expect(stored.emailId).toBe(rows[0].id)
      expect(await pendingRow(bob.id)).toBeNull()
    })

    it('lets them log in with the address they came back to, and not with the other', async () => {
      resetToken()
      await expect(loginAs('bob@baumeister.de')).resolves.toMatchObject({ errors: undefined })
      resetToken()
      await expect(loginAs('bob-second@baumeister.de')).resolves.toMatchObject({
        data: null,
      })
    })

    /**
     * The stop button in the notice must survive a repeat: whoever reads the old mailbox
     * decides on the mail they HAVE, and that is as often the first one as the latest.
     */
    describe('asking again for the address one is taking back', () => {
      beforeAll(async () => {
        await loginAs('bob@baumeister.de')
        await ageRequestEvents(bob.id, 11)
      })

      afterAll(() => {
        resetToken()
      })

      it('keeps the codes already delivered - and the first stop button still works', async () => {
        await mutate({
          mutation: requestEmailChange,
          variables: { email: 'bob-second@baumeister.de', password: PASSWORD },
        })
        const before = await pendingRow(bob.id)
        const code = before!.emailVerificationCode.toString()
        const vetoCode = before!.changeVetoCode!.toString()
        const deadlineBefore = (before!.updatedAt ?? before!.createdAt).getTime()

        await ageRequestEvents(bob.id, 11)
        await expect(
          mutate({
            mutation: requestEmailChange,
            variables: { email: 'bob-second@baumeister.de', password: PASSWORD },
          }),
        ).resolves.toMatchObject({
          data: { requestEmailChange: { email: 'bob-second@baumeister.de' } },
          errors: undefined,
        })

        const row = await pendingRow(bob.id)
        // Same row, same codes, and the clock has not moved: the links that already went
        // out keep working, and no repeat buys another window.
        expect(row!.id).toBe(before!.id)
        expect(row!.emailVerificationCode.toString()).toBe(code)
        expect(row!.changeVetoCode!.toString()).toBe(vetoCode)
        expect((row!.updatedAt ?? row!.createdAt).getTime()).toBe(deadlineBefore)

        // The stop button from the FIRST notice, clicked after the second ask.
        await expect(
          mutate({ mutation: revokeEmailChange, variables: { vetoCode } }),
        ).resolves.toMatchObject({ data: { revokeEmailChange: true }, errors: undefined })
        expect(await pendingRow(bob.id)).toBeNull()
      })

      it('starts a new change with fresh codes once the old one has run out', async () => {
        await ageRequestEvents(bob.id, 11)
        await mutate({
          mutation: requestEmailChange,
          variables: { email: 'bob-second@baumeister.de', password: PASSWORD },
        })
        const before = await pendingRow(bob.id)
        const oldCode = before!.emailVerificationCode.toString()
        const oldVeto = before!.changeVetoCode!.toString()
        await ageContactRow(before!.id, 25)
        await ageRequestEvents(bob.id, 11)

        await expect(
          mutate({
            mutation: requestEmailChange,
            variables: { email: 'bob-second@baumeister.de', password: PASSWORD },
          }),
        ).resolves.toMatchObject({
          data: { requestEmailChange: { email: 'bob-second@baumeister.de' } },
          errors: undefined,
        })
        const row = await pendingRow(bob.id)
        // The notice of the run-out change promised it would lapse; asking after that is
        // a NEW change on the same borrowed row - the dead links are not resold.
        expect(row!.id).toBe(before!.id)
        expect(row!.emailVerificationCode.toString()).not.toBe(oldCode)
        expect(row!.changeVetoCode!.toString()).not.toBe(oldVeto)

        await mutate({ mutation: cancelEmailChange })
        expect(await pendingRow(bob.id)).toBeNull()
      })

      it('an expired stop button answers expired - and the borrowed row is restored', async () => {
        await ageRequestEvents(bob.id, 11)
        await mutate({
          mutation: requestEmailChange,
          variables: { email: 'bob-second@baumeister.de', password: PASSWORD },
        })
        const row = await pendingRow(bob.id)
        const vetoCode = row!.changeVetoCode!.toString()
        await ageContactRow(row!.id, 25)

        await expect(
          mutate({ mutation: revokeEmailChange, variables: { vetoCode } }),
        ).resolves.toMatchObject({ data: null, errors: [CODE_INVALID] })
        // Released despite the refusal - and restored, never deleted: it is one of the
        // member's own addresses.
        expect(await pendingRow(bob.id)).toBeNull()
        const restored = await DbUserContact.findOneOrFail({
          where: { email: 'bob-second@baumeister.de' },
        })
        expect(restored.emailChecked).toBe(true)
        expect(restored.changeVetoCode).toBeNull()
      })
    })
  })

  /**
   * Typing an address into the change form is a claim without proof. Registering with it is
   * the same claim - but it ends in somebody having to answer mail at that address. So the
   * typed claim yields, and it yields at any age: otherwise it kept the address from whoever
   * really holds the mailbox, silently, and for as long as it was renewed. That is what shut
   * the Elopage webhook out for a paying buyer.
   */
  describe('a never-confirmed hold yields to a registration', () => {
    const wanted = 'wanted-by-both@example.org'

    let holder: DbUser

    beforeAll(async () => {
      // Built here rather than taken from the seed shelf: the two unused seed members are
      // unusable on purpose - Stephen Hawking carries a `deletedAt` and Garrick Ollivander
      // an unconfirmed address, and the first attempt at this test failed on exactly that.
      resetToken()
      holder = await userFactory(testEnv, {
        email: 'holder@example.org',
        firstName: 'Holder',
        lastName: 'OfAddresses',
        emailChecked: true,
        language: 'de',
      })
      await expect(loginAs('holder@example.org')).resolves.toMatchObject({ errors: undefined })
      await expect(
        mutate({
          mutation: requestEmailChange,
          variables: { email: wanted, password: PASSWORD },
        }),
      ).resolves.toMatchObject({ data: { requestEmailChange: { email: wanted } } })
      // The fixture proves itself at every step - a silent no-op here would leave a test
      // that looks like it covers something and covers nothing. Young on purpose: age is
      // exactly what must not matter.
      const held = await pendingRow(holder.id)
      expect(held?.email).toBe(wanted)
      expect(held?.emailChecked).toBe(false)
    })

    it('lets the other person register with it, and drops the hold', async () => {
      resetToken()
      await expect(
        mutate({
          mutation: createUser,
          variables: {
            email: wanted,
            firstName: 'Wanted',
            lastName: 'ByBoth',
            language: 'de',
          },
        }),
      ).resolves.toMatchObject({ errors: undefined })

      // The address now belongs to an account, and bibi's claim on it is gone - not merely
      // hidden: a soft-deleted row would still block everybody, so it has to be really gone.
      const owner = await DbUser.findOneOrFail({
        where: { id: (await DbUserContact.findOneOrFail({ where: { email: wanted } })).userId },
      })
      expect(owner.id).not.toBe(holder.id)
      expect(await pendingRow(holder.id)).toBeNull()
      expect(
        await DbUserContact.count({
          where: { email: wanted, userId: holder.id },
          withDeleted: true,
        }),
      ).toBe(0)
    })
  })

  /**
   * ⭐ Two tabs, one member: the request in tab 1 carries a context snapshot taken before
   * `verifyPassword`'s Argon2id work, and a confirm in tab 2 can move the address in
   * force inside that window. The resolver is called directly here - the test server
   * builds a fresh context per call, and the whole point is a STALE one.
   */
  describe('a request racing a confirm in another tab', () => {
    let racer: DbUser
    let stale: DbUser

    const resolver = new EmailChangeResolver()
    const staleContext = (): Context => ({ token: null, setHeaders: [], user: stale })

    beforeAll(async () => {
      resetToken()
      racer = await userFactory(testEnv, {
        email: 'racer@example.org',
        firstName: 'Racer',
        lastName: 'OfTabs',
        emailChecked: true,
        language: 'de',
      })
      await loginAs('racer@example.org')
      await mutate({
        mutation: requestEmailChange,
        variables: { email: 'racer-second@example.org', password: PASSWORD },
      })
      // Tab 1's snapshot, taken while racer@example.org was still in force ...
      stale = await DbUser.findOneOrFail({
        where: { id: racer.id },
        relations: ['emailContact'],
      })
      expect(stale.emailContact.email).toBe('racer@example.org')
      // ... and tab 2 confirms before tab 1's request reaches the lock.
      const row = await pendingRow(racer.id)
      await expect(
        mutate({
          mutation: confirmEmailChange,
          variables: { code: row!.emailVerificationCode.toString() },
        }),
      ).resolves.toMatchObject({ errors: undefined })
      await ageRequestEvents(racer.id, 11)
    })

    afterAll(() => {
      resetToken()
    })

    it('refuses the address that has just become current - decided under the lock', async () => {
      await expect(
        resolver.requestEmailChange('racer-second@example.org', PASSWORD, staleContext()),
      ).rejects.toThrow('This is already the email address of this account')
      // Nothing was marked: the row in force is not a pending change onto itself.
      expect(await pendingRow(racer.id)).toBeNull()
    })

    it('sends the notice to the address in force, not to the snapshot', async () => {
      ;(sendEmailChangeNoticeEmail as jest.Mock).mockClear()
      await resolver.requestEmailChange('racer-third@example.org', PASSWORD, staleContext())
      expect((await pendingRow(racer.id))?.email).toBe('racer-third@example.org')
      // The mailbox that can stop the change is the one the account is AT - the
      // snapshot points at the one it left a moment ago.
      expect(sendEmailChangeNoticeEmail).toHaveBeenCalledTimes(1)
      expect(sendEmailChangeNoticeEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'racer-second@example.org' }),
      )
      await mutate({ mutation: cancelEmailChange })
      expect(await pendingRow(racer.id)).toBeNull()
    })

    it('resends the notice to the address in force, not to the snapshot', async () => {
      await ageRequestEvents(racer.id, 11)
      await mutate({
        mutation: requestEmailChange,
        variables: { email: 'racer-fourth@example.org', password: PASSWORD },
      })
      await ageRequestEvents(racer.id, 11)
      ;(sendEmailChangeNoticeEmail as jest.Mock).mockClear()
      await resolver.resendEmailChange(staleContext())
      expect(sendEmailChangeNoticeEmail).toHaveBeenCalledTimes(1)
      expect(sendEmailChangeNoticeEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'racer-second@example.org' }),
      )
      await mutate({ mutation: cancelEmailChange })
      expect(await pendingRow(racer.id)).toBeNull()
    })
  })
})
