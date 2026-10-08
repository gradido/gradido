import { randomBytes } from 'node:crypto'
import { once } from 'node:events'
import { request as httpRequest } from 'node:http'
import { AddressInfo } from 'node:net'
import { GmsPublishLocationType } from '@enum/GmsPublishLocationType'
import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import { RoleNames } from '@enum/RoleNames'
import { ContributionLink } from '@model/ContributionLink'
import { Location } from '@model/Location'
import { User as UserModel } from '@model/User'
import {
  ApolloServerTestClient,
  cleanDB,
  headerPushMock,
  resetToken,
  TEST_AVATAR_200_PIXELS_BASE64,
  TEST_AVATAR_FULL_BASE64,
  TEST_AVATAR_SMALL_BASE64,
  testEnvironment,
} from '@test/helpers'
import { getLogger } from 'config-schema/test/testSetup'
import {
  CONFIG as CORE_CONFIG,
  objectValuesToArray,
  sendAccountActivationEmail,
  sendAccountMultiRegistrationEmail,
  sendAssistedRegistrationConfirmEmail,
  sendResetPasswordEmail,
} from 'core'
import {
  AccountState,
  ALIAS_ORIGIN_ASSIGNED,
  ALIAS_ORIGIN_CHOSEN,
  AppDatabase,
  Community as DbCommunity,
  Event as DbEvent,
  FederatedCommunity as DbFederatedCommunity,
  dbInsertMatchingEntry,
  dbInsertUserAlias,
  transactionLinkFactory as dbTransactionLinkFactory,
  userFactory as dbUserFactory,
  drizzleDb,
  EventType,
  TransactionLinkInterface,
  User,
  UserAlias,
  UserContact,
  UserRole,
} from 'database'
import { GraphQLError } from 'graphql'
import { GraphQLClient } from 'graphql-request'
import { gql } from 'graphql-tag'
import {
  AVATAR_FULL_MAX_BYTES,
  AVATAR_SMALL_MAX_BYTES,
  createKeyPair,
  encryptAndSign,
  MemberAvatarPayload,
  MemberAvatarsJwtPayloadType,
  MemberAvatarsResponseJwtPayloadType,
  verifyAndDecrypt,
} from 'shared'
import { reencodeImage } from 'shared-native'
import { QueryRunner } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import {
  deleteGmsUser,
  putGmsMatchingEntrySnapshots,
  upsertGmsUsers,
  verifyAuthToken,
} from '@/apis/gms/GmsClient'
import { subscribe } from '@/apis/KlicktippController'
import { encode } from '@/auth/JWT'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { GUARANTOR_LIMIT, mintGuarantorCode } from '@/data/GuarantorCode.logic'
import {
  MEMBER_AVATARS_FULL_MAX_PER_REQUEST,
  MEMBER_AVATARS_RELAYS_MAX_PER_REQUEST,
} from '@/data/MemberAvatars.logic'
import { PublishNameType } from '@/graphql/enum/PublishNameType'
import { encryptPassword } from '@/password/PasswordEncryptor'
import { writeHomeCommunityEntry } from '@/seeds/community'
import { contributionLinkFactory } from '@/seeds/factory/contributionLink'
import { userFactory } from '@/seeds/factory/user'
import {
  adoptAlias,
  createUser,
  deleteUser,
  forgotPassword,
  login,
  logout,
  removeUserAvatar,
  sendActivationEmail,
  setPassword,
  setUserAvatar,
  setUserRole,
  unDeleteUser,
  updateUserInfos,
} from '@/seeds/graphql/mutations'
import {
  aliasStatus,
  authenticateGmsUserSearch,
  avatarFull,
  checkUsername,
  gmsDashboardUrl,
  memberAvatarFull,
  memberAvatars,
  queryOptIn,
  queryTransactionLinkOwnSettings,
  queryTransactionLinkUserLocation,
  searchAdminUsers,
  searchUsers,
  userAboutMe,
  userAvatar,
  userEmailContact,
  userLocationQuery,
  userOwnSettings,
  user as userQuery,
  userTransfersInChat,
  userUserLocation,
  verifyLogin,
  verifyLoginAboutMe,
  verifyLoginAvatar,
  verifyLoginEmailContact,
  verifyLoginOwnSettings,
  verifyLoginTransfersInChat,
  verifyLoginUserLocation,
} from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { stephenHawking } from '@/seeds/users/stephen-hawking'
import { Context } from '@/server/context'
import { createServer } from '@/server/createServer'
import { printTimeDuration } from '@/util/time'
import { UserResolver } from './UserResolver'
import { Location2Point } from './util/Location2Point'

jest.mock('@/apis/humhub/HumHubClient')
jest.mock('@/password/EncryptorUtils')

// Only the two calls the consent tests watch; everything else in the client stays real,
// and GMS_ACTIVE is false for the rest of this file, so nothing else reaches it.
jest.mock('@/apis/gms/GmsClient', () => {
  const originalModule = jest.requireActual('@/apis/gms/GmsClient')
  return {
    __esModule: true,
    ...originalModule,
    upsertGmsUsers: jest.fn(),
    putGmsMatchingEntrySnapshots: jest.fn(),
    deleteGmsUser: jest.fn(),
    // Watched by the dashboard-url tests: the one call that mints a member token over there.
    verifyAuthToken: jest.fn(),
  }
})

jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    sendAccountActivationEmail: jest.fn(),
    sendAccountMultiRegistrationEmail: jest.fn(),
    sendAssistedRegistrationConfirmEmail: jest.fn(),
    sendResetPasswordEmail: jest.fn(),
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

// The resolver now names its logger per method (createLogger('login') etc.), so each
// assertion has to reach for the logger of the method that actually writes the message.
const resolverLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.UserResolver.${method}`)
const setPasswordLogger = resolverLogger('setPassword')
const loginLogger = resolverLogger('login')
const forgotPasswordLogger = resolverLogger('forgotPassword')
const updateUserInfosLogger = resolverLogger('updateUserInfos')
const sendActivationEmailLogger = resolverLogger('sendActivationEmail')
const findUserByEmailLogger = resolverLogger('findUserByEmail')
const logErrorLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

CONFIG.EMAIL_CODE_REQUEST_TIME = 10

// The context of a field resolver that is asked directly: the member asking, or nobody.
const callerWithId = (id: number | undefined): Context =>
  ({ user: id === undefined ? undefined : { id } }) as unknown as Context

let admin: User
let user: User
let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  db: AppDatabase
}

beforeAll(async () => {
  testEnv = await testEnvironment(getLogger('apollo'))
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  CONFIG.HUMHUB_ACTIVE = false
  CONFIG.DLT_ACTIVE = false
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

describe('UserResolver', () => {
  describe('createUser', () => {
    const variables = {
      email: 'peter@lustig.de',
      firstName: 'Peter',
      lastName: 'Lustig',
      language: 'de',
      publisherId: 1234,
    }

    let result: any
    let emailVerificationCode: string
    let user: User[]

    beforeAll(async () => {
      jest.clearAllMocks()
      await writeHomeCommunityEntry()
      result = await mutate({ mutation: createUser, variables })
      user = await User.find({ relations: ['emailContact', 'userRole'] })
      emailVerificationCode = user[0].emailContact.emailVerificationCode.toString()
    })

    afterAll(async () => {
      await cleanDB()
    })

    // What the registration stores, mails and records is tested in
    // interactions/registerUser, what the queries do in database. Here: the API contract.
    it('returns success', () => {
      expect(result).toEqual(expect.objectContaining({ data: { createUser: true } }))
    })

    describe('user already exists', () => {
      let mutation: any
      beforeAll(async () => {
        mutation = await mutate({ mutation: createUser, variables })
      })

      it('answers exactly like a new registration', () => {
        expect(mutation).toEqual(expect.objectContaining({ data: { createUser: true } }))
      })
    })

    // Not a registration, and tested only here: setting the password activates the account.
    describe('activating the account', () => {
      beforeAll(async () => {
        await mutate({
          mutation: setPassword,
          variables: { code: emailVerificationCode, password: 'Aa12345_' },
        })
      })

      afterAll(async () => {
        await cleanDB()
      })

      it('stores the USER_ACTIVATE_ACCOUNT event in the database', async () => {
        await expect(DbEvent.find()).resolves.toContainEqual(
          expect.objectContaining({
            type: EventType.USER_ACTIVATE_ACCOUNT,
            affectedUserId: user[0].id,
            actingUserId: user[0].id,
          }),
        )
      })
    })

    describe('the Gradido address the registration started at (referrerAlias)', () => {
      // "Konto anlegen" on /u/<alias> carries the alias into createUser, and its owner
      // becomes the referrer - silently: for a well-formed user name nothing in the answer
      // tells whether it belongs to anybody. Anything that is no user name is refused like any
      // other invalid field; that tells only its shape, which is public anyway.
      let bob: User
      let link: ContributionLink
      const results: Record<string, any> = {}

      const register = async (email: string, extra: Record<string, string>) => {
        results[email] = await mutate({
          mutation: createUser,
          variables: { firstName: 'Carla', lastName: 'Neu', language: 'de', email, ...extra },
        })
      }

      const registered = async (email: string): Promise<User> =>
        (await UserContact.findOneOrFail({ where: { email }, relations: ['user'] })).user

      beforeAll(async () => {
        await cleanDB()
        bob = await userFactory(testEnv, bobBaumeister)
        // A deleted member who still holds a name.
        await userFactory(testEnv, { ...stephenHawking, alias: 'BlackHoles' })
        // A member of another community, whose name exists only over there: a cached copy,
        // `foreign` like every row storeForeignUser writes.
        const otherCommunity = await DbCommunity.create({
          foreign: true,
          url: 'http://other.invalid/api/',
          publicKey: randomBytes(32),
          communityUuid: uuidv4(),
          authenticatedAt: new Date(),
          name: 'Other community',
          description: 'a name that exists only over there',
          creationDate: new Date(),
        }).save()
        await dbUserFactory(
          {
            alias: 'FarAway',
            email: 'far@away.invalid',
            firstName: 'Far',
            lastName: 'Away',
            emailChecked: true,
            language: 'de',
          },
          otherCommunity,
        )
        await User.update({ alias: 'FarAway' }, { foreign: true })
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        link = await contributionLinkFactory(testEnv, {
          name: 'Market day',
          memo: 'Thank you for coming to the market day',
          amount: 200,
          validFrom: new Date(),
          validTo: tomorrow,
        })
        resetToken()

        await register('by@alias.de', { referrerAlias: 'MeisterBob' })
        await register('by@unknown-alias.de', { referrerAlias: 'NobodyHere' })
        await register('by@gradido-id.de', { referrerAlias: bob.gradidoID })
        await register('by@deleted-member.de', { referrerAlias: 'BlackHoles' })
        await register('by@other-community.de', { referrerAlias: 'FarAway' })
        await register('by@link-and-alias.de', {
          referrerAlias: 'MeisterBob',
          redeemCode: 'CL-' + link.code,
        })
      })

      afterAll(async () => {
        await cleanDB()
      })

      it('refuses a gradido ID, which is no user name, and opens no account', async () => {
        expect(results['by@gradido-id.de'].errors).toEqual([
          new GraphQLError('Given alias is too long'),
        ])
        await expect(
          UserContact.findOne({ where: { email: 'by@gradido-id.de' } }),
        ).resolves.toBeNull()
      })

      it('leaves no trace for a name that exists only in another community', async () => {
        await expect(registered('by@other-community.de')).resolves.toEqual(
          expect.objectContaining({ referrerId: null }),
        )
      })

      it('answers every well-formed name the same way - no error, the same shape', () => {
        const wellFormed = Object.entries(results).filter(([email]) => email !== 'by@gradido-id.de')
        expect(wellFormed).toHaveLength(5)
        for (const [, result] of wellFormed) {
          expect({ data: result.data, errors: result.errors }).toEqual({
            data: { createUser: true },
            errors: undefined,
          })
        }
      })
    })

    /**
     * The guarantor code (E-017): a guest who scanned a member's live card may choose a password
     * in the form, and the account is usable at once. Without the code nothing changes - every
     * test above runs as it did, and that is the proof.
     */
    describe('the guarantor code (guarantorCode)', () => {
      const PASSWORD = 'Aa12345_'
      let bob: User
      let hawking: User
      let homeCom: DbCommunity

      const code = (userId = bob.id, now = new Date()): string =>
        mintGuarantorCode(userId, homeCom.communityUuid as string, now).code

      const register = (email: string, extra: Record<string, string>) =>
        mutate({
          mutation: createUser,
          variables: { firstName: 'Carla', lastName: 'Neu', language: 'de', email, ...extra },
        })

      const registered = async (email: string): Promise<User> =>
        (await UserContact.findOneOrFail({ where: { email }, relations: ['user'] })).user

      const noAccount = (email: string) =>
        expect(UserContact.findOne({ where: { email } })).resolves.toBeNull()

      beforeAll(async () => {
        await cleanDB()
        homeCom = await writeHomeCommunityEntry()
        bob = await userFactory(testEnv, bobBaumeister)
        // A deleted member who still holds a name.
        hawking = await userFactory(testEnv, { ...stephenHawking, alias: 'BlackHoles' })
        jest.clearAllMocks()
        resetToken()
      })

      afterAll(async () => {
        await cleanDB()
      })

      describe('with a valid code and a password', () => {
        let result: any
        let carla: User

        beforeAll(async () => {
          result = await register('carla@table.de', {
            referrerAlias: 'MeisterBob',
            guarantorCode: code(),
            password: PASSWORD,
          })
          carla = await registered('carla@table.de')
        })

        it('answers like every registration', () => {
          expect({ data: result.data, errors: result.errors }).toEqual({
            data: { createUser: true },
            errors: undefined,
          })
        })

        it('opens the account with the password, the address unconfirmed, the member as referrer', async () => {
          const contact = await UserContact.findOneOrFail({ where: { email: 'carla@table.de' } })
          expect(carla).toEqual(
            expect.objectContaining({
              passwordEncryptionType: PasswordEncryptionType.GRADIDO_ID,
              referrerId: bob.id,
            }),
          )
          expect(contact.emailChecked).toBe(false)
        })

        it('counts it as a table registration, acted by the member who showed the code', async () => {
          await expect(DbEvent.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventType.USER_REGISTER_GUARANTOR,
              affectedUserId: carla.id,
              actingUserId: bob.id,
            }),
          )
        })

        // The password exists already, so the set-password link would be the wrong door.
        it('sends the confirm-only mail, not the activation mail', () => {
          expect(sendAssistedRegistrationConfirmEmail).toBeCalledWith(
            expect.objectContaining({
              email: 'carla@table.de',
              firstName: 'Carla',
              lastName: 'Neu',
              language: 'de',
              confirmLink: expect.stringContaining(CONFIG.EMAIL_LINK_CONFIRM_EMAIL),
            }),
          )
          expect(sendAccountActivationEmail).not.toBeCalledWith(
            expect.objectContaining({ email: 'carla@table.de' }),
          )
        })

        it('lets the guest sign in at once, before the address is confirmed', async () => {
          resetToken()
          const signedIn = await mutate({
            mutation: login,
            variables: { email: 'carla@table.de', password: PASSWORD },
          })
          expect(signedIn.errors).toBeUndefined()
          resetToken()
        })
      })

      // The code names the member who showed it; the address the guest came from only names
      // them on the page. Another address, or none at all, changes nothing.
      it('takes the member from the code, whatever address came along', async () => {
        const elsewhere = await register('elsewhere@table.de', {
          referrerAlias: 'SomebodyElse',
          guarantorCode: code(),
          password: PASSWORD,
        })
        const nowhere = await register('nowhere@table.de', {
          guarantorCode: code(),
          password: PASSWORD,
        })

        for (const result of [elsewhere, nowhere]) {
          expect(result.errors).toBeUndefined()
        }
        for (const email of ['elsewhere@table.de', 'nowhere@table.de']) {
          const guest = await registered(email)
          expect(guest.referrerId).toBe(bob.id)
          // Deleted again, so the vouching limit below counts Bob's guests as it expects: a
          // deleted guest account frees its place.
          await User.update(
            { id: guest.id },
            { deletedAt: new Date(), accountState: AccountState.DELETED },
          )
        }
      })

      // A guarantor code opens an account with a password: without one it is refused, and no
      // account is opened - not even a classic one.
      it('refuses a code without a password, and opens no account', async () => {
        jest.clearAllMocks()
        const result = await register('nopassword@table.de', {
          referrerAlias: 'MeisterBob',
          guarantorCode: code(),
        })

        expect(result.errors).toEqual([new GraphQLError('Guarantor code requires a password')])
        await noAccount('nopassword@table.de')
        expect(sendAccountActivationEmail).not.toBeCalled()
      })

      // The member who showed the code deleted their account inside the ten minutes: the seal
      // still holds, but nobody is left who vouches (E-019) - so no account with a password.
      // The member is looked up before the address, so a taken one gets the same answer.
      it('refuses the code of a member who has gone meanwhile, whatever the address, and opens no account', async () => {
        jest.clearAllMocks()
        const orphan = { referrerAlias: 'BlackHoles', guarantorCode: code(hawking.id) }
        const free = await register('orphan@table.de', { ...orphan, password: PASSWORD })
        const taken = await register('bob@baumeister.de', { ...orphan, password: PASSWORD })

        for (const result of [free, taken]) {
          expect(result.errors).toEqual([new GraphQLError('Guarantor code invalid or expired')])
        }
        await noAccount('orphan@table.de')
        expect(sendAccountMultiRegistrationEmail).not.toBeCalled()
      })

      /**
       * E-019: a member vouches for at most GUARANTOR_LIMIT accounts that can act
       * without a mailbox - PARTLY_ACTIVATED_GUARANTOR: with a password, unconfirmed, not
       * deleted - with no time window.
       * Bob already vouches for carla@table.de from above; nopassword@table.de is his too, but
       * without a password it can do nothing without the mail and does not count.
       *
       * Every count here runs from the constant, so a new limit (E-022) stays one line in
       * GuarantorCode.logic.ts: guest n is Bob's n-th guest with a password, carla the first.
       */
      describe('the vouching limit', () => {
        const guestEmail = (n: number) => `limit${n}@table.de`
        const tableGuest = (n: number) =>
          register(guestEmail(n), {
            // Letters only: a name may hold no digit (VALID_NAME_REGEX).
            firstName: `Guest${String.fromCharCode(64 + n)}`,
            referrerAlias: 'MeisterBob',
            guarantorCode: code(),
            password: PASSWORD,
          })

        beforeAll(async () => {
          for (let n = 2; n < GUARANTOR_LIMIT; n++) {
            expect((await tableGuest(n)).errors).toBeUndefined()
          }
        })

        // One below the limit the silence answers a taken address, and no account comes of it:
        // the last place still goes through.
        it('lets the silent answer to a taken address count for nothing', async () => {
          const taken = await register('bob@baumeister.de', {
            referrerAlias: 'MeisterBob',
            guarantorCode: code(),
            password: PASSWORD,
          })
          expect(taken.errors).toBeUndefined()

          expect((await tableGuest(GUARANTOR_LIMIT)).errors).toBeUndefined()
        })

        it('refuses one more account while the limit is unconfirmed, and opens none', async () => {
          const next = GUARANTOR_LIMIT + 1
          expect((await tableGuest(next)).errors).toEqual([
            new GraphQLError('Vouching limit reached'),
          ])
          await noAccount(guestEmail(next))
        })

        // Counted before the address is looked at: at the limit a taken address gets the same
        // refusal as a free one - the silence would tell them apart - and its owner no mail.
        it('refuses a taken address at the limit just like a free one, and writes its owner no mail', async () => {
          jest.clearAllMocks()
          const taken = await register('bob@baumeister.de', {
            referrerAlias: 'MeisterBob',
            guarantorCode: code(),
            password: PASSWORD,
          })

          expect(taken.errors).toEqual([new GraphQLError('Vouching limit reached')])
          expect(sendAccountMultiRegistrationEmail).not.toBeCalled()
        })

        // No time window: a guest who has not confirmed for weeks still holds the place.
        it('keeps counting a guest who has not confirmed for weeks', async () => {
          const weeksAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
          await User.update((await registered(guestEmail(2))).id, { createdAt: weeksAgo })

          expect((await tableGuest(GUARANTOR_LIMIT + 1)).errors).toEqual([
            new GraphQLError('Vouching limit reached'),
          ])
        })

        // With carla confirmed, one place is free - and the classic account of the same member
        // would fill it again if it counted.
        it('opens one more once one of them confirms', async () => {
          const carla = await UserContact.findOneOrFail({ where: { email: 'carla@table.de' } })
          await UserContact.update(carla.id, { emailChecked: true })
          await User.update(carla.userId, { accountState: AccountState.ACTIVATED })

          expect((await tableGuest(GUARANTOR_LIMIT + 1)).errors).toBeUndefined()
          await expect(registered(guestEmail(GUARANTOR_LIMIT + 1))).resolves.toEqual(
            expect.objectContaining({ referrerId: bob.id }),
          )
          expect((await tableGuest(GUARANTOR_LIMIT + 2)).errors).toEqual([
            new GraphQLError('Vouching limit reached'),
          ])
        })

        // The way back through support: a dead guest account deleted in the admin frees a place.
        it('opens the next once a dead guest account is deleted', async () => {
          await User.update((await registered(guestEmail(3))).id, {
            deletedAt: new Date(),
            accountState: AccountState.DELETED,
          })

          expect((await tableGuest(GUARANTOR_LIMIT + 2)).errors).toBeUndefined()
        })

        // Two guests at the table in the same moment, one place left: both can read one below
        // the limit before either account exists, so only the second count - one after another
        // in the member's line (inMemberLine) - keeps it at the limit.
        it('lets only one of two guests who register at the same moment take the last place', async () => {
          const limit4 = await UserContact.findOneOrFail({ where: { email: guestEmail(4) } })
          await UserContact.update(limit4.id, { emailChecked: true })
          await User.update(limit4.userId, { accountState: AccountState.ACTIVATED })
          const pair = [GUARANTOR_LIMIT + 3, GUARANTOR_LIMIT + 4]

          const results = await Promise.all(pair.map((n) => tableGuest(n)))

          const errors = results.map((result) => result.errors)

          expect(errors.filter((error) => error === undefined)).toHaveLength(1)
          expect(errors.filter((error) => error !== undefined)).toEqual([
            [new GraphQLError('Vouching limit reached')],
          ])
          const opened = await Promise.all(
            pair.map((n) => UserContact.findOne({ where: { email: guestEmail(n) } })),
          )
          expect(opened.filter(Boolean)).toHaveLength(1)
        })
      })
    })

    /**
     * A redeem code with a password (ZE-017 F5): whoever accepts a member's thank-you gets the
     * account right on the page of the link. The link vouches for it as a guarantor code does -
     * while four things hold. Where one of them does not, the registration is the one it always
     * was, and the answer is the same: nothing here is refused. Without a password nothing
     * changes - every test above runs as it did.
     */
    describe('a redeem code with a password (the link vouches)', () => {
      const PASSWORD = 'Aa12345_'
      const DAY_MS = 24 * 60 * 60 * 1000
      let bob: User
      let bibi: User
      let peter: User
      let garrick: User
      let hawking: User
      let homeCom: DbCommunity

      const register = (email: string, extra: Record<string, unknown>) =>
        mutate({
          mutation: createUser,
          variables: { firstName: 'Sarah', lastName: 'Neu', language: 'de', email, ...extra },
        })

      const registered = async (email: string): Promise<User> =>
        (await UserContact.findOneOrFail({ where: { email }, relations: ['user'] })).user

      // A member's redeem link as createTransactionLink leaves it: open for 14 days.
      const linkOf = (member: User, more: Partial<TransactionLinkInterface> = {}) =>
        dbTransactionLinkFactory(
          { email: '', amount: 20, memo: 'Einfach so — weil es Dich gibt.', ...more },
          member.id,
        )

      // Accounts a member vouches for already, as a table or a link left them.
      const earlierGuests = async (member: User, count: number, tag: string) => {
        for (let n = 0; n < count; n++) {
          const guest = await dbUserFactory(
            {
              email: `${tag}${n}@earlier.de`,
              firstName: 'Earlier',
              lastName: 'Guest',
              emailChecked: false,
            },
            homeCom,
          )
          await User.update(guest.id, {
            referrerId: member.id,
            passwordEncryptionType: PasswordEncryptionType.GRADIDO_ID,
            accountState: AccountState.PARTLY_ACTIVATED_GUARANTOR,
          })
        }
      }

      const answerOf = (result: any) => ({ data: result.data, errors: result.errors })
      const likeEveryRegistration = { data: { createUser: true }, errors: undefined }

      // Opened as at a table: with the password, the address unconfirmed, the member vouching.
      const expectVouchedAccount = async (email: string, guarantor: User) => {
        expect(await registered(email)).toEqual(
          expect.objectContaining({
            passwordEncryptionType: PasswordEncryptionType.GRADIDO_ID,
            accountState: AccountState.PARTLY_ACTIVATED_GUARANTOR,
            referrerId: guarantor.id,
          }),
        )
      }

      // The way it always was: no password, and the activation mail that carries the code.
      const expectAccountThroughTheMail = async (
        email: string,
        code: string,
        referrerId: number | null,
      ) => {
        expect(await registered(email)).toEqual(
          expect.objectContaining({
            passwordEncryptionType: PasswordEncryptionType.NO_PASSWORD,
            accountState: AccountState.REGISTERED,
            referrerId,
          }),
        )
        expect(sendAccountActivationEmail).toBeCalledWith(
          expect.objectContaining({ email, activationLink: expect.stringMatching(`/${code}$`) }),
        )
        expect(sendAssistedRegistrationConfirmEmail).not.toBeCalledWith(
          expect.objectContaining({ email }),
        )
      }

      beforeAll(async () => {
        await cleanDB()
        homeCom = await writeHomeCommunityEntry()
        bob = await userFactory(testEnv, bobBaumeister)
        bibi = await userFactory(testEnv, bibiBloxberg)
        peter = await userFactory(testEnv, peterLustig)
        // Not confirmed: inside its first 24 hours such an account may make links.
        garrick = await userFactory(testEnv, garrickOllivander)
        // Deleted, and their link is still there.
        hawking = await userFactory(testEnv, stephenHawking)
        jest.clearAllMocks()
        resetToken()
      })

      afterAll(async () => {
        await cleanDB()
      })

      describe('with an open link of a confirmed member', () => {
        let result: any
        let sarah: User
        let code: string
        let linkId: number

        beforeAll(async () => {
          const link = await linkOf(bob)
          code = link.code
          linkId = link.id
          result = await register('sarah@provence.fr', { redeemCode: code, password: PASSWORD })
          sarah = await registered('sarah@provence.fr')
        })

        it('answers like every registration', () => {
          expect(answerOf(result)).toEqual(likeEveryRegistration)
        })

        it('opens the account with the password, the address unconfirmed, the member vouching', async () => {
          const contact = await UserContact.findOneOrFail({ where: { email: 'sarah@provence.fr' } })
          await expectVouchedAccount('sarah@provence.fr', bob)
          expect(contact.emailChecked).toBe(false)
        })

        // The event stays the one of a link - the mail to the member who thanked reads it -
        // and it is the trace of "one link, one account".
        it('records it as a registration through the link, once', async () => {
          const events = await DbEvent.find({ where: { affectedUserId: sarah.id } })
          expect(events.filter((event) => event.type === EventType.USER_REGISTER_REDEEM)).toEqual([
            expect.objectContaining({ actingUserId: sarah.id, involvedTransactionLinkId: linkId }),
          ])
          expect(events.map((event) => event.type)).not.toContain(EventType.USER_REGISTER_GUARANTOR)
        })

        // The password exists already, so the set-password link would be the wrong door; and
        // the mail says the account came of a thank-you, with no member beside the guest.
        it('sends the confirm-only mail of a thank-you, not the activation mail', () => {
          expect(sendAssistedRegistrationConfirmEmail).toBeCalledWith(
            expect.objectContaining({
              email: 'sarah@provence.fr',
              firstName: 'Sarah',
              lastName: 'Neu',
              language: 'de',
              confirmLink: expect.stringContaining(CONFIG.EMAIL_LINK_CONFIRM_EMAIL),
              byThanks: true,
            }),
          )
          expect(sendAccountActivationEmail).not.toBeCalledWith(
            expect.objectContaining({ email: 'sarah@provence.fr' }),
          )
        })

        it('lets the guest sign in at once, before the address is confirmed', async () => {
          resetToken()
          const signedIn = await mutate({
            mutation: login,
            variables: { email: 'sarah@provence.fr', password: PASSWORD },
          })
          expect(signedIn.errors).toBeUndefined()
          resetToken()
        })

        // One link, one account: the next one through the same link goes the way through the
        // mail, with the same answer - the place it would take stays free.
        it('gives the next guest through the same link no password', async () => {
          jest.clearAllMocks()
          const next = await register('next@provence.fr', { redeemCode: code, password: PASSWORD })

          expect(answerOf(next)).toEqual(likeEveryRegistration)
          await expectAccountThroughTheMail('next@provence.fr', code, bob.id)
        })

        // Nothing is opened, the owner of the address is told, and the answer is the same.
        it('answers a taken address like every registration, and opens nothing', async () => {
          jest.clearAllMocks()
          const fresh = await linkOf(bob)
          const before = await User.count()

          const taken = await register('bibi@bloxberg.de', {
            redeemCode: fresh.code,
            password: PASSWORD,
          })

          expect(answerOf(taken)).toEqual(likeEveryRegistration)
          expect(await User.count()).toBe(before)
          expect(sendAccountMultiRegistrationEmail).toBeCalledWith(
            expect.objectContaining({ email: 'bibi@bloxberg.de' }),
          )
          expect(sendAssistedRegistrationConfirmEmail).not.toBeCalled()
          // No account came of it, so the link still vouches for one.
          expect(
            answerOf(
              await register('after@provence.fr', { redeemCode: fresh.code, password: PASSWORD }),
            ),
          ).toEqual(likeEveryRegistration)
          await expectVouchedAccount('after@provence.fr', bob)
        })
      })

      /**
       * One rule broken at a time, everything else in order: the answer is the one of every
       * registration, and the account has no password.
       */
      describe('where the link does not vouch', () => {
        beforeEach(() => {
          jest.clearAllMocks()
        })

        it('gives no password once the thank-you was accepted', async () => {
          const link = await linkOf(bob, { redeemedAt: new Date(), redeemedBy: bibi.id })

          const result = await register('accepted@link.de', {
            redeemCode: link.code,
            password: PASSWORD,
          })

          expect(answerOf(result)).toEqual(likeEveryRegistration)
          await expectAccountThroughTheMail('accepted@link.de', link.code, bob.id)
        })

        it('gives no password once the link has run out', async () => {
          const link = await linkOf(bob, { createdAt: new Date(Date.now() - 15 * DAY_MS) })

          const result = await register('expired@link.de', {
            redeemCode: link.code,
            password: PASSWORD,
          })

          expect(answerOf(result)).toEqual(likeEveryRegistration)
          await expectAccountThroughTheMail('expired@link.de', link.code, bob.id)
        })

        // A deleted link is not found at all, as before: nobody becomes the referrer.
        it('gives no password with a deleted link', async () => {
          const link = await linkOf(bob, { deletedAt: true })

          const result = await register('deleted@link.de', {
            redeemCode: link.code,
            password: PASSWORD,
          })

          expect(answerOf(result)).toEqual(likeEveryRegistration)
          await expectAccountThroughTheMail('deleted@link.de', link.code, null)
        })

        // E-018: only a confirmed member vouches. Without this, a fresh account opened the next.
        it('gives no password with the link of a member who has not confirmed their address', async () => {
          const link = await linkOf(garrick)

          const result = await register('chain@link.de', {
            redeemCode: link.code,
            password: PASSWORD,
          })

          expect(answerOf(result)).toEqual(likeEveryRegistration)
          await expectAccountThroughTheMail('chain@link.de', link.code, garrick.id)
        })

        it('gives no password with the link of a member who is deleted', async () => {
          const link = await linkOf(hawking)

          const result = await register('orphan@link.de', {
            redeemCode: link.code,
            password: PASSWORD,
          })

          expect(answerOf(result)).toEqual(likeEveryRegistration)
          await expectAccountThroughTheMail('orphan@link.de', link.code, hawking.id)
        })

        it('gives no password with a code nobody knows', async () => {
          const result = await register('unknown@link.de', {
            redeemCode: 'nobodyknowsthiscode',
            password: PASSWORD,
          })

          expect(answerOf(result)).toEqual(likeEveryRegistration)
          await expectAccountThroughTheMail('unknown@link.de', 'nobodyknowsthiscode', null)
        })

        // A project's registration is nobody's guest: the redeem code is not looked at, and
        // neither is the password. (The document of these tests had no `$project` until now,
        // and a variable a document does not declare is dropped without a word.)
        it('gives no password with a project, whatever link comes along', async () => {
          const link = await linkOf(bob)

          const result = await register('project@link.de', {
            project: 'garden',
            redeemCode: link.code,
            password: PASSWORD,
          })

          expect(answerOf(result)).toEqual(likeEveryRegistration)
          expect(await registered('project@link.de')).toEqual(
            expect.objectContaining({
              passwordEncryptionType: PasswordEncryptionType.NO_PASSWORD,
              accountState: AccountState.REGISTERED,
              referrerId: null,
            }),
          )
        })

        // An input error like everywhere, before the link is looked at: no way through the mail.
        it('refuses a weak password as every registration does, and opens no account', async () => {
          const link = await linkOf(bob)

          const result = await register('weak@link.de', { redeemCode: link.code, password: 'weak' })

          expect(result.errors).toHaveLength(1)
          expect(result.errors?.[0].message).toContain('Please enter a valid password')
          await expect(
            UserContact.findOne({ where: { email: 'weak@link.de' } }),
          ).resolves.toBeNull()
        })
      })

      /**
       * The limit is the member's, shared by table and link (E-022): GUARANTOR_LIMIT accounts
       * that can act without a mailbox, however they were opened.
       */
      describe('the vouching limit', () => {
        beforeEach(() => {
          jest.clearAllMocks()
        })

        // A guarantor code refuses here, with the member beside the guest. A link has nobody
        // beside it: the eleventh guest gets the account through the mail.
        it('gives the guest over the limit no password, and refuses nothing', async () => {
          await earlierGuests(bibi, GUARANTOR_LIMIT, 'full')
          const link = await linkOf(bibi)

          const result = await register('eleventh@link.de', {
            redeemCode: link.code,
            password: PASSWORD,
          })

          expect(answerOf(result)).toEqual(likeEveryRegistration)
          await expectAccountThroughTheMail('eleventh@link.de', link.code, bibi.id)
        })

        it('takes the last place, and then the guarantor code of the same member is refused', async () => {
          await earlierGuests(peter, GUARANTOR_LIMIT - 1, 'almost')
          const link = await linkOf(peter)

          const last = await register('last@link.de', { redeemCode: link.code, password: PASSWORD })

          expect(answerOf(last)).toEqual(likeEveryRegistration)
          await expectVouchedAccount('last@link.de', peter)

          const atTheTable = await register('table@link.de', {
            guarantorCode: mintGuarantorCode(peter.id, homeCom.communityUuid as string).code,
            password: PASSWORD,
          })
          expect(atTheTable.errors).toEqual([new GraphQLError('Vouching limit reached')])
        })
      })

      /**
       * Two at the same moment. Each reads before the other has stored anything; only the lock
       * of the member's row, taken before anything is read, puts them one after the other.
       * Without it both get a password.
       */
      describe('two registrations at the same moment', () => {
        const withPassword = (accounts: User[]) =>
          accounts.filter(
            (account) => account.passwordEncryptionType === PasswordEncryptionType.GRADIDO_ID,
          )

        it('opens one account with a password through one link, and the other without', async () => {
          const member = await userFactory(testEnv, {
            email: 'emma@wald.de',
            firstName: 'Emma',
            lastName: 'Wald',
            emailChecked: true,
            language: 'de',
          })
          const link = await linkOf(member)
          const emails = ['one@race.de', 'two@race.de']

          const results = await Promise.all(
            emails.map((email) => register(email, { redeemCode: link.code, password: PASSWORD })),
          )

          for (const result of results) {
            expect(answerOf(result)).toEqual(likeEveryRegistration)
          }
          const accounts = await Promise.all(emails.map(registered))
          expect(withPassword(accounts)).toHaveLength(1)
          expect(accounts.map((account) => account.accountState).sort()).toEqual(
            [AccountState.PARTLY_ACTIVATED_GUARANTOR, AccountState.REGISTERED].sort(),
          )
        })

        it('gives the last place to one of two guests who come through two links of the member', async () => {
          const member = await userFactory(testEnv, {
            email: 'dave@wald.de',
            firstName: 'Dave',
            lastName: 'Wald',
            emailChecked: true,
            language: 'de',
          })
          await earlierGuests(member, GUARANTOR_LIMIT - 1, 'dave')
          const links = [await linkOf(member), await linkOf(member)]
          const emails = ['three@race.de', 'four@race.de']

          const results = await Promise.all(
            emails.map((email, n) =>
              register(email, { redeemCode: links[n].code, password: PASSWORD }),
            ),
          )

          for (const result of results) {
            expect(answerOf(result)).toEqual(likeEveryRegistration)
          }
          expect(withPassword(await Promise.all(emails.map(registered)))).toHaveLength(1)
          expect(
            await User.count({
              where: {
                referrerId: member.id,
                accountState: AccountState.PARTLY_ACTIVATED_GUARANTOR,
              },
            }),
          ).toBe(GUARANTOR_LIMIT)
        })
      })
    })

    // The guarantor code holds its transaction's connection until it commits. Anything the
    // registration wrote meanwhile over a second connection from the pool - a query handed no
    // `tx` - would, with enough registrations at once, leave every one of them holding one and
    // waiting for another, and the pool waits without a time limit. Registration runs on
    // Drizzle, so it is Drizzle's pool the test fills, leaving exactly one connection free; the
    // pool's size is read from the driver rather than assumed.
    describe('with only one connection left in the pool', () => {
      let bob: User
      let homeCom: DbCommunity

      beforeAll(async () => {
        await cleanDB()
        homeCom = await writeHomeCommunityEntry()
        bob = await userFactory(testEnv, bobBaumeister)
        resetToken()
      })

      afterAll(async () => {
        await cleanDB()
      })

      // Every connection but one held, until the registration answers or ten seconds pass.
      const registerOverOneConnection = async (
        registration: Record<string, unknown>,
      ): Promise<string> => {
        const pool = (
          drizzleDb() as unknown as {
            $client: {
              promise(): {
                getConnection(): Promise<{ release(): void }>
                pool: { config: { connectionLimit: number } }
              }
            }
          }
        ).$client.promise()
        const held: { release(): void }[] = []
        let timer: NodeJS.Timeout | undefined
        try {
          for (let i = 0; i < pool.pool.config.connectionLimit - 1; i++) {
            held.push(await pool.getConnection())
          }
          return await Promise.race([
            mutate({ mutation: createUser, variables: registration }).then((result) =>
              result.errors ? String(result.errors) : 'opened',
            ),
            new Promise<string>((resolve) => {
              timer = setTimeout(() => resolve('still waiting'), 10000)
            }),
          ])
        } finally {
          clearTimeout(timer)
          for (const connection of held) {
            connection.release()
          }
        }
      }

      it('opens an account over that one connection', async () => {
        expect(
          await registerOverOneConnection({ ...variables, email: 'one.connection@example.org' }),
        ).toBe('opened')
      })

      it('opens an account with the guarantor code over that one connection', async () => {
        expect(
          await registerOverOneConnection({
            ...variables,
            email: 'one.table@example.org',
            guarantorCode: mintGuarantorCode(bob.id, homeCom.communityUuid as string).code,
            password: 'Aa12345_',
          }),
        ).toBe('opened')
      })

      // The link that vouches reads more inside its transaction than the guarantor code does:
      // the link, its maker, the event of an earlier registration - and writes its own event.
      it('opens an account through a redeem link that vouches over that one connection', async () => {
        const link = await dbTransactionLinkFactory(
          { email: '', amount: 20, memo: 'for a newcomer' },
          bob.id,
        )

        expect(
          await registerOverOneConnection({
            ...variables,
            email: 'one.link@example.org',
            redeemCode: link.code,
            password: 'Aa12345_',
          }),
        ).toBe('opened')
        const contact = await UserContact.findOneOrFail({
          where: { email: 'one.link@example.org' },
          relations: ['user'],
        })
        expect(contact.user.accountState).toBe(AccountState.PARTLY_ACTIVATED_GUARANTOR)
      })
    })
  })

  describe('setPassword', () => {
    const createUserVariables = {
      email: 'peter@lustig.de',
      firstName: 'Peter',
      lastName: 'Lustig',
      language: 'de',
      publisherId: 1234,
    }

    let result: any
    let emailVerificationCode: string

    describe('valid optin code and valid password', () => {
      let newUser: User

      beforeAll(async () => {
        await writeHomeCommunityEntry()
        await mutate({ mutation: createUser, variables: createUserVariables })
        const emailContact = await UserContact.findOneOrFail({
          where: { email: createUserVariables.email },
        })
        emailVerificationCode = emailContact.emailVerificationCode.toString()
        result = await mutate({
          mutation: setPassword,
          variables: { code: emailVerificationCode, password: 'Aa12345_' },
        })
        newUser = await User.findOneOrFail({
          where: { id: emailContact.userId },
          relations: ['emailContact'],
        })
      })

      afterAll(async () => {
        await cleanDB()
      })

      it('sets email checked to true', () => {
        expect(newUser.emailContact.emailChecked).toBeTruthy()
      })

      it('marks the account ACTIVATED', () => {
        expect(newUser.accountState).toBe(AccountState.ACTIVATED)
      })

      it('updates the password', async () => {
        const encryptedPass = await encryptPassword(newUser, 'Aa12345_')
        expect(newUser.password.toString()).toEqual(encryptedPass.toString())
      })

      it('calls the klicktipp API', () => {
        expect(subscribe).toBeCalledWith(
          newUser.emailContact.email,
          newUser.language,
          newUser.firstName,
          newUser.lastName,
        )
      })

      it('returns true', () => {
        expect(result).toBeTruthy()
      })
    })

    describe('no valid password', () => {
      beforeAll(async () => {
        await writeHomeCommunityEntry()
        await mutate({ mutation: createUser, variables: createUserVariables })
        const emailContact = await UserContact.findOneOrFail({
          where: { email: createUserVariables.email },
        })
        emailVerificationCode = emailContact.emailVerificationCode.toString()
      })

      afterAll(async () => {
        await cleanDB()
      })

      it('throws an error', async () => {
        jest.clearAllMocks()
        expect(
          await mutate({
            mutation: setPassword,
            variables: { code: emailVerificationCode, password: 'not-valid' },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [
              new GraphQLError(
                'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character, and no spaces!',
              ),
            ],
          }),
        )
      })

      it('logs the error thrown', () => {
        expect(logErrorLogger.error).toBeCalledWith(
          'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character, and no spaces!',
        )
      })
    })

    describe('no valid optin code', () => {
      beforeAll(async () => {
        await mutate({ mutation: createUser, variables: createUserVariables })
      })

      afterAll(async () => {
        await cleanDB()
      })

      it('throws an error', async () => {
        jest.clearAllMocks()
        expect(
          await mutate({
            mutation: setPassword,
            variables: { code: 'not valid', password: 'Aa12345_' },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('Could not login with emailVerificationCode')],
          }),
        )
      })

      it('logs the error found', () => {
        expect(setPasswordLogger.warn).toBeCalledWith('invalid emailVerificationCode=not valid')
      })
    })
  })

  describe('login', () => {
    const variables = {
      email: 'bibi@bloxberg.de',
      password: 'Aa12345_',
      publisherId: 1234,
    }

    let result: any

    afterAll(async () => {
      await cleanDB()
    })

    describe('no users in database', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        const result = await mutate({ mutation: login, variables })
        expect(result).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('No user with this credentials')],
          }),
        )
      })

      // The `login` logger, not `findUserByEmail`'s: the login reads the account itself
      // now (dbFindUserLoginByEmail) instead of borrowing that helper, so the warning is
      // its own. findUserByEmail is still what forgotPassword and the rest go through,
      // and its own logging is asserted there.
      it('logs the error found', () => {
        // Without the address: an address typed into the login form is personal data
        // whether or not an account exists for it, so it does not go into the log.
        expect(loginLogger.warn).toBeCalledWith('login failed, user not found')
      })
    })

    describe('user is in database and correct login data', () => {
      beforeAll(async () => {
        await userFactory(testEnv, bibiBloxberg)
        result = await mutate({ mutation: login, variables })
      })

      afterAll(async () => {
        await cleanDB()
      })

      it('returns the user object', () => {
        expect(result).toEqual(
          expect.objectContaining({
            data: {
              login: {
                alias: 'BBB',
                emailChecked: true,
                firstName: 'Bibi',
                gmsAllowed: false,
                gmsPublishLocation: 'GMS_LOCATION_TYPE_APPROXIMATE',
                gmsPublishName: 'PUBLISH_NAME_ALIAS_OR_INITALS',
                gradidoID: expect.any(String),
                hasElopage: false,
                hideAmountGDD: false,
                hideAmountGDT: false,
                humhubAllowed: true,
                humhubPublishName: 'PUBLISH_NAME_ALIAS_OR_INITALS',
                klickTipp: {
                  newsletterState: false,
                },
                language: 'de',
                lastName: 'Bloxberg',
                publisherId: 1234,
                role: null,
                userLocation: null,
                // Own view only, and answered here because the login names the member it
                // has just authenticated before it returns. Null for the picture -- bibi
                // has not set one -- and the two column defaults for the rest.
                avatar: null,
                avatarVisibleToMembers: true,
                creationAllowed: true,
                transfersInChat: true,
              },
            },
          }),
        )
      })

      it('sets the token in the header', () => {
        expect(headerPushMock).toBeCalledWith({ key: 'token', value: expect.any(String) })
      })

      it('stores the USER_LOGIN event in the database', async () => {
        const userConatct = await UserContact.findOneOrFail({
          where: { email: 'bibi@bloxberg.de' },
          relations: ['user'],
        })
        await expect(DbEvent.find()).resolves.toContainEqual(
          expect.objectContaining({
            type: EventType.USER_LOGIN,
            affectedUserId: userConatct.user.id,
            actingUserId: userConatct.user.id,
          }),
        )
      })
    })

    describe('user is in database and wrong password', () => {
      beforeAll(async () => {
        await userFactory(testEnv, bibiBloxberg)
        result = await mutate({ mutation: login, variables: { ...variables, password: 'wrong' } })
      })

      afterAll(async () => {
        await cleanDB()
      })

      it('returns an error', () => {
        expect(result).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('No user with this credentials')],
          }),
        )
      })

      it('logs warning before error is thrown', () => {
        expect(loginLogger.warn).toBeCalledWith('login failed, wrong password')
      })
    })

    describe('user is in database but deleted', () => {
      beforeAll(async () => {
        jest.clearAllMocks()
        await userFactory(testEnv, stephenHawking)
        const variables = {
          email: stephenHawking.email,
          password: 'Aa12345_',
          publisherId: 1234,
        }
        result = await mutate({ mutation: login, variables })
      })

      afterAll(async () => {
        await cleanDB()
      })

      // ⛔ The SAME answer as for an unknown address (CWE-203). A message of its own told
      // anybody who typed an address whether an account had ever existed behind it. Only
      // the log still tells the two apart -- asserted below.
      it('answers like an unknown address', () => {
        expect(result).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('No user with this credentials')],
          }),
        )
      })

      it('logs warning before error is thrown', () => {
        expect(loginLogger.warn).toBeCalledWith('login failed, user was deleted')
      })
    })

    describe('user is in database but email not confirmed', () => {
      beforeAll(async () => {
        jest.clearAllMocks()
        await userFactory(testEnv, garrickOllivander)
        const variables = {
          email: garrickOllivander.email,
          password: 'Aa12345_',
          publisherId: 1234,
        }
        result = await mutate({ mutation: login, variables })
      })

      afterAll(async () => {
        await cleanDB()
      })

      it('returns an error', () => {
        expect(result).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('The Users email is not validate yet')],
          }),
        )
      })

      it('logs warning before error is thrown', () => {
        expect(loginLogger.warn).toBeCalledWith('login failed, user email not checked')
      })
    })

    describe.skip('user is in database but password is not set', () => {
      beforeAll(async () => {
        jest.clearAllMocks()
        // TODO: we need an user without password set
        const user = await userFactory(testEnv, bibiBloxberg)
        user.password = BigInt(0)
        await user.save()
        result = await mutate({ mutation: login, variables })
      })

      afterAll(async () => {
        await cleanDB()
      })

      it('returns an error', () => {
        expect(result).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('The User has not set a password yet')],
          }),
        )
      })

      it('logs warning before error is thrown', () => {
        expect(loginLogger.warn).toBeCalledWith('login failed, user has not set a password yet')
      })
    })
  })

  describe('logout', () => {
    describe('unauthenticated', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        resetToken()
        await expect(mutate({ mutation: logout })).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated', () => {
      const variables = {
        email: 'bibi@bloxberg.de',
        password: 'Aa12345_',
      }

      beforeAll(async () => {
        await userFactory(testEnv, bibiBloxberg)
        await mutate({ mutation: login, variables })
      })

      afterAll(async () => {
        await cleanDB()
      })

      it('returns true', async () => {
        await expect(mutate({ mutation: logout })).resolves.toEqual(
          expect.objectContaining({
            data: { logout: true },
            errors: undefined,
          }),
        )
      })

      it('stores the USER_LOGOUT event in the database', async () => {
        const userConatct = await UserContact.findOneOrFail({
          where: { email: 'bibi@bloxberg.de' },
          relations: ['user'],
        })
        await expect(DbEvent.find()).resolves.toContainEqual(
          expect.objectContaining({
            type: EventType.USER_LOGOUT,
            affectedUserId: userConatct.user.id,
            actingUserId: userConatct.user.id,
          }),
        )
      })
    })
  })

  describe('verifyLogin', () => {
    describe('unauthenticated', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        resetToken()
        await expect(query({ query: verifyLogin })).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('user exists but is not logged in', () => {
      beforeAll(async () => {
        await userFactory(testEnv, bibiBloxberg)
      })

      afterAll(async () => {
        await cleanDB()
      })

      it('throws an error', async () => {
        jest.clearAllMocks()
        resetToken()
        await expect(query({ query: verifyLogin })).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })

      describe('authenticated', () => {
        let user: User[]

        const variables = {
          email: 'bibi@bloxberg.de',
          password: 'Aa12345_',
        }

        beforeAll(async () => {
          await mutate({ mutation: login, variables })
          user = await User.find({ relations: ['userRole'] })
        })

        afterAll(() => {
          resetToken()
        })

        it('returns user object', async () => {
          await expect(query({ query: verifyLogin })).resolves.toEqual(
            expect.objectContaining({
              data: {
                verifyLogin: {
                  firstName: 'Bibi',
                  lastName: 'Bloxberg',
                  language: 'de',
                  creationAllowed: true,
                  klickTipp: {
                    newsletterState: false,
                  },
                  hasElopage: false,
                  publisherId: 1234,
                  role: null,
                },
              },
            }),
          )
        })

        it('stores the USER_LOGIN event in the database', async () => {
          await expect(DbEvent.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventType.USER_LOGIN,
              affectedUserId: user[0].id,
              actingUserId: user[0].id,
            }),
          )
        })
      })
    })
  })

  describe('forgotPassword', () => {
    const variables = { email: 'bibi@bloxberg.de' }
    const emailCodeRequestTime = CONFIG.EMAIL_CODE_REQUEST_TIME

    describe('user is not in DB', () => {
      describe('duration not expired', () => {
        it('returns true', async () => {
          await expect(mutate({ mutation: forgotPassword, variables })).resolves.toEqual(
            expect.objectContaining({
              data: {
                forgotPassword: true,
              },
            }),
          )
        })
      })
    })

    describe('user exists in DB', () => {
      beforeAll(async () => {
        await userFactory(testEnv, bobBaumeister)
      })

      afterAll(async () => {
        await cleanDB()
        CONFIG.EMAIL_CODE_REQUEST_TIME = emailCodeRequestTime
      })

      describe('duration not expired', () => {
        it('throws an error', async () => {
          await expect(
            mutate({ mutation: forgotPassword, variables: { email: 'bob@baumeister.de' } }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [
                new GraphQLError(
                  `Email already sent less than ${printTimeDuration(
                    CONFIG.EMAIL_CODE_REQUEST_TIME,
                  )} ago`,
                ),
              ],
            }),
          )
        })
      })

      describe('duration reset to 0', () => {
        it('returns true', async () => {
          CONFIG.EMAIL_CODE_REQUEST_TIME = 0
          await expect(
            mutate({ mutation: forgotPassword, variables: { email: 'bob@baumeister.de' } }),
          ).resolves.toEqual(
            expect.objectContaining({
              data: {
                forgotPassword: true,
              },
            }),
          )
        })

        it('sends reset password email', () => {
          expect(sendResetPasswordEmail).toBeCalledWith({
            firstName: 'Bob',
            lastName: 'der Baumeister',
            email: 'bob@baumeister.de',
            language: 'de',
            resetLink: expect.any(String),
            timeDurationObject: expect.objectContaining({
              hours: expect.any(Number),
              minutes: expect.any(Number),
            }),
          })
        })

        it('stores the EMAIL_FORGOT_PASSWORD event in the database', async () => {
          const userConatct = await UserContact.findOneOrFail({
            where: { email: 'bob@baumeister.de' },
            relations: ['user'],
          })
          await expect(DbEvent.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventType.EMAIL_FORGOT_PASSWORD,
              affectedUserId: userConatct.user.id,
              actingUserId: 0,
            }),
          )
        })
      })

      describe('request reset password again', () => {
        it('throws an error', async () => {
          CONFIG.EMAIL_CODE_REQUEST_TIME = emailCodeRequestTime
          await expect(
            mutate({ mutation: forgotPassword, variables: { email: 'bob@baumeister.de' } }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('Email already sent less than 10 minutes ago')],
            }),
          )
        })

        it('logs warning before throwing error', () => {
          expect(forgotPasswordLogger.warn).toBeCalledWith(
            'email already sent 0 minutes ago, min wait time: 10 minutes',
          )
        })
      })
    })
  })

  describe('queryOptIn', () => {
    let emailContact: UserContact

    beforeAll(async () => {
      await userFactory(testEnv, bobBaumeister)
      emailContact = await UserContact.findOneOrFail({ where: { email: bobBaumeister.email } })
    })

    afterAll(async () => {
      await cleanDB()
    })

    describe('wrong optin code', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        await expect(
          query({
            query: queryOptIn,
            variables: { email: 'bob@baumeister.de', optIn: 'not-valid' },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [
              // keep Whitspace in error message!
              new GraphQLError(`Could not find any entity of type "UserContact" matching: {
    "where": {
        "emailVerificationCode": "not-valid"
    }
}`),
            ],
          }),
        )
      })
    })

    describe('correct optin code', () => {
      it('returns true', async () => {
        await expect(
          query({
            query: queryOptIn,
            variables: {
              email: 'bob@baumeister.de',
              optIn: emailContact.emailVerificationCode.toString(),
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              queryOptIn: true,
            },
          }),
        )
      })
    })
  })

  describe('updateUserInfos', () => {
    describe('unauthenticated', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        resetToken()
        await expect(
          mutate({
            mutation: updateUserInfos,
            variables: {},
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated', () => {
      beforeAll(async () => {
        await userFactory(testEnv, bibiBloxberg)
        await mutate({
          mutation: login,
          variables: {
            email: 'bibi@bloxberg.de',
            password: 'Aa12345_',
          },
        })
      })

      afterAll(async () => {
        await cleanDB()
      })

      it('returns true', async () => {
        await expect(
          mutate({
            mutation: updateUserInfos,
            variables: {},
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              updateUserInfos: true,
            },
          }),
        )
      })

      describe('first-name, last-name and language', () => {
        it('updates the fields in DB', async () => {
          await mutate({
            mutation: updateUserInfos,
            variables: {
              firstName: 'Benjamin',
              lastName: 'Blümchen',
              locale: 'en',
            },
          })
          await expect(User.find()).resolves.toEqual([
            expect.objectContaining({
              firstName: 'Benjamin',
              lastName: 'Blümchen',
              language: 'en',
              gmsAllowed: false,
              gmsPublishName: PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS,
              gmsPublishLocation: GmsPublishLocationType.GMS_LOCATION_TYPE_APPROXIMATE,
            }),
          ])
        })

        it('stores the USER_INFO_UPDATE event in the database', async () => {
          const userConatct = await UserContact.findOneOrFail({
            where: { email: 'bibi@bloxberg.de' },
            relations: ['user'],
          })
          await expect(DbEvent.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventType.USER_INFO_UPDATE,
              affectedUserId: userConatct.user.id,
              actingUserId: userConatct.user.id,
            }),
          )
        })
      })

      describe('alias', () => {
        beforeEach(() => {
          jest.clearAllMocks()
        })

        describe('valid alias', () => {
          it('updates the user in DB', async () => {
            // Cleared first so this exercises taking a name rather than changing one;
            // changing is covered by its own cases.
            await User.update({ alias: 'BBB' }, { alias: () => 'NULL' })
            await mutate({
              mutation: updateUserInfos,
              variables: {
                alias: 'bibi_Bloxberg',
              },
            })
            await expect(User.find()).resolves.toEqual([
              expect.objectContaining({
                alias: 'bibi_Bloxberg',
                gmsAllowed: false,
                gmsPublishName: PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS,
                gmsPublishLocation: GmsPublishLocationType.GMS_LOCATION_TYPE_APPROXIMATE,
              }),
            ])
          })
        })
      })

      describe('gms attributes', () => {
        beforeEach(() => {
          jest.clearAllMocks()
        })

        describe('default settings', () => {
          it('updates the user in DB', async () => {
            await mutate({
              mutation: updateUserInfos,
              variables: {},
            })
            await expect(User.find()).resolves.toEqual([
              expect.objectContaining({
                gmsAllowed: false,
                gmsPublishName: PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS,
                gmsPublishLocation: GmsPublishLocationType.GMS_LOCATION_TYPE_APPROXIMATE,
              }),
            ])
          })
        })

        describe('individual settings', () => {
          it('updates the user in DB', async () => {
            await mutate({
              mutation: updateUserInfos,
              variables: {
                gmsAllowed: false,
                gmsPublishName: PublishNameType[PublishNameType.PUBLISH_NAME_FIRST_INITIAL],
                gmsPublishLocation:
                  GmsPublishLocationType[GmsPublishLocationType.GMS_LOCATION_TYPE_APPROXIMATE],
              },
            })
            await expect(User.find()).resolves.toEqual([
              expect.objectContaining({
                gmsAllowed: false,
                gmsPublishName: PublishNameType.PUBLISH_NAME_FIRST_INITIAL,
                gmsPublishLocation: GmsPublishLocationType.GMS_LOCATION_TYPE_APPROXIMATE,
              }),
            ])
          })
        })

        // Findable needs a place: the GMS cannot hold a member it cannot place, and migration
        // 0140 switched every member without one off. The member here has no location yet -
        // the case below gives them one, and there the same switch goes through.
        describe('findable without a location', () => {
          it('is refused with a code, and nothing of the save is written', async () => {
            const [before] = await User.find()
            expect(before.location).toBeNull()
            jest.clearAllMocks()

            await expect(
              mutate({
                mutation: updateUserInfos,
                variables: { gmsAllowed: true, aboutMe: 'Ich baue Moebel aus Altholz.' },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('GMS_LOCATION_REQUIRED')],
              }),
            )

            const after = await User.findOneOrFail({ where: { id: before.id } })
            expect(after.gmsAllowed).toBe(before.gmsAllowed)
            expect(after.aboutMe).toBe(before.aboutMe)
            expect(updateUserInfosLogger.warn).toBeCalledWith(
              'refused to switch findable on without a location',
            )
          })

          // Only the switch from off to on is asked. A member left findable without a place,
          // before this rule, still saves the rest - with the setting sent along as it is.
          it('lets a member already findable without one save the rest', async () => {
            const [member] = await User.find()
            await User.update({ id: member.id }, { gmsAllowed: true })

            const result = await mutate({
              mutation: updateUserInfos,
              variables: { gmsAllowed: true, aboutMe: 'Ich repariere Fahrraeder.' },
            })

            expect(result.errors).toBeUndefined()
            const after = await User.findOneOrFail({ where: { id: member.id } })
            expect(after.aboutMe).toBe('Ich repariere Fahrraeder.')
            expect(after.gmsAllowed).toBe(true)
            expect(after.location).toBeNull()
          })
        })

        describe('with gms location', () => {
          const loc = new Location()
          loc.longitude = 9.573224
          loc.latitude = 49.679437
          it('updates the user in DB', async () => {
            await mutate({
              mutation: updateUserInfos,
              variables: {
                gmsAllowed: true,
                gmsPublishName: PublishNameType[PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS],
                gmsLocation: loc,
                gmsPublishLocation:
                  GmsPublishLocationType[GmsPublishLocationType.GMS_LOCATION_TYPE_EXACT],
              },
            })
            await expect(User.find()).resolves.toEqual([
              expect.objectContaining({
                gmsAllowed: true,
                gmsPublishName: PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS,
                location: Location2Point(loc),
                gmsPublishLocation: GmsPublishLocationType.GMS_LOCATION_TYPE_EXACT,
              }),
            ])
          })
        })
      })

      // The one setting this delivery stores, read back from the row. It needs its own
      // test because nothing else covers the write: the registration test above asserts
      // avatarVisibleToMembers is true on a fresh account, which is the column DEFAULT
      // and stays true whether or not the resolver ever writes the field. Drop the field
      // from the write object in updateUserInfos and only these cases go red.
      // Ordered off - untouched - on, so the block leaves the shared row the way it found
      // it. Later cases in this file read other columns of the same member, and a fixture
      // one test leaves changed is a failure the next test gets blamed for.
      describe('whether the picture is visible to other members', () => {
        it('stores the member turning it off', async () => {
          await mutate({
            mutation: updateUserInfos,
            variables: { avatarVisibleToMembers: false },
          })
          await expect(User.find()).resolves.toEqual([
            expect.objectContaining({ avatarVisibleToMembers: false }),
          ])
        })

        // False and "not sent" are different things, and a boolean is where they are most
        // easily confused: a check on the value rather than on its presence would read a
        // stored no as nothing to do, and the next save that says nothing about the
        // picture would put the member back on show without anybody touching the switch.
        it('leaves a stored no alone when a later save does not mention it', async () => {
          await mutate({ mutation: updateUserInfos, variables: {} })
          await expect(User.find()).resolves.toEqual([
            expect.objectContaining({ avatarVisibleToMembers: false }),
          ])
        })

        it('stores the member turning it back on', async () => {
          await mutate({
            mutation: updateUserInfos,
            variables: { avatarVisibleToMembers: true },
          })
          await expect(User.find()).resolves.toEqual([
            expect.objectContaining({ avatarVisibleToMembers: true }),
          ])
        })
      })

      describe('language is not valid', () => {
        it('throws an error', async () => {
          jest.clearAllMocks()
          await expect(
            mutate({
              mutation: updateUserInfos,
              variables: {
                locale: 'not-valid',
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('Given language is not a valid language or not supported')],
            }),
          )
        })

        it('logs the error found', () => {
          expect(updateUserInfosLogger.warn).toBeCalledWith(
            'try to set unsupported language',
            'not-valid',
          )
        })
      })

      describe('password', () => {
        describe('wrong old password', () => {
          it('throws an error', async () => {
            jest.clearAllMocks()
            await expect(
              mutate({
                mutation: updateUserInfos,
                variables: {
                  password: 'wrong password',
                  passwordNew: 'Aa12345_',
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('Old password is invalid')],
              }),
            )
          })

          it('logs if logger is in debug mode', () => {
            expect(updateUserInfosLogger.debug).toBeCalledWith(`old password is invalid`)
          })
        })

        describe('invalid new password', () => {
          it('throws an error', async () => {
            jest.clearAllMocks()
            await expect(
              mutate({
                mutation: updateUserInfos,
                variables: {
                  password: 'Aa12345_',
                  passwordNew: 'Aa12345',
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [
                  new GraphQLError(
                    'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character, and no spaces!',
                  ),
                ],
              }),
            )
          })

          it('logs warning', () => {
            expect(updateUserInfosLogger.warn).toBeCalledWith('try to set invalid password')
          })
        })

        describe('correct old and new password', () => {
          it('returns true', async () => {
            await expect(
              mutate({
                mutation: updateUserInfos,
                variables: {
                  password: 'Aa12345_',
                  passwordNew: 'Bb12345_',
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: { updateUserInfos: true },
              }),
            )
          })

          it('can login with new password', async () => {
            await expect(
              mutate({
                mutation: login,
                variables: {
                  email: 'bibi@bloxberg.de',
                  password: 'Bb12345_',
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  login: expect.objectContaining({
                    firstName: 'Benjamin',
                  }),
                },
              }),
            )
          })

          it('cannot login with old password', async () => {
            await expect(
              mutate({
                mutation: login,
                variables: {
                  email: 'bibi@bloxberg.de',
                  password: 'Aa12345_',
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('No user with this credentials')],
              }),
            )
          })

          it('log warning', () => {
            expect(loginLogger.warn).toBeCalledWith('login failed, wrong password')
          })
        })
      })
    })
  })

  describe('searchAdminUsers', () => {
    describe('unauthenticated', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        resetToken()
        await expect(mutate({ mutation: searchAdminUsers })).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated', () => {
      let admin: User

      beforeAll(async () => {
        await userFactory(testEnv, bibiBloxberg)
        admin = await userFactory(testEnv, peterLustig)
        await mutate({
          mutation: login,
          variables: {
            email: 'bibi@bloxberg.de',
            password: 'Aa12345_',
          },
        })
      })

      it('finds peter@lustig.de', async () => {
        await expect(mutate({ mutation: searchAdminUsers })).resolves.toEqual(
          expect.objectContaining({
            data: {
              searchAdminUsers: {
                userCount: 1,
                userList: expect.arrayContaining([
                  // The type carries only the alias since NU-021, and this seed user has
                  // none -- so the gradidoID stands in (NU-018). Pinned against the
                  // user's own identifier rather than `any(String)`: an admin who reads
                  // as an empty row is precisely what a seeded environment produced, and
                  // only naming the value proves which fallback ran.
                  expect.objectContaining({
                    alias: admin.gradidoID,
                    role: RoleNames.ADMIN,
                  }),
                ]),
              },
            },
          }),
        )
      })
    })
  })

  describe('password encryption type', () => {
    describe('user just registered', () => {
      let bibi: User

      it('has password type gradido id', async () => {
        const users = await User.find()
        bibi = users[1]

        expect(bibi).toEqual(
          expect.objectContaining({
            password: (await encryptPassword(bibi, 'Aa12345_')).toString(),
            passwordEncryptionType: PasswordEncryptionType.GRADIDO_ID,
          }),
        )
      })
    })

    describe('user has encryption type email', () => {
      const variables = {
        email: 'bibi@bloxberg.de',
        password: 'Aa12345_',
        publisherId: 1234,
      }

      let bibi: User
      beforeAll(async () => {
        const usercontact = await UserContact.findOneOrFail({
          where: { email: 'bibi@bloxberg.de' },
          relations: ['user'],
        })
        bibi = usercontact.user
        bibi.passwordEncryptionType = PasswordEncryptionType.EMAIL
        bibi.password = await encryptPassword(
          {
            passwordEncryptionType: PasswordEncryptionType.EMAIL,
            emailContact: { email: 'bibi@bloxberg.de' },
          },
          'Aa12345_',
        )

        await bibi.save()
      })

      it('changes to gradidoID on login', async () => {
        await mutate({ mutation: login, variables })

        const usercontact = await UserContact.findOneOrFail({
          where: { email: 'bibi@bloxberg.de' },
          relations: ['user'],
        })
        bibi = usercontact.user

        expect(bibi).toEqual(
          expect.objectContaining({
            firstName: 'Bibi',
            password: (await encryptPassword(bibi, 'Aa12345_')).toString(),
            passwordEncryptionType: PasswordEncryptionType.GRADIDO_ID,
          }),
        )
      })

      it('can login after password change', async () => {
        resetToken()
        expect(await mutate({ mutation: login, variables })).toEqual(
          expect.objectContaining({
            data: {
              login: {
                alias: 'BBB',
                emailChecked: true,
                firstName: 'Bibi',
                gmsAllowed: false,
                gmsPublishLocation: 'GMS_LOCATION_TYPE_APPROXIMATE',
                gmsPublishName: 'PUBLISH_NAME_ALIAS_OR_INITALS',
                gradidoID: expect.any(String),
                hasElopage: false,
                hideAmountGDD: false,
                hideAmountGDT: false,
                humhubAllowed: true,
                humhubPublishName: 'PUBLISH_NAME_ALIAS_OR_INITALS',
                klickTipp: {
                  newsletterState: false,
                },
                language: 'de',
                lastName: 'Bloxberg',
                publisherId: 1234,
                role: null,
                userLocation: null,
                // Same three as in the login block above: this literal lists every
                // selected field, so it has to grow with the document.
                avatar: null,
                avatarVisibleToMembers: true,
                creationAllowed: true,
                transfersInChat: true,
              },
            },
          }),
        )
      })
    })
  })

  describe('set user role', () => {
    // TODO: there is a test not cleaning up after itself! Fix it!
    beforeAll(async () => {
      await cleanDB()
      resetToken()
    })

    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(
          mutate({
            mutation: setUserRole,
            variables: { userId: 1, role: RoleNames.ADMIN },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated', () => {
      describe('with user rights', () => {
        beforeAll(async () => {
          user = await userFactory(testEnv, bibiBloxberg)
          await mutate({
            mutation: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        it('returns an error', async () => {
          await expect(
            mutate({
              mutation: setUserRole,
              variables: { userId: user.id + 1, role: RoleNames.ADMIN },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('with moderator rights', () => {
        beforeAll(async () => {
          user = await userFactory(testEnv, bibiBloxberg)
          admin = await userFactory(testEnv, peterLustig)

          // set Moderator-Role for Peter
          const userRole = await UserRole.findOneOrFail({ where: { userId: admin.id } })
          userRole.role = RoleNames.MODERATOR
          userRole.userId = admin.id
          await UserRole.save(userRole)

          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        it('returns an error', async () => {
          await expect(
            mutate({
              mutation: setUserRole,
              variables: { userId: user.id, role: RoleNames.ADMIN },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('with admin rights', () => {
        beforeAll(async () => {
          user = await userFactory(testEnv, bibiBloxberg)
          admin = await userFactory(testEnv, peterLustig)
          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        it('returns user with new moderator-role', async () => {
          const result = await mutate({
            mutation: setUserRole,
            variables: { userId: user.id, role: RoleNames.MODERATOR },
          })
          expect(result).toEqual(
            expect.objectContaining({
              data: {
                setUserRole: RoleNames.MODERATOR,
              },
            }),
          )
        })

        describe('user to get a new role does not exist', () => {
          afterAll(async () => {
            await cleanDB()
            resetToken()
          })

          it('throws an error', async () => {
            jest.clearAllMocks()
            await expect(
              mutate({
                mutation: setUserRole,
                variables: { userId: admin.id + 1, role: RoleNames.ADMIN },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('Could not find user with given ID')],
              }),
            )
          })

          it('logs the error thrown', () => {
            expect(logErrorLogger.error).toBeCalledWith(
              'Could not find user with given ID',
              admin.id + 1,
            )
          })
        })

        describe('change role with success', () => {
          beforeAll(async () => {
            user = await userFactory(testEnv, bibiBloxberg)
            admin = await userFactory(testEnv, peterLustig)
            await mutate({
              mutation: login,
              variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
            })
          })

          afterAll(async () => {
            await cleanDB()
            resetToken()
          })

          describe('user gets new role', () => {
            describe('to admin', () => {
              it('returns admin-rolename', async () => {
                const result = await mutate({
                  mutation: setUserRole,
                  variables: { userId: user.id, role: RoleNames.ADMIN },
                })
                expect(result.errors).toBeUndefined()
                expect(result).toEqual(
                  expect.objectContaining({
                    data: {
                      setUserRole: RoleNames.ADMIN,
                    },
                  }),
                )
              })

              it('stores the ADMIN_USER_ROLE_SET event in the database', async () => {
                await expect(DbEvent.find()).resolves.toContainEqual(
                  expect.objectContaining({
                    type: EventType.ADMIN_USER_ROLE_SET,
                    affectedUserId: user.id,
                    actingUserId: admin.id,
                  }),
                )
              })
            })

            describe('to moderator', () => {
              it('returns date string', async () => {
                const result = await mutate({
                  mutation: setUserRole,
                  variables: { userId: user.id, role: RoleNames.MODERATOR },
                })
                expect(result.errors).toBeUndefined()
                expect(result).toEqual(
                  expect.objectContaining({
                    data: {
                      setUserRole: RoleNames.MODERATOR,
                    },
                  }),
                )
                expect(new Date(result.data.setUserRole)).toEqual(expect.any(Date))
              })

              // ADMIN first, MODERATOR now: the second grant changed the member's one row
              // instead of adding a second (dbUpsertUserRole on the unique user_id, 0135).
              it('keeps exactly one role row for the member', async () => {
                const rows = await UserRole.find({ where: { userId: user.id } })
                expect(rows).toHaveLength(1)
                expect(rows[0].role).toBe(RoleNames.MODERATOR)
              })

              it('stores the ADMIN_USER_ROLE_SET event in the database', async () => {
                await expect(DbEvent.find()).resolves.toContainEqual(
                  expect.objectContaining({
                    type: EventType.ADMIN_USER_ROLE_SET,
                    affectedUserId: user.id,
                    actingUserId: admin.id,
                  }),
                )
              })
            })

            describe('to usual user', () => {
              // ⛔ `errors` asserted, not only `data`. The field is nullable, so an exception
              // in the resolver ALSO answers `setUserRole: null` -- and it did: the removal
              // read `[][0].role` and threw after the role was already gone, while this test,
              // checking `data` alone, stayed green.
              it('returns null, and no error', async () => {
                const result: any = await mutate({
                  mutation: setUserRole,
                  variables: { userId: user.id, role: null },
                })
                expect(result.errors).toBeUndefined()
                expect(result.data).toEqual({ setUserRole: null })
              })

              it('leaves the member without a role row', async () => {
                await expect(UserRole.find({ where: { userId: user.id } })).resolves.toEqual([])
              })
            })
          })
        })

        describe('change role with error', () => {
          beforeAll(async () => {
            user = await userFactory(testEnv, bibiBloxberg)
            admin = await userFactory(testEnv, peterLustig)
            await mutate({
              mutation: login,
              variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
            })
          })

          afterAll(async () => {
            await cleanDB()
            resetToken()
          })

          describe('his own role', () => {
            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({ mutation: setUserRole, variables: { userId: admin.id, role: null } }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Administrator can not change his own role')],
                }),
              )
            })
            it('logs the error thrown', () => {
              expect(logErrorLogger.error).toBeCalledWith(
                'Administrator can not change his own role',
              )
            })
          })

          describe('to not allowed role', () => {
            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({
                  mutation: setUserRole,
                  variables: { userId: user.id, role: 'unknown rolename' },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [
                    new GraphQLError(
                      'Variable "$role" got invalid value "unknown rolename"; Value "unknown rolename" does not exist in "RoleNames" enum.',
                    ),
                  ],
                }),
              )
            })
          })

          // RoleNames also carries the roles that are no row: USER is the absence of a role,
          // UNAUTHORIZED and DLT_CONNECTOR only exist on a request. The admin form used to send
          // USER to take a role away, and it was stored. The variable carries the enum's GraphQL
          // name, the resolver gets its value (DLT_CONNECTOR arrives as 'DLT_CONNECTOR_ROLE').
          describe.each([
            ['USER', RoleNames.USER],
            ['UNAUTHORIZED', RoleNames.UNAUTHORIZED],
            ['DLT_CONNECTOR', RoleNames.DLT_CONNECTOR],
          ])('to %s', (name, value) => {
            it('throws an error and writes no role row', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({ mutation: setUserRole, variables: { userId: user.id, role: name } }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Role can not be assigned=')],
                }),
              )
              await expect(UserRole.find({ where: { userId: user.id } })).resolves.toEqual([])
              expect(logErrorLogger.error).toBeCalledWith('Role can not be assigned=', value)
            })
          })

          describe('user has already role to be set', () => {
            describe('to admin', () => {
              it('throws an error', async () => {
                jest.clearAllMocks()
                await mutate({
                  mutation: setUserRole,
                  variables: { userId: user.id, role: RoleNames.ADMIN },
                })
                await expect(
                  mutate({
                    mutation: setUserRole,
                    variables: { userId: user.id, role: RoleNames.ADMIN },
                  }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [new GraphQLError('User already has role=')],
                  }),
                )
              })

              it('logs the error thrown', () => {
                expect(logErrorLogger.error).toBeCalledWith(
                  'User already has role=',
                  RoleNames.ADMIN,
                )
              })
            })

            describe('to moderator', () => {
              it('throws an error', async () => {
                jest.clearAllMocks()
                await mutate({
                  mutation: setUserRole,
                  variables: { userId: user.id, role: RoleNames.MODERATOR },
                })
                await expect(
                  mutate({
                    mutation: setUserRole,
                    variables: { userId: user.id, role: RoleNames.MODERATOR },
                  }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [new GraphQLError('User already has role=')],
                  }),
                )
              })

              it('logs the error thrown', () => {
                expect(logErrorLogger.error).toBeCalledWith(
                  'User already has role=',
                  RoleNames.MODERATOR,
                )
              })
            })

            describe('to usual user', () => {
              it('throws an error', async () => {
                jest.clearAllMocks()
                await mutate({
                  mutation: setUserRole,
                  variables: { userId: user.id, role: null },
                })
                await expect(
                  mutate({ mutation: setUserRole, variables: { userId: user.id, role: null } }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [new GraphQLError('User is already an usual user')],
                  }),
                )
              })

              it('logs the error thrown', () => {
                expect(logErrorLogger.error).toBeCalledWith('User is already an usual user')
              })
            })
          })
        })
      })
    })
  })

  describe('delete user', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(mutate({ mutation: deleteUser, variables: { userId: 1 } })).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated', () => {
      describe('without admin rights', () => {
        beforeAll(async () => {
          user = await userFactory(testEnv, bibiBloxberg)
          await mutate({
            mutation: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        it('returns an error', async () => {
          await expect(
            mutate({ mutation: deleteUser, variables: { userId: user.id + 1 } }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('with admin rights', () => {
        beforeAll(async () => {
          admin = await userFactory(testEnv, peterLustig)
          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        describe('user to be deleted does not exist', () => {
          it('throws an error', async () => {
            jest.clearAllMocks()
            await expect(
              mutate({ mutation: deleteUser, variables: { userId: admin.id + 1 } }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('Could not find user with given ID')],
              }),
            )
          })

          it('logs the error thrown', () => {
            expect(logErrorLogger.error).toBeCalledWith(
              'Could not find user with given ID',
              admin.id + 1,
            )
          })
        })

        describe('delete self', () => {
          it('throws an error', async () => {
            jest.clearAllMocks()
            await expect(
              mutate({ mutation: deleteUser, variables: { userId: admin.id } }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('Moderator can not delete his own account')],
              }),
            )
          })

          it('logs the error thrown', () => {
            expect(logErrorLogger.error).toBeCalledWith('Moderator can not delete his own account')
          })
        })

        describe('delete with success', () => {
          beforeAll(async () => {
            user = await userFactory(testEnv, bibiBloxberg)
          })

          it('returns date string', async () => {
            const result = await mutate({ mutation: deleteUser, variables: { userId: user.id } })
            expect(result).toEqual(
              expect.objectContaining({
                data: {
                  deleteUser: expect.any(String),
                },
              }),
            )
            expect(new Date(result.data.deleteUser)).toEqual(expect.any(Date))
          })

          it('marks the account DELETED beside deleted_at', async () => {
            await expect(
              User.findOneOrFail({ where: { id: user.id }, withDeleted: true }),
            ).resolves.toMatchObject({
              deletedAt: expect.any(Date),
              accountState: AccountState.DELETED,
            })
          })

          it('stores the ADMIN_USER_DELETE event in the database', async () => {
            const userConatct = await UserContact.findOneOrFail({
              where: { email: 'bibi@bloxberg.de' },
              relations: ['user'],
              withDeleted: true,
            })
            const adminConatct = await UserContact.findOneOrFail({
              where: { email: 'peter@lustig.de' },
              relations: ['user'],
            })
            await expect(DbEvent.find()).resolves.toContainEqual(
              expect.objectContaining({
                type: EventType.ADMIN_USER_DELETE,
                affectedUserId: userConatct.user.id,
                actingUserId: adminConatct.user.id,
              }),
            )
          })

          describe('delete deleted user', () => {
            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({ mutation: deleteUser, variables: { userId: user.id } }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Could not find user with given ID')],
                }),
              )
            })

            it('logs the error thrown', () => {
              expect(logErrorLogger.error).toBeCalledWith(
                'Could not find user with given ID',
                user.id,
              )
            })
          })
        })
      })
    })
  })

  ///

  describe('sendActivationEmail', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(
          mutate({ mutation: sendActivationEmail, variables: { email: 'bibi@bloxberg.de' } }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated', () => {
      describe('without admin rights', () => {
        beforeAll(async () => {
          user = await userFactory(testEnv, bibiBloxberg)
          await mutate({
            mutation: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        it('returns an error', async () => {
          await expect(
            mutate({ mutation: sendActivationEmail, variables: { email: 'bibi@bloxberg.de' } }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('with admin rights', () => {
        beforeAll(async () => {
          admin = await userFactory(testEnv, peterLustig)
          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        describe('user does not exist', () => {
          it('throws an error', async () => {
            jest.clearAllMocks()
            await expect(
              mutate({ mutation: sendActivationEmail, variables: { email: 'INVALID' } }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('No user with this credentials')],
              }),
            )
          })

          it('logs the error thrown', () => {
            expect(findUserByEmailLogger.warn).toBeCalledWith(
              'findUserByEmail failed, user with email=invalid not found',
            )
          })
        })

        describe('user is deleted', () => {
          it('throws an error', async () => {
            jest.clearAllMocks()
            await userFactory(testEnv, stephenHawking)
            await expect(
              mutate({ mutation: sendActivationEmail, variables: { email: 'stephen@hawking.uk' } }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('User with given email contact is deleted')],
              }),
            )
          })

          it('log warning', () => {
            expect(sendActivationEmailLogger.warn).toBeCalledWith(
              'call for activation of deleted user',
            )
          })
        })

        describe('sendActivationEmail with success', () => {
          beforeAll(async () => {
            user = await userFactory(testEnv, bibiBloxberg)
          })

          it('returns true', async () => {
            const result = await mutate({
              mutation: sendActivationEmail,
              variables: { email: 'bibi@bloxberg.de' },
            })
            expect(result).toEqual(
              expect.objectContaining({
                data: {
                  sendActivationEmail: true,
                },
              }),
            )
          })

          it('sends an account activation email', async () => {
            const userContact = await UserContact.findOneOrFail({
              where: { email: 'bibi@bloxberg.de' },
              relations: ['user'],
            })
            const activationLink = `${
              CONFIG.EMAIL_LINK_SETPASSWORD
            }${userContact.emailVerificationCode.toString()}`
            expect(sendAccountActivationEmail).toBeCalledWith({
              firstName: 'Bibi',
              lastName: 'Bloxberg',
              email: 'bibi@bloxberg.de',
              language: 'de',
              activationLink,
              timeDurationObject: expect.objectContaining({
                hours: expect.any(Number),
                minutes: expect.any(Number),
              }),
            })
          })

          it('stores the EMAIL_ADMIN_CONFIRMATION event in the database', async () => {
            const userContact = await UserContact.findOneOrFail({
              where: { email: 'bibi@bloxberg.de' },
              relations: ['user'],
            })
            await expect(DbEvent.find()).resolves.toContainEqual(
              expect.objectContaining({
                type: EventType.EMAIL_ADMIN_CONFIRMATION,
                affectedUserId: userContact.user.id,
                actingUserId: admin.id,
              }),
            )
          })
        })
      })
    })
  })

  describe('unDelete user', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(mutate({ mutation: unDeleteUser, variables: { userId: 1 } })).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated', () => {
      describe('without admin rights', () => {
        beforeAll(async () => {
          user = await userFactory(testEnv, bibiBloxberg)
          await mutate({
            mutation: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        it('returns an error', async () => {
          await expect(
            mutate({ mutation: unDeleteUser, variables: { userId: user.id + 1 } }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('with admin rights', () => {
        beforeAll(async () => {
          admin = await userFactory(testEnv, peterLustig)
          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        describe('user to be undelete does not exist', () => {
          it('throws an error', async () => {
            jest.clearAllMocks()
            await expect(
              mutate({ mutation: unDeleteUser, variables: { userId: admin.id + 1 } }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('Could not find user with given ID')],
              }),
            )
          })

          it('logs the error thrown', () => {
            expect(logErrorLogger.error).toBeCalledWith(
              'Could not find user with given ID',
              admin.id + 1,
            )
          })
        })

        describe('user to undelete is not deleted', () => {
          beforeAll(async () => {
            user = await userFactory(testEnv, bibiBloxberg)
          })

          it('throws an error', async () => {
            jest.clearAllMocks()
            await expect(
              mutate({ mutation: unDeleteUser, variables: { userId: user.id } }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('User is not deleted')],
              }),
            )
          })

          it('logs the error thrown', () => {
            expect(logErrorLogger.error).toBeCalledWith('User is not deleted')
          })

          describe('undelete deleted user', () => {
            beforeAll(async () => {
              await mutate({ mutation: deleteUser, variables: { userId: user.id } })
            })

            it('returns null', async () => {
              await expect(
                mutate({ mutation: unDeleteUser, variables: { userId: user.id } }),
              ).resolves.toEqual(
                expect.objectContaining({
                  data: { unDeleteUser: null },
                }),
              )
            })

            // The state DELETED replaced, worked out again: bibi's address is confirmed.
            it('brings the account back ACTIVATED', async () => {
              await expect(User.findOneOrFail({ where: { id: user.id } })).resolves.toMatchObject({
                deletedAt: null,
                accountState: AccountState.ACTIVATED,
              })
            })

            it('stores the ADMIN_USER_UNDELETE event in the database', async () => {
              const userConatct = await UserContact.findOneOrFail({
                where: { email: 'bibi@bloxberg.de' },
                relations: ['user'],
              })
              const adminConatct = await UserContact.findOneOrFail({
                where: { email: 'peter@lustig.de' },
                relations: ['user'],
              })
              await expect(DbEvent.find()).resolves.toContainEqual(
                expect.objectContaining({
                  type: EventType.ADMIN_USER_UNDELETE,
                  affectedUserId: userConatct.user.id,
                  actingUserId: adminConatct.user.id,
                }),
              )
            })
          })
        })
      })
    })
  })

  describe('search users', () => {
    const variablesWithoutTextAndFilters = {
      query: '',
      currentPage: 1,
      pageSize: 25,
      filters: null,
    }

    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(
          query({
            query: searchUsers,
            variables: {
              ...variablesWithoutTextAndFilters,
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated', () => {
      describe('without admin rights', () => {
        beforeAll(async () => {
          user = await userFactory(testEnv, bibiBloxberg)
          await mutate({
            mutation: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        it('returns an error', async () => {
          await expect(
            query({
              query: searchUsers,
              variables: {
                ...variablesWithoutTextAndFilters,
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('with admin rights', () => {
        const allUsers = {
          bibi: expect.objectContaining({
            email: 'bibi@bloxberg.de',
          }),
          garrick: expect.objectContaining({
            email: 'garrick@ollivander.com',
          }),
          peter: expect.objectContaining({
            email: 'peter@lustig.de',
          }),
          stephen: expect.objectContaining({
            email: 'stephen@hawking.uk',
          }),
        }

        beforeAll(async () => {
          jest.clearAllMocks()
          admin = await userFactory(testEnv, peterLustig)
          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })

          await userFactory(testEnv, bibiBloxberg)
          await userFactory(testEnv, stephenHawking)
          await userFactory(testEnv, garrickOllivander)
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        describe('without any filters', () => {
          it('finds all users', async () => {
            await expect(
              query({
                query: searchUsers,
                variables: {
                  ...variablesWithoutTextAndFilters,
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  searchUsers: {
                    userCount: 4,
                    userList: expect.arrayContaining(objectValuesToArray(allUsers)),
                  },
                },
              }),
            )
          })
        })

        describe('all filters are null', () => {
          it('finds all users', async () => {
            await expect(
              query({
                query: searchUsers,
                variables: {
                  ...variablesWithoutTextAndFilters,
                  filters: {
                    byActivated: null,
                    byDeleted: null,
                  },
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  searchUsers: {
                    userCount: 4,
                    userList: expect.arrayContaining(objectValuesToArray(allUsers)),
                  },
                },
              }),
            )
          })
        })

        describe('filter by unchecked email', () => {
          it('finds only users with unchecked email', async () => {
            await expect(
              query({
                query: searchUsers,
                variables: {
                  ...variablesWithoutTextAndFilters,
                  filters: {
                    byActivated: false,
                    byDeleted: null,
                  },
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  searchUsers: {
                    userCount: 1,
                    userList: expect.arrayContaining([allUsers.garrick]),
                  },
                },
              }),
            )
          })
        })

        describe('filter by deleted users', () => {
          it('finds only users with deleted account', async () => {
            await expect(
              query({
                query: searchUsers,
                variables: {
                  ...variablesWithoutTextAndFilters,
                  filters: {
                    byActivated: null,
                    byDeleted: true,
                  },
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  searchUsers: {
                    userCount: 1,
                    userList: expect.arrayContaining([allUsers.stephen]),
                  },
                },
              }),
            )
          })
        })

        describe('filter by deleted account and unchecked email', () => {
          it('finds no users', async () => {
            await expect(
              query({
                query: searchUsers,
                variables: {
                  ...variablesWithoutTextAndFilters,
                  filters: {
                    byActivated: false,
                    byDeleted: true,
                  },
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  searchUsers: {
                    userCount: 0,
                    userList: [],
                  },
                },
              }),
            )
          })
        })

        // Every name is the member's own row in user_aliases, the current one and the ones
        // they held before, and the search reads them all.
        describe('by username', () => {
          const garrickRow = { email: 'garrick@ollivander.com' }

          beforeAll(async () => {
            const garrick = await UserContact.findOneOrFail({
              where: { email: 'garrick@ollivander.com' },
              relations: ['user'],
            })
            const taken = await dbInsertUserAlias({
              userId: garrick.user.id,
              alias: 'wand-maker',
              origin: ALIAS_ORIGIN_CHOSEN,
            })
            expect(taken.success).toBe(true)
            await User.update({ id: garrick.user.id }, { alias: 'wand-maker' })
          })

          it('finds the member who owns a name containing the text', async () => {
            await expect(
              query({
                query: searchUsers,
                variables: {
                  ...variablesWithoutTextAndFilters,
                  query: 'd-mak',
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  searchUsers: {
                    userCount: 1,
                    // The row carries the name, so the table can show why it is there.
                    userList: [expect.objectContaining({ ...garrickRow, alias: 'wand-maker' })],
                  },
                },
              }),
            )
          })

          it('keeps the filters: a name does not bring back somebody the filter excludes', async () => {
            await expect(
              query({
                query: searchUsers,
                variables: {
                  ...variablesWithoutTextAndFilters,
                  query: 'd-mak',
                  filters: { byActivated: null, byDeleted: true },
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  searchUsers: {
                    userCount: 0,
                    userList: [],
                  },
                },
              }),
            )
          })
        })
      })
    })
  })

  describe('user', () => {
    let homeCom1: DbCommunity
    let foreignCom1: DbCommunity

    beforeAll(async () => {
      homeCom1 = DbCommunity.create()
      homeCom1.foreign = false
      homeCom1.url = 'http://localhost/api'
      homeCom1.publicKey = Buffer.from('publicKey-HomeCommunity')
      homeCom1.privateKey = Buffer.from('privateKey-HomeCommunity')
      homeCom1.communityUuid = uuidv4() // 'HomeCom-UUID'
      homeCom1.authenticatedAt = new Date()
      homeCom1.name = 'HomeCommunity-name'
      homeCom1.description = 'HomeCommunity-description'
      homeCom1.creationDate = new Date()
      await DbCommunity.insert(homeCom1)

      foreignCom1 = DbCommunity.create()
      foreignCom1.foreign = true
      foreignCom1.url = 'http://stage-2.gradido.net/api'
      foreignCom1.publicKey = Buffer.from('publicKey-stage-2_Community')
      foreignCom1.privateKey = Buffer.from('privateKey-stage-2_Community')
      foreignCom1.communityUuid = uuidv4() // 'Stage2-Com-UUID'
      foreignCom1.authenticatedAt = new Date()
      foreignCom1.name = 'Stage-2_Community-name'
      foreignCom1.description = 'Stage-2_Community-description'
      foreignCom1.creationDate = new Date()
      await DbCommunity.insert(foreignCom1)
    })

    afterAll(async () => {
      await cleanDB()
    })

    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe('unauthenticated', () => {
      it('throws and logs "401 Unauthorized" error', async () => {
        await expect(
          query({
            query: userQuery,
            variables: {
              identifier: 'identifier',
              communityIdentifier: 'community identifier',
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
        expect(logErrorLogger.error).toBeCalledWith('401 Unauthorized')
      })
    })
  })

  // The switch for the transfers in the conversations and the mail about one received
  // (Einstellungen › Nachrichten, Bernd, 28.09.2026). Stored from updateUserInfos, handed to its
  // owner, and to nobody else: `user()` hands out any member by alias to anyone logged in.
  describe('the switch for the transfers in the conversations', () => {
    let homeCom: DbCommunity
    let owner: User

    beforeAll(async () => {
      await cleanDB()
      homeCom = await writeHomeCommunityEntry()
      owner = await userFactory(testEnv, bibiBloxberg)
      await userFactory(testEnv, bobBaumeister)
      await mutate({
        mutation: login,
        variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
      })
    })

    afterAll(async () => {
      await cleanDB()
    })

    const stored = async () =>
      (await User.findOneOrFail({ where: { id: owner.id } })).transfersInChat

    it('is on for a new account -- the column’s default', async () => {
      expect(await stored()).toBe(true)
    })

    // Ordered off - untouched - on, as for the picture's switch: false and "not sent" are
    // different things, and a later save that says nothing must leave a stored no alone.
    it('stores the member turning it off', async () => {
      const res: any = await mutate({
        mutation: updateUserInfos,
        variables: { transfersInChat: false },
      })
      expect(res.errors).toBeUndefined()
      expect(await stored()).toBe(false)
    })

    it('leaves a stored no alone when a later save does not mention it', async () => {
      await mutate({ mutation: updateUserInfos, variables: {} })
      expect(await stored()).toBe(false)
    })

    it('shows the member their own setting', async () => {
      const res: any = await query({ query: verifyLoginTransfersInChat })
      expect(res.data.verifyLogin.transfersInChat).toBe(false)
    })

    it('hides the setting from another logged-in member', async () => {
      await mutate({
        mutation: login,
        variables: { email: 'bob@baumeister.de', password: 'Aa12345_' },
      })
      const res: any = await query({
        query: userTransfersInChat,
        variables: { identifier: owner.gradidoID, communityIdentifier: homeCom.communityUuid },
      })
      // The member is found -- only the field is withheld.
      expect(res.data.user.gradidoID).toBe(owner.gradidoID)
      expect(res.data.user.transfersInChat).toBeNull()
    })

    it('stores the member turning it back on', async () => {
      await mutate({
        mutation: login,
        variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
      })
      await mutate({ mutation: updateUserInfos, variables: { transfersInChat: true } })
      expect(await stored()).toBe(true)
    })
  })

  // aboutMe is a member's own words. The User ObjectType is shared, and `user()` hands
  // out any member by alias to anyone logged in — so without the field resolver the text
  // of members who never allowed the GMS would be readable by everyone.
  describe('aboutMe visibility', () => {
    const ABOUT_ME_TEXT = 'Ich fliege gern und helfe beim Zaubern.'
    let homeCom: DbCommunity
    let author: User

    beforeAll(async () => {
      await cleanDB()
      homeCom = await writeHomeCommunityEntry()
      author = await userFactory(testEnv, bibiBloxberg)
      await userFactory(testEnv, bobBaumeister)

      await mutate({
        mutation: login,
        variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
      })
      const written: any = await mutate({
        mutation: updateUserInfos,
        variables: { aboutMe: ABOUT_ME_TEXT },
      })
      // The fixture has to prove itself. A variable the mutation does not declare is
      // dropped without a word, and every assertion below would then pass or fail for
      // a reason that has nothing to do with the field resolver.
      if (written.errors || written.data?.updateUserInfos !== true) {
        throw new Error(`could not store aboutMe: ${JSON.stringify(written.errors)}`)
      }
      const stored = await User.findOneOrFail({ where: { id: author.id } })
      if (stored.aboutMe !== ABOUT_ME_TEXT) {
        throw new Error(`aboutMe was not persisted, found: ${stored.aboutMe}`)
      }
    })

    afterAll(async () => {
      await cleanDB()
    })

    it('shows a member their own text', async () => {
      await mutate({
        mutation: login,
        variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
      })
      const res: any = await query({ query: verifyLoginAboutMe })
      expect(res.data.verifyLogin.aboutMe).toBe(ABOUT_ME_TEXT)
    })

    it('hides the text from another logged-in member', async () => {
      await mutate({
        mutation: login,
        variables: { email: 'bob@baumeister.de', password: 'Aa12345_' },
      })
      const res: any = await query({
        query: userAboutMe,
        variables: {
          identifier: author.gradidoID,
          communityIdentifier: homeCom.communityUuid,
        },
      })
      // The user is found - only the field is withheld, so this is the resolver at work
      // and not a lookup that failed.
      expect(res.data.user.gradidoID).toBe(author.gradidoID)
      expect(res.data.user.aboutMe).toBeNull()
    })
  })

  // The place a member has pinned for the member search is theirs alone on this type: no
  // other member, not the moderation, and nobody without a login. The User ObjectType is
  // shared -- `user()` finds any member by alias, gradido ID or confirmed address for anyone
  // logged in, and `queryTransactionLink` names the member who made a link and the one who
  // took it to whoever holds its code, with no token at all. The member search does not read
  // it from here: the server sends the position to the GMS itself, for members who take
  // part, along with their choice of exact or approximate. This field is the pinned point as
  // it is.
  describe('userLocation visibility', () => {
    // Two places, so that one member's answer cannot pass for the other's.
    const BIBIS_PLACE = { longitude: 9.573224, latitude: 49.679437 }
    const BOBS_PLACE = { longitude: 13.404954, latitude: 52.520008 }
    let homeCom: DbCommunity
    let bibi: User
    let bob: User
    let openLinkCode: string
    let takenLinkCode: string

    const signIn = (email: string): Promise<any> =>
      mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })

    // Pinned through the mutation the wallet sends, and read back from the row. The fixture
    // has to prove itself: a position that was never stored reads as null to everybody, and
    // every "hides ..." case below would then pass without a guard anywhere.
    const pins = async (member: User, email: string, place: typeof BIBIS_PLACE) => {
      await signIn(email)
      const written: any = await mutate({
        mutation: updateUserInfos,
        variables: { gmsLocation: place },
      })
      if (written.errors || written.data?.updateUserInfos !== true) {
        throw new Error(`could not store the position: ${JSON.stringify(written.errors)}`)
      }
      const stored = await User.findOneOrFail({ where: { id: member.id } })
      expect(stored.location).toEqual(Location2Point(place))
    }

    const linkOfBibi = (more: Partial<TransactionLinkInterface> = {}) =>
      dbTransactionLinkFactory(
        { email: '', amount: 20, memo: 'Danke fuer die Hilfe im Garten.', ...more },
        bibi.id,
      )

    const asksForBibi = (): Promise<any> =>
      query({
        query: userUserLocation,
        variables: { identifier: bibi.gradidoID, communityIdentifier: homeCom.communityUuid },
      })

    // Nobody is signed in: a link is read by whoever was handed its code.
    const readsLinkWithoutLogin = async (code: string): Promise<any> => {
      resetToken()
      const res: any = await query({ query: queryTransactionLinkUserLocation, variables: { code } })
      expect(res.errors).toBeUndefined()
      return res.data.queryTransactionLink
    }

    beforeAll(async () => {
      await cleanDB()
      homeCom = await writeHomeCommunityEntry()
      bibi = await userFactory(testEnv, bibiBloxberg)
      bob = await userFactory(testEnv, bobBaumeister)
      await userFactory(testEnv, peterLustig)
      await pins(bibi, 'bibi@bloxberg.de', BIBIS_PLACE)
      await pins(bob, 'bob@baumeister.de', BOBS_PLACE)
      openLinkCode = (await linkOfBibi()).code
      takenLinkCode = (await linkOfBibi({ redeemedAt: new Date(), redeemedBy: bob.id })).code
    })

    afterAll(async () => {
      resetToken()
      await cleanDB()
    })

    it('shows a member their own position', async () => {
      await signIn('bibi@bloxberg.de')
      const res: any = await query({ query: verifyLoginUserLocation })
      expect(res.data.verifyLogin.userLocation).toEqual(BIBIS_PLACE)
    })

    // The wallet fills its store from this answer. The login names the member it has just
    // authenticated before it returns, which is what lets an owner guard recognise them.
    it('hands a member their own position with the login itself', async () => {
      const res: any = await signIn('bibi@bloxberg.de')
      expect(res.data.login.userLocation).toEqual(BIBIS_PLACE)
    })

    // What the map and the settings read: the `userLocation` QUERY, which answers another
    // type and is no part of the guard -- held here because the two share a name and a class.
    it('answers the query the map and the settings read as before', async () => {
      await signIn('bibi@bloxberg.de')
      const res: any = await query({ query: userLocationQuery })
      expect(res.data.userLocation.userLocation).toEqual(BIBIS_PLACE)
    })

    it('hides the position from another logged-in member', async () => {
      await signIn('bob@baumeister.de')
      const res: any = await asksForBibi()
      // The member is found - only the field is withheld, so this is the field resolver at
      // work and not a lookup that failed.
      expect(res.data.user.gradidoID).toBe(bibi.gradidoID)
      expect(res.data.user.userLocation).toBeNull()
    })

    // Unlike the address and the real name next door, which the moderation is shown. The
    // admin interface asks for the position nowhere.
    it('hides the position from the moderation as well', async () => {
      await signIn('peter@lustig.de')
      const res: any = await asksForBibi()
      expect(res.data.user.gradidoID).toBe(bibi.gradidoID)
      expect(res.data.user.userLocation).toBeNull()
    })

    it('hides the position of the member who made a link from whoever holds its code', async () => {
      const link = await readsLinkWithoutLogin(openLinkCode)
      expect(link.senderUser.gradidoID).toBe(bibi.gradidoID)
      expect(link.senderUser.userLocation).toBeNull()
    })

    it('hides the position of the member who took the link as well', async () => {
      const link = await readsLinkWithoutLogin(takenLinkCode)
      expect(link.redeemedBy.gradidoID).toBe(bob.gradidoID)
      expect(link.redeemedBy.userLocation).toBeNull()
      expect(link.senderUser.gradidoID).toBe(bibi.gradidoID)
      expect(link.senderUser.userLocation).toBeNull()
    })

    // ⛔ Somebody has to be asking. A member object without an id exists -- a link from
    // another community names its sender that way -- and to a caller without a login the two
    // ids compare as the same: undefined on both sides. No such object carries a position
    // today, so no query can show it; the guard is asked directly.
    it('hides a position on a member object without an id from a caller without a login', () => {
      const guard = new UserResolver()
      const withoutId = Object.assign(new UserModel(null), { userLocation: BIBIS_PLACE })
      expect(guard.userLocation(withoutId, callerWithId(undefined))).toBeNull()
      // Asked the same way, it does answer the member whose object it is.
      const own = Object.assign(new UserModel(null), { id: 7, userLocation: BIBIS_PLACE })
      expect(guard.userLocation(own, callerWithId(7))).toEqual(BIBIS_PLACE)
    })
  })

  // Seven settings a member decides about their own account: whether the two balances are
  // hidden, whether they take part in the member search and in HumHub, and how they appear
  // there. Theirs alone, like the switch for the picture and the one for the transfers: not
  // another member's, not the moderation's, and not for whoever holds the code of a link
  // they made.
  describe('the settings a member decides about their own account', () => {
    // What the member's row holds. Every one of them away from the value a new account
    // starts with, so that an answer made of defaults cannot pass for the member's own.
    const OWN = {
      hideAmountGDD: true,
      hideAmountGDT: true,
      gmsAllowed: true,
      humhubAllowed: false,
      gmsPublishLocation: GmsPublishLocationType.GMS_LOCATION_TYPE_EXACT,
      gmsPublishName: PublishNameType.PUBLISH_NAME_FIRST_INITIAL,
      humhubPublishName: PublishNameType.PUBLISH_NAME_FULL,
    }
    // The same seven, each with another value: for turning one of them over at a time.
    const TURNED_OVER: typeof OWN = {
      hideAmountGDD: false,
      hideAmountGDT: false,
      gmsAllowed: false,
      humhubAllowed: true,
      gmsPublishLocation: GmsPublishLocationType.GMS_LOCATION_TYPE_APPROXIMATE,
      gmsPublishName: PublishNameType.PUBLISH_NAME_INITIALS,
      humhubPublishName: PublishNameType.PUBLISH_NAME_FIRST,
    }
    const SETTINGS = Object.keys(OWN) as (keyof typeof OWN)[]
    // A row as the schema answers it: the switches as they are, the three choices by name.
    const answered = (row: typeof OWN) => ({
      ...row,
      gmsPublishLocation: GmsPublishLocationType[row.gmsPublishLocation],
      gmsPublishName: PublishNameType[row.gmsPublishName],
      humhubPublishName: PublishNameType[row.humhubPublishName],
    })
    let homeCom: DbCommunity
    let owner: User
    let linkCode: string

    const signIn = (email: string): Promise<any> =>
      mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })

    beforeAll(async () => {
      await cleanDB()
      homeCom = await writeHomeCommunityEntry()
      owner = await userFactory(testEnv, bibiBloxberg)
      await userFactory(testEnv, bobBaumeister)
      await userFactory(testEnv, peterLustig)
      // Written to the row and read back: the fixture has to prove itself, or the cases
      // below hold for a reason that has nothing to do with who is asking.
      await User.update({ id: owner.id }, OWN)
      expect(await User.findOneOrFail({ where: { id: owner.id } })).toEqual(
        expect.objectContaining(OWN),
      )
      const link = await dbTransactionLinkFactory(
        { email: '', amount: 20, memo: 'Danke fuer die Hilfe im Garten.' },
        owner.id,
      )
      linkCode = link.code
    })

    afterAll(async () => {
      resetToken()
      await cleanDB()
    })

    // Seven guards of one shape, so each has to show that it answers from ITS OWN column:
    // one setting at a time is turned over in the row, and exactly that one may read
    // differently. Three of the four switches stand alike in the row; without this, one of
    // them answering for another would go unnoticed.
    it.each(SETTINGS)('shows a member their own %s, from its own column', async (setting) => {
      await signIn('bibi@bloxberg.de')
      const before: any = await query({ query: verifyLoginOwnSettings })
      expect(before.data.verifyLogin).toEqual({ gradidoID: owner.gradidoID, ...answered(OWN) })

      const oneTurnedOver = { ...OWN, [setting]: TURNED_OVER[setting] }
      await User.update({ id: owner.id }, oneTurnedOver)
      try {
        const after: any = await query({ query: verifyLoginOwnSettings })
        expect(after.data.verifyLogin).toEqual({
          gradidoID: owner.gradidoID,
          ...answered(oneTurnedOver),
        })
      } finally {
        await User.update({ id: owner.id }, OWN)
      }
    })

    it.each(SETTINGS)('hands a member their own %s with the login itself', async (setting) => {
      const res: any = await signIn('bibi@bloxberg.de')
      expect(res.data.login[setting]).toBe(answered(OWN)[setting])
    })

    const asksForOwner = (): Promise<any> =>
      query({
        query: userOwnSettings,
        variables: { identifier: owner.gradidoID, communityIdentifier: homeCom.communityUuid },
      })

    it.each(SETTINGS)('hides %s from another logged-in member', async (setting) => {
      await signIn('bob@baumeister.de')
      const res: any = await asksForOwner()
      // The member is found and nothing was refused - only the field is withheld.
      expect(res.errors).toBeUndefined()
      expect(res.data.user.gradidoID).toBe(owner.gradidoID)
      expect(res.data.user[setting]).toBeNull()
    })

    it.each(SETTINGS)('hides %s from the moderation as well', async (setting) => {
      await signIn('peter@lustig.de')
      const res: any = await asksForOwner()
      expect(res.errors).toBeUndefined()
      expect(res.data.user.gradidoID).toBe(owner.gradidoID)
      expect(res.data.user[setting]).toBeNull()
    })

    it.each(SETTINGS)(
      'hides %s of the member who made a link from whoever holds its code',
      async (setting) => {
        resetToken()
        const res: any = await query({
          query: queryTransactionLinkOwnSettings,
          variables: { code: linkCode },
        })
        expect(res.errors).toBeUndefined()
        expect(res.data.queryTransactionLink.senderUser.gradidoID).toBe(owner.gradidoID)
        expect(res.data.queryTransactionLink.senderUser[setting]).toBeNull()
      },
    )

    // ⛔ Somebody has to be asking -- the case of the position above, for each of the seven.
    it.each(SETTINGS)(
      'hides %s on a member object without an id from a caller without a login',
      (setting) => {
        const guard = new UserResolver()
        const withoutId = Object.assign(new UserModel(null), OWN)
        expect(guard[setting](withoutId, callerWithId(undefined))).toBeNull()
        // Asked the same way, it does answer the member whose object it is.
        const own = Object.assign(new UserModel(null), { id: 7, ...OWN })
        expect(guard[setting](own, callerWithId(7))).toBe(OWN[setting])
      },
    )
  })

  // ⛔ Somebody has to be asking -- the case of the position and of the seven settings above,
  // for the four guards that stood before them: what a member wrote about themselves, their
  // picture, and the two switches for the picture and for the transfers. No member object
  // without an id carries one of the four today, so no query can show it; each guard is asked
  // directly.
  describe('the four older own-view guards', () => {
    // Every one of them away from what a new account starts with.
    const OWN = {
      aboutMe: 'Ich fliege gern und helfe beim Zaubern.',
      avatar: 'data:image/jpeg;base64,/9j/4AAQ',
      avatarVisibleToMembers: false,
      transfersInChat: false,
    }
    const GUARDS = Object.keys(OWN) as (keyof typeof OWN)[]

    it.each(GUARDS)(
      'hides %s on a member object without an id from a caller without a login',
      (field) => {
        const guard = new UserResolver()
        const withoutId = Object.assign(new UserModel(null), OWN)
        expect(guard[field](withoutId, callerWithId(undefined))).toBeNull()
        // Asked the same way, it answers the member whose object it is, and nobody else.
        const own = Object.assign(new UserModel(null), { id: 7, ...OWN })
        expect(guard[field](own, callerWithId(7))).toBe(OWN[field])
        expect(guard[field](own, callerWithId(8))).toBeNull()
        expect(guard[field](own, callerWithId(undefined))).toBeNull()
      },
    )
  })

  // The address is the member's own - and the moderation's, which needs it to reach people.
  // Until 11.09.2026 every member held VIEW_USER_CONTACT, so `user()` handed anybody's
  // address to anyone logged in.
  describe('emailContact visibility', () => {
    let homeCom: DbCommunity
    let bibi: User

    beforeAll(async () => {
      await cleanDB()
      homeCom = await writeHomeCommunityEntry()
      bibi = await userFactory(testEnv, bibiBloxberg)
      await userFactory(testEnv, bobBaumeister)
      await userFactory(testEnv, peterLustig)
    })

    afterAll(async () => {
      resetToken()
      await cleanDB()
    })

    const asksForBibi = () =>
      query({
        query: userEmailContact,
        variables: { identifier: bibi.gradidoID, communityIdentifier: homeCom.communityUuid },
      })

    it('shows a member their own address', async () => {
      await mutate({
        mutation: login,
        variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
      })
      const own: any = await query({ query: verifyLoginEmailContact })
      expect(own.data.verifyLogin.emailContact.email).toBe('bibi@bloxberg.de')
      const throughUser: any = await asksForBibi()
      expect(throughUser.data.user.emailContact.email).toBe('bibi@bloxberg.de')
    })

    it('refuses the address to another member', async () => {
      await mutate({
        mutation: login,
        variables: { email: 'bob@baumeister.de', password: 'Aa12345_' },
      })
      const res: any = await asksForBibi()
      expect(res.errors).toEqual([
        new GraphQLError('User does not have permission to view this user contact'),
      ])
      expect(JSON.stringify(res.data)).not.toContain('bibi@bloxberg.de')
    })

    it('shows the address to the moderation', async () => {
      await mutate({
        mutation: login,
        variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
      })
      const res: any = await asksForBibi()
      expect(res.data.user.emailContact.email).toBe('bibi@bloxberg.de')
    })
  })

  // The profile picture the member sets for their own account. Own view only: nothing
  // hands it to anybody else, which is the boundary this delivery deliberately keeps.
  describe('user avatar', () => {
    // Two pictures that decode: the server encodes what it is sent again, and these two come
    // out as they went in (test/helpers.ts), so what is read back can be compared with what
    // was sent. The full rendition differs from the small one, or a resolver handing back the
    // wrong column would pass every assertion below.
    const JPEG_BASE64 = TEST_AVATAR_SMALL_BASE64
    const JPEG = Buffer.from(JPEG_BASE64, 'base64')
    const JPEG_FULL_BASE64 = TEST_AVATAR_FULL_BASE64
    const bothPictures = { avatarSmall: JPEG_BASE64, avatarFull: JPEG_FULL_BASE64 }

    let homeCom: DbCommunity
    let owner: User
    let requester: User

    beforeAll(async () => {
      await cleanDB()
      homeCom = await writeHomeCommunityEntry()
      owner = await userFactory(testEnv, bibiBloxberg)
      requester = await userFactory(testEnv, bobBaumeister)
      await mutate({
        mutation: login,
        variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
      })
    })

    afterAll(async () => {
      await cleanDB()
    })

    it('has no picture before one is set', async () => {
      const res: any = await query({ query: verifyLoginAvatar })
      expect(res.data.verifyLogin.avatar).toBeNull()
    })

    it('stores a picture and hands the same bytes back', async () => {
      const written: any = await mutate({
        mutation: setUserAvatar,
        variables: bothPictures,
      })
      expect(written.data.setUserAvatar).toBe(true)

      const res: any = await query({ query: verifyLoginAvatar })
      expect(res.data.verifyLogin.avatar).toBe(JPEG_BASE64)
    })

    // The other way in. The login joins the picture onto the user row it reads, so a
    // member sees their own face on the first screen instead of watching initials turn
    // into a picture while a second query flies. Two things have to hold at once for this
    // to answer: the join, and the owner guard on the field -- the login names the member
    // it has just authenticated before it returns, which is what lets the guard match.
    it('hands the same picture over with the login itself', async () => {
      await mutate({ mutation: setUserAvatar, variables: bothPictures })

      const res: any = await mutate({
        mutation: login,
        variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
      })
      expect(res.data.login.avatar).toBe(JPEG_BASE64)
      // The switch beside it, from the same answer and through the same guard.
      expect(res.data.login.avatarVisibleToMembers).toBe(true)
    })

    // ⛔ The login reads the WHOLE `users` row, `location` with it. A member who had saved
    // a position could not sign in at all: mysql2 parses a geometry column into `{ x, y }`
    // and the geometry type handed that to wkx, which refuses anything but a string or a
    // Buffer -- so the read threw and the member was told "no user with this credentials".
    // Nothing in that message points at a pin on a map, which is why it is held down here
    // and not only in the database package.
    it('lets a member who has saved a position sign in', async () => {
      await User.update(
        { id: owner.id },
        { location: Location2Point({ longitude: 8.6821, latitude: 50.1109 }) },
      )
      try {
        const res: any = await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
        expect(res.errors).toBeUndefined()
        expect(res.data.login.gradidoID).toEqual(expect.any(String))
      } finally {
        await User.update({ id: owner.id }, { location: null })
      }
    })

    // ⛔ What the other assertions here lean on. If it falls after an update of
    // rust-image-ffi, the pictures in test/helpers.ts have to be encoded again.
    it('the test pictures come out as they went in', async () => {
      for (const base64 of [
        TEST_AVATAR_SMALL_BASE64,
        TEST_AVATAR_FULL_BASE64,
        TEST_AVATAR_200_PIXELS_BASE64,
      ]) {
        const picture = Buffer.from(base64, 'base64')
        const reencoded = await reencodeImage(picture, { maxOutputBytes: 64 * 1024 })
        expect(reencoded.success && reencoded.value.data.equals(picture)).toBe(true)
      }
    })

    // The small rendition goes to every member and to other communities: nothing of the file
    // a member sent travels with it, only its pixels.
    it('stores the picture encoded again, without what was hidden in it', async () => {
      const hidden = Buffer.from('<script>alert(1)</script>')
      const withHidden = (base64: string) => {
        const picture = Buffer.from(base64, 'base64')
        return Buffer.concat([
          picture.subarray(0, 2),
          Buffer.from([0xff, 0xfe, 0x00, hidden.length + 2]),
          hidden,
          picture.subarray(2),
          hidden,
          Buffer.from([0xff, 0xd9]),
        ]).toString('base64')
      }

      const written: any = await mutate({
        mutation: setUserAvatar,
        variables: {
          avatarSmall: withHidden(JPEG_BASE64),
          avatarFull: withHidden(JPEG_FULL_BASE64),
        },
      })
      expect(written.errors).toBeUndefined()

      const small: any = await query({ query: verifyLoginAvatar })
      const full: any = await query({ query: avatarFull })
      // The same pixels, so the same bytes as the picture without anything hidden in it.
      expect(small.data.verifyLogin.avatar).toBe(JPEG_BASE64)
      expect(full.data.avatarFull).toBe(JPEG_FULL_BASE64)
      expect(Buffer.from(small.data.verifyLogin.avatar, 'base64').includes(hidden)).toBe(false)
      expect(Buffer.from(full.data.avatarFull, 'base64').includes(hidden)).toBe(false)
    })

    // What the check of both ends alone used to take.
    it('refuses what is a JPEG at both ends and no picture between', async () => {
      const noPicture = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0xff, 0xd9])
      for (const variables of [
        { ...bothPictures, avatarSmall: noPicture.toString('base64') },
        { ...bothPictures, avatarFull: noPicture.toString('base64') },
      ]) {
        const res: any = await mutate({ mutation: setUserAvatar, variables })
        expect(res.errors?.[0].message).toMatch(/^Avatar image \((small|full)\) is not a JPEG$/)
      }
    })

    // The pixels are what a picture costs the server and every member's browser, not the
    // bytes: a plain surface of any size fits the byte limit.
    it('refuses a small rendition with more pixels than the wallet draws, and takes it as the full one', async () => {
      const refused: any = await mutate({
        mutation: setUserAvatar,
        variables: { ...bothPictures, avatarSmall: TEST_AVATAR_200_PIXELS_BASE64 },
      })
      expect(refused.errors).toEqual([new GraphQLError('Avatar image (small) has too many pixels')])

      const taken: any = await mutate({
        mutation: setUserAvatar,
        variables: { ...bothPictures, avatarFull: TEST_AVATAR_200_PIXELS_BASE64 },
      })
      expect(taken.errors).toBeUndefined()
      const full: any = await query({ query: avatarFull })
      expect(full.data.avatarFull).toBe(TEST_AVATAR_200_PIXELS_BASE64)

      // Back to the pictures the tests below expect.
      await mutate({ mutation: setUserAvatar, variables: bothPictures })
    })

    // ⛔ One document, the mutation twice under aliases, the pictures once in the variables.
    it('sets the picture once in an HTTP request, however often the document asks', async () => {
      const twice = gql`
        mutation ($avatarSmall: String!, $avatarFull: String!) {
          first: setUserAvatar(avatarSmall: $avatarSmall, avatarFull: $avatarFull)
          second: setUserAvatar(avatarSmall: $avatarSmall, avatarFull: $avatarFull)
        }
      `
      const res: any = await mutate({ mutation: twice, variables: bothPictures })
      expect(res.errors).toEqual([new GraphQLError('Too many avatar images sent at once')])
    })

    // The payload coderabbit found: ff d8 00 passes an opening-marker check on its own.
    it('refuses a payload that only starts like a JPEG', async () => {
      const res: any = await mutate({
        mutation: setUserAvatar,
        variables: {
          ...bothPictures,
          avatarSmall: Buffer.from([0xff, 0xd8, 0x00]).toString('base64'),
        },
      })
      expect(res.errors).toBeDefined()
    })

    it('refuses something that is not a JPEG', async () => {
      const res: any = await mutate({
        mutation: setUserAvatar,
        variables: { ...bothPictures, avatarSmall: Buffer.from('not an image').toString('base64') },
      })
      expect(res.errors).toBeDefined()
    })

    it('refuses a picture over the size limit', async () => {
      const tooLarge = Buffer.concat([JPEG, Buffer.alloc(AVATAR_FULL_MAX_BYTES, 0x20), JPEG])
      const res: any = await mutate({
        mutation: setUserAvatar,
        variables: { ...bothPictures, avatarFull: tooLarge.toString('base64') },
      })
      expect(res.errors).toBeDefined()
    })

    // The two renditions have their own budgets, and this is the case a single shared
    // limit would wave through: a "small" picture that is far too big to be one, yet
    // comfortably under what the full rendition may weigh. Without a limit of its own,
    // the everyday picture -- the one that goes on every screen and will one day cross
    // community borders -- could quietly be 60 KB.
    it('refuses a small rendition that is only small by name', async () => {
      const smallButNot = Buffer.concat([JPEG, Buffer.alloc(AVATAR_SMALL_MAX_BYTES, 0x20), JPEG])
      expect(smallButNot.length).toBeLessThan(AVATAR_FULL_MAX_BYTES)

      const res: any = await mutate({
        mutation: setUserAvatar,
        variables: { ...bothPictures, avatarSmall: smallButNot.toString('base64') },
      })
      expect(res.errors).toBeDefined()
    })

    // Two columns, two readers, and nothing in the types keeps them apart -- both are
    // base64 strings. So the assertion is that each way out carries its OWN rendition.
    it('hands the full rendition to its owner, and never in place of the small one', async () => {
      const full: any = await query({ query: avatarFull })
      expect(full.data.avatarFull).toBe(JPEG_FULL_BASE64)

      const small: any = await query({ query: verifyLoginAvatar })
      expect(small.data.verifyLogin.avatar).toBe(JPEG_BASE64)
    })

    // Issues its own refusal rather than reading what earlier tests left behind. Without
    // that, the assertion passes with a name filter or after a reorder and proves nothing
    // about rejected writes at all.
    it('leaves the stored picture untouched when a write was refused', async () => {
      const refused: any = await mutate({
        mutation: setUserAvatar,
        variables: { ...bothPictures, avatarFull: Buffer.from('rubbish').toString('base64') },
      })
      expect(refused.errors).toBeDefined()

      const res: any = await query({ query: verifyLoginAvatar })
      expect(res.data.verifyLogin.avatar).toBe(JPEG_BASE64)
    })

    it('removes the picture', async () => {
      const removed: any = await mutate({ mutation: removeUserAvatar })
      expect(removed.data.removeUserAvatar).toBe(true)

      const res: any = await query({ query: verifyLoginAvatar })
      expect(res.data.verifyLogin.avatar).toBeNull()
    })

    // Removing a picture that is not there is what the member wanted either way.
    it('stays quiet when there is nothing to remove', async () => {
      const removed: any = await mutate({ mutation: removeUserAvatar })
      expect(removed.data.removeUserAvatar).toBe(true)
    })

    // The boundary the field resolver keeps: `user` hands out any member by alias to
    // everyone logged in, so the picture is withheld there and stays withheld. The switch
    // that decides who may see a face works through memberAvatars below, not through this
    // field -- widening this one would hand out pictures the switch never agreed to.
    it('hides the picture from another logged-in member', async () => {
      await mutate({
        mutation: login,
        variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
      })
      const written: any = await mutate({
        mutation: setUserAvatar,
        variables: bothPictures,
      })
      // The fixture has to prove itself, or the assertion below passes for the wrong
      // reason: a picture that was never stored is invisible to everyone.
      if (written.errors || written.data?.setUserAvatar !== true) {
        throw new Error(`could not store avatar: ${JSON.stringify(written.errors)}`)
      }

      await mutate({
        mutation: login,
        variables: { email: 'bob@baumeister.de', password: 'Aa12345_' },
      })
      const res: any = await query({
        query: userAvatar,
        variables: {
          identifier: owner.gradidoID,
          communityIdentifier: homeCom.communityUuid,
        },
      })
      // The member is found - only the field is withheld, so this is the field resolver
      // at work and not a lookup that failed.
      expect(res.data.user.gradidoID).toBe(owner.gradidoID)
      expect(res.data.user.avatar).toBeNull()
    })

    // The batched reader other members' faces actually travel through. Run against the
    // real schema on purpose: the input type name and the argument name are produced by
    // type-graphql from class names here and typed by hand in the wallet, and nothing
    // links the two. A rename would leave the wallet sending a document the schema
    // rejects, at runtime, with nothing red beforehand. This document is that link.
    //
    // State on arrival: bob is logged in, bibi has a picture and has not touched the
    // switch, so it stands at the column default.
    describe('the pictures of other members', () => {
      it("hands bibi's picture to bob, who shares bookings with her", async () => {
        const res: any = await query({
          query: memberAvatars,
          variables: {
            refs: [{ gradidoID: owner.gradidoID, communityUuid: homeCom.communityUuid }],
          },
        })
        expect(res.errors).toBeUndefined()
        expect(res.data.memberAvatars).toHaveLength(1)
        expect(res.data.memberAvatars[0].gradidoID).toBe(owner.gradidoID)
        expect(res.data.memberAvatars[0].avatar).toBe(JPEG_BASE64)
        expect(res.data.memberAvatars[0].avatarUpdatedAt).not.toBeNull()
      })

      // The switch, end to end and through the real schema -- the query test proves the
      // SQL, this proves that the path a member's decision actually takes reaches it.
      it('hands out nothing once bibi turns the switch off', async () => {
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
        await mutate({
          mutation: updateUserInfos,
          variables: { avatarVisibleToMembers: false },
        })
        await mutate({
          mutation: login,
          variables: { email: 'bob@baumeister.de', password: 'Aa12345_' },
        })

        const res: any = await query({
          query: memberAvatars,
          variables: {
            refs: [{ gradidoID: owner.gradidoID, communityUuid: homeCom.communityUuid }],
          },
        })
        expect(res.errors).toBeUndefined()
        expect(res.data.memberAvatars).toEqual([])
      })

      // Never an error for a member who is not there: that would make this a directory
      // telling whoever asks which accounts exist.
      it('says nothing at all about a member it does not know', async () => {
        const res: any = await query({
          query: memberAvatars,
          variables: {
            refs: [{ gradidoID: 'ffffffff-ffff-4fff-8fff-ffffffffffff', communityUuid: null }],
          },
        })
        expect(res.errors).toBeUndefined()
        expect(res.data.memberAvatars).toEqual([])
      })

      const strangers = (count: number) =>
        Array.from({ length: count }, (_, index) => ({
          gradidoID: `ffffffff-ffff-4fff-8fff-${String(index).padStart(12, '0')}`,
          communityUuid: null,
        }))

      /**
       * Without the cap this is a bulk download of every face in the community.
       *
       * ⛔ The message is asserted, not merely that SOMETHING went wrong. Two caps guard
       * this query -- @ArrayMaxSize on the args class, which rejects before a row is read,
       * and the resolver's own check -- and `expect(res.errors).toBeDefined()` is satisfied
       * by either, so it stays green if the one that protects the database is removed.
       * MemberAvatarRefInput carries a TODO to replace exactly those decorators.
       */
      it('refuses a list longer than the cap, at the decorator that guards the database', async () => {
        const res: any = await query({ query: memberAvatars, variables: { refs: strangers(101) } })
        expect(res.errors).toBeDefined()
        expect(res.errors[0].message).toContain('Argument Validation Error')
        expect(JSON.stringify(res.errors)).toContain('arrayMaxSize')
      })

      // ...and the other side of the boundary, which nothing measured: a full page of
      // distinct counterparties has to get THROUGH. Tightening the per-ref validation, or
      // lowering the cap, would otherwise kill every face on a busy page with a green suite
      // -- the wallet swallows the error and simply shows initials.
      it('lets a full page of members through', async () => {
        const res: any = await query({ query: memberAvatars, variables: { refs: strangers(100) } })
        expect(res.errors).toBeUndefined()
        expect(res.data.memberAvatars).toEqual([])
      })

      /**
       * ⛔ The one query in this delivery that hands out other people's faces, and nothing
       * established who may ask. Every case above runs with bob's token, which the
       * decorator is irrelevant to -- remove @Authorized and they all still pass, while the
       * query becomes an anonymous reader of every opted-in member's picture.
       */
      it('answers nobody who is not logged in', async () => {
        resetToken()
        const res: any = await query({
          query: memberAvatars,
          variables: {
            refs: [{ gradidoID: owner.gradidoID, communityUuid: homeCom.communityUuid }],
          },
        })
        expect(res.errors).toEqual([new GraphQLError('401 Unauthorized')])

        // Put the session back: everything after this file's point runs on the token this
        // test just threw away, and a suite that depends on test order should at least not
        // be the thing that breaks it.
        await mutate({
          mutation: login,
          variables: { email: 'bob@baumeister.de', password: 'Aa12345_' },
        })
      })

      /**
       * AS-004 / AS-020: members of ANOTHER community. Their pictures live over there, and
       * this server asks for them the way it asks for anything across the border -- the
       * question encrypted for that community's JWT key and signed with this one's -- and
       * stores none of them.
       *
       * ⛔ The stand-in for the other community opens the question with ITS key and seals a
       * REAL answer for this community's. Anything less would leave verifyAndDecrypt and the
       * tokentype check out of these cases: a made-up peer only confirms itself.
       *
       * No fake timers (drizzle is on the path); the time limit is proven in core,
       * xcomMemberAvatars.test.ts.
       *
       * State on arrival: bob is logged in and bibi's switch is OFF (turned off above). It is
       * turned on for these cases and off again afterwards, so the block below finds the
       * state it describes.
       */
      describe('members of another community', () => {
        const peerUuid = uuidv4()
        const peerMember = uuidv4()
        // Pictures that decode, and others than the member's own two: what another community
        // answers with is held to the bounds of an avatar, header included
        // (xcomMemberAvatars in core).
        const PEER_SMALL = TEST_AVATAR_FULL_BASE64
        const PEER_FULL = TEST_AVATAR_200_PIXELS_BASE64
        const PICTURE_DATE = '2026-09-14T10:00:00.000Z'
        const relayLogger = resolverLogger('relayMemberAvatars')
        const refs = () => [
          { gradidoID: owner.gradidoID, communityUuid: homeCom.communityUuid },
          { gradidoID: peerMember, communityUuid: peerUuid },
        ]

        let homeKeys: { publicKey: string; privateKey: string }
        let peerKeys: { publicKey: string; privateKey: string }
        let peer: DbCommunity
        let peerEntry: DbFederatedCommunity
        let questions: MemberAvatarsJwtPayloadType[] = []
        let rawRequest: jest.SpyInstance | undefined

        const setSwitch = async (avatarVisibleToMembers: boolean) => {
          await mutate({
            mutation: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
          const switched: any = await mutate({
            mutation: updateUserInfos,
            variables: { avatarVisibleToMembers },
          })
          // The fixture proves itself: with the switch silently left off, the cases below
          // would find no face of bibi's for a reason that has nothing to do with the relay.
          if (switched.errors) {
            throw new Error(`could not set the switch: ${JSON.stringify(switched.errors)}`)
          }
          await mutate({
            mutation: login,
            variables: { email: 'bob@baumeister.de', password: 'Aa12345_' },
          })
        }

        /** The other community: opens the question with its key, answers sealed for ours. */
        const peerAnswers = (
          answer: (question: MemberAvatarsJwtPayloadType) => MemberAvatarPayload[],
        ) => {
          rawRequest = jest
            .spyOn(GraphQLClient.prototype, 'rawRequest')
            .mockImplementation((async (options: {
              variables: { args: { handshakeID: string; jwt: string } }
            }) => {
              const { args } = options.variables
              const question = (await verifyAndDecrypt(
                args.handshakeID,
                args.jwt,
                peerKeys.privateKey,
                homeKeys.publicKey,
              )) as MemberAvatarsJwtPayloadType | null
              if (!question) {
                throw new Error('the question does not verify with the key of this community')
              }
              questions.push(question)
              const token = await encryptAndSign(
                new MemberAvatarsResponseJwtPayloadType(args.handshakeID, answer(question)),
                peerKeys.privateKey,
                homeKeys.publicKey,
              )
              return { data: { memberAvatars: token }, status: 200 }
            }) as any)
        }

        beforeAll(async () => {
          homeKeys = await createKeyPair()
          peerKeys = await createKeyPair()
          await DbCommunity.update(
            { foreign: false },
            { publicJwtKey: homeKeys.publicKey, privateJwtKey: homeKeys.privateKey },
          )
          peer = await DbCommunity.create({
            foreign: true,
            url: 'http://peer.invalid/api/',
            publicKey: randomBytes(32),
            communityUuid: peerUuid,
            authenticatedAt: new Date(),
            name: 'Peer community',
            description: 'the other side of the border',
            creationDate: new Date(),
            publicJwtKey: peerKeys.publicKey,
          }).save()
          peerEntry = await DbFederatedCommunity.create({
            foreign: true,
            publicKey: peer.publicKey,
            apiVersion: CORE_CONFIG.FEDERATION_BACKEND_SEND_ON_API,
            endPoint: 'http://peer.invalid/api/',
          }).save()
          await setSwitch(true)
        })

        beforeEach(() => {
          questions = []
          jest.clearAllMocks()
        })

        afterEach(() => {
          rawRequest?.mockRestore()
          rawRequest = undefined
        })

        afterAll(async () => {
          await setSwitch(false)
          await DbFederatedCommunity.delete({ id: peerEntry.id })
          await DbCommunity.delete({ id: peer.id })
          await DbCommunity.update({ foreign: false }, { publicJwtKey: null, privateJwtKey: null })
        })

        it("hands back another community's faces under that community's uuid", async () => {
          peerAnswers((question) =>
            question.gradidoIDs.map((gradidoID) => ({
              gradidoID,
              avatarUpdatedAt: PICTURE_DATE,
              avatar: PEER_SMALL,
            })),
          )

          const res: any = await query({ query: memberAvatars, variables: { refs: refs() } })

          expect(res.errors).toBeUndefined()
          expect(res.data.memberAvatars).toHaveLength(2)
          expect(res.data.memberAvatars).toContainEqual({
            gradidoID: peerMember,
            communityUuid: peerUuid,
            avatar: PEER_SMALL,
            avatarUpdatedAt: PICTURE_DATE,
          })
          expect(res.data.memberAvatars).toContainEqual(
            expect.objectContaining({
              gradidoID: owner.gradidoID,
              communityUuid: homeCom.communityUuid,
              avatar: JPEG_BASE64,
            }),
          )
          // ⛔ Only the other community's member was asked about over there: bibi's id never
          // left this server.
          expect(questions).toEqual([
            expect.objectContaining({ kind: 'small', gradidoIDs: [peerMember] }),
          ])
        })

        it('still hands out its own faces when the other community does not answer', async () => {
          rawRequest = jest
            .spyOn(GraphQLClient.prototype, 'rawRequest')
            .mockRejectedValue(new Error('connect ECONNREFUSED 192.0.2.1:443'))

          const res: any = await query({ query: memberAvatars, variables: { refs: refs() } })

          expect(res.errors).toBeUndefined()
          expect(res.data.memberAvatars).toEqual([
            expect.objectContaining({
              gradidoID: owner.gradidoID,
              communityUuid: homeCom.communityUuid,
              avatar: JPEG_BASE64,
            }),
          ])
          // The one trace an admin has of a relay that stays empty, naming the community.
          expect(relayLogger.warn).toHaveBeenCalledWith(
            'no member pictures from another community',
            expect.stringContaining(peerUuid),
          )
        })

        // AS-020: the zoom crosses the border too, counted in the same budget as at home.
        it("passes the zoom on to the member's own community", async () => {
          peerAnswers((question) =>
            question.gradidoIDs.map((gradidoID) => ({
              gradidoID,
              avatarUpdatedAt: PICTURE_DATE,
              avatar: PEER_FULL,
            })),
          )

          const res: any = await query({
            query: memberAvatarFull,
            variables: { ref: { gradidoID: peerMember, communityUuid: peerUuid } },
          })

          expect(res.errors).toBeUndefined()
          expect(res.data.memberAvatarFull).toBe(PEER_FULL)
          expect(questions).toEqual([
            expect.objectContaining({ kind: 'full', gradidoIDs: [peerMember] }),
          ])
        })

        /**
         * ⛔ The cap on asking other communities, and it has to be measured through ALIASES:
         * one document may repeat the field hundreds of times, each repetition an outgoing
         * request. Sending the query that many TIMES would pass without the counter, because
         * every call would be an HTTP request of its own. Exactly the cap gets through --
         * neither fewer nor more.
         */
        it('asks other communities no more often than one request allows', async () => {
          peerAnswers(() => [])
          const ref = `{ gradidoID: "${peerMember}", communityUuid: "${peerUuid}" }`
          const aliases = Array.from(
            { length: MEMBER_AVATARS_RELAYS_MAX_PER_REQUEST + 2 },
            (_unused, index) => `a${index}: memberAvatars(refs: [${ref}]) { gradidoID }`,
          ).join('\n')

          const res: any = await query({ query: gql`query { ${aliases} }` })

          expect(res.errors).toBeUndefined()
          expect(questions).toHaveLength(MEMBER_AVATARS_RELAYS_MAX_PER_REQUEST)
        })
      })
    })

    /**
     * AS-018: the 512 crop, for ONE member, on a click. Until this delivery the column had
     * no member-facing reader at all, so every case here is new ground rather than a
     * variation of the batched one.
     *
     * ⛔ On arrival bibi's switch is OFF -- the block above turned it off and left it that
     * way. Turning it back on is therefore a FIXTURE, not a formality: without it the first
     * test would read null and pass for the wrong reason, proving nothing about a rendition
     * that is allowed to travel.
     */
    describe('the full picture of another member', () => {
      const refToOwner = () => ({
        ref: { gradidoID: owner.gradidoID, communityUuid: homeCom.communityUuid },
      })

      beforeAll(async () => {
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
        const shown: any = await mutate({
          mutation: updateUserInfos,
          variables: { avatarVisibleToMembers: true },
        })
        // The fixture proves itself. A switch that silently stayed off would make every
        // refusal below pass without any of them measuring a refusal.
        if (shown.errors) {
          throw new Error(`could not turn the switch on: ${JSON.stringify(shown.errors)}`)
        }
        await mutate({
          mutation: login,
          variables: { email: 'bob@baumeister.de', password: 'Aa12345_' },
        })
      })

      it("hands bibi's full crop to bob", async () => {
        const res: any = await query({ query: memberAvatarFull, variables: refToOwner() })
        expect(res.errors).toBeUndefined()
        expect(res.data.memberAvatarFull).toBe(JPEG_FULL_BASE64)
      })

      // The input type still admits a null uuid, and the query matches the exact pair only.
      // This pins the one reading the API gives a null -- THIS community -- as long as the
      // field stays nullable; it goes when MemberAvatarRefInput becomes `String!`.
      it('reads a ref without a community uuid as this community', async () => {
        const res: any = await query({
          query: memberAvatarFull,
          variables: { ref: { gradidoID: owner.gradidoID, communityUuid: null } },
        })
        expect(res.errors).toBeUndefined()
        expect(res.data.memberAvatarFull).toBe(JPEG_FULL_BASE64)
      })

      // Both renditions are base64 strings on the wire, so nothing but this assertion says
      // which column came out. The same check the owner's own two readers get above.
      //
      // ⚠️ The positive half is asserted FIRST and deliberately: `not.toBe(JPEG_BASE64)` is
      // satisfied by null, which is the one answer this test can least afford to accept --
      // a resolver that hands back nothing at all would pass the guard named as the defence
      // against column confusion. Its database twin avoids this by comparing Buffers, which
      // throws on null.
      it('never hands the small rendition out in its place', async () => {
        const res: any = await query({ query: memberAvatarFull, variables: refToOwner() })
        expect(res.errors).toBeUndefined()
        expect(res.data.memberAvatarFull).toBe(JPEG_FULL_BASE64)
        expect(res.data.memberAvatarFull).not.toBe(JPEG_BASE64)
      })

      /**
       * ⛔ The identity is a PAIR. `users` is unique on (gradido_id, community_uuid), so
       * asking with the wrong community is asking about a different person -- and before
       * the review the resolver accepted `communityUuid`, validated it, and then dropped it
       * on the floor, which no test could see because every fixture agreed by accident.
       */
      it('answers nothing when the community does not match', async () => {
        const res: any = await query({
          query: memberAvatarFull,
          variables: {
            ref: {
              gradidoID: owner.gradidoID,
              communityUuid: 'deadbeef-dead-4ead-8ead-deaddeaddead',
            },
          },
        })
        expect(res.errors).toBeUndefined()
        expect(res.data.memberAvatarFull).toBeNull()
      })

      /**
       * ⛔ The cap, and it has to be measured through ALIASES or it measures nothing.
       * `memberAvatarFull` takes one member, so a limit inside the resolver counts to one
       * however often the field appears; the request-scoped counter is the only thing that
       * sees eleven of them. A test that called the query eleven TIMES would pass with the
       * counter deleted, because each call would be its own request.
       */
      it('refuses more full pictures than one request may have', async () => {
        const ref = `{ gradidoID: "${owner.gradidoID}", communityUuid: ${
          homeCom.communityUuid ? `"${homeCom.communityUuid}"` : 'null'
        } }`
        const aliases = Array.from(
          { length: MEMBER_AVATARS_FULL_MAX_PER_REQUEST + 1 },
          (_unused, index) => `a${index}: memberAvatarFull(ref: ${ref})`,
        ).join('\n')

        const res: any = await query({ query: gql`query { ${aliases} }` })
        expect(res.errors).toBeDefined()
        expect(JSON.stringify(res.errors)).toContain('Too many full-size pictures')
      })

      // ...and the other side of the boundary, which nothing else measures: a member who
      // opens a few faces in a row must get through. A cap the ordinary use can reach is
      // one somebody raises without reading why it is there.
      it('lets a request that stays under the cap through', async () => {
        const ref = `{ gradidoID: "${owner.gradidoID}", communityUuid: ${
          homeCom.communityUuid ? `"${homeCom.communityUuid}"` : 'null'
        } }`
        const aliases = Array.from(
          { length: MEMBER_AVATARS_FULL_MAX_PER_REQUEST },
          (_unused, index) => `a${index}: memberAvatarFull(ref: ${ref})`,
        ).join('\n')

        const res: any = await query({ query: gql`query { ${aliases} }` })
        expect(res.errors).toBeUndefined()
        expect(res.data.a0).toBe(JPEG_FULL_BASE64)
      })

      /**
       * ⛔ One operation per HTTP request, which is what lets the cap above be the cap of a
       * request: a POST whose body is an array of operations would otherwise bring the cap
       * once per operation. Apollo Server refuses such a body unless it is told to take it
       * (`allowBatchedHttpRequests`), and this server does not tell it.
       *
       * Through a real HTTP request: the test client above cannot send an array at all.
       */
      it('refuses a POST that carries several operations', async () => {
        const ref = `{ gradidoID: "${owner.gradidoID}", communityUuid: ${
          homeCom.communityUuid ? `"${homeCom.communityUuid}"` : 'null'
        } }`
        const operation = { query: `query { memberAvatarFull(ref: ${ref}) }` }
        const payload = JSON.stringify([operation, operation])
        const token = encode(requester.gradidoID)

        const { app } = await createServer(getLogger('apollo'))
        // On the loopback interface only, and read the port once it is bound: with a host
        // given, listen() resolves it first and address() is null until 'listening'.
        const httpServer = app.listen(0, '127.0.0.1')
        await once(httpServer, 'listening')
        try {
          const { port } = httpServer.address() as AddressInfo
          const answer = await new Promise<{ status?: number; body: string }>((resolve, reject) => {
            const req = httpRequest(
              {
                host: '127.0.0.1',
                port,
                path: '/',
                method: 'POST',
                headers: {
                  'content-type': 'application/json',
                  'content-length': Buffer.byteLength(payload),
                  authorization: `Bearer ${token}`,
                },
              },
              (res) => {
                let body = ''
                res.setEncoding('utf8')
                res.on('data', (chunk) => {
                  body += chunk
                })
                res.on('end', () => resolve({ status: res.statusCode, body }))
              },
            )
            req.on('error', reject)
            req.end(payload)
          })

          expect(answer.status).toBe(400)
          const result: { data?: unknown; errors?: { message: string }[] } = JSON.parse(answer.body)
          expect(result.errors?.map((error) => error.message)).toEqual([
            'Operation batching disabled.',
          ])
          // No picture, in whatever shape: nothing of the two operations was run.
          expect(result.data).toBeUndefined()
          expect(answer.body).not.toContain(JPEG_FULL_BASE64)
        } finally {
          await new Promise((resolve) => httpServer.close(resolve))
        }
      })

      // The one switch, both renditions (AS-006). If this ever diverges from the batched
      // reader, a member who withdrew their face keeps handing out the LARGER version of
      // it -- which is the exact failure this delivery had to avoid.
      it('stops handing it out the moment bibi turns the switch off', async () => {
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
        await mutate({
          mutation: updateUserInfos,
          variables: { avatarVisibleToMembers: false },
        })
        await mutate({
          mutation: login,
          variables: { email: 'bob@baumeister.de', password: 'Aa12345_' },
        })

        const res: any = await query({ query: memberAvatarFull, variables: refToOwner() })
        expect(res.errors).toBeUndefined()
        expect(res.data.memberAvatarFull).toBeNull()

        // ...and the small one is gone too, in the same breath. Asserted here rather than
        // trusted: the two renditions travel through two queries, and "the switch works"
        // has to mean both of them or it means nothing.
        const small: any = await query({
          query: memberAvatars,
          variables: { refs: [refToOwner().ref] },
        })
        expect(small.data.memberAvatars).toEqual([])
      })

      it('says nothing at all about a member it does not know', async () => {
        const res: any = await query({
          query: memberAvatarFull,
          variables: {
            ref: { gradidoID: 'ffffffff-ffff-4fff-8fff-ffffffffffff', communityUuid: null },
          },
        })
        expect(res.errors).toBeUndefined()
        expect(res.data.memberAvatarFull).toBeNull()
      })

      /**
       * ⛔ Same reason as for the batched reader: every case above runs with bob's token,
       * which the decorator is irrelevant to. Remove @Authorized and they all still pass
       * while this becomes an anonymous reader of every opted-in member's face, at print
       * resolution.
       */
      it('answers nobody who is not logged in', async () => {
        resetToken()
        const res: any = await query({ query: memberAvatarFull, variables: refToOwner() })
        expect(res.errors).toEqual([new GraphQLError('401 Unauthorized')])

        await mutate({
          mutation: login,
          variables: { email: 'bob@baumeister.de', password: 'Aa12345_' },
        })
      })
    })
  })

  // Leaving the GMS removes the member and everything of theirs over there. Joining again
  // therefore has to hand the GMS a whole member, entries included - the two mutations
  // below are one story and run in order.
  // Only a member with a place is sent to the GMS; without one GmsUser refuses.
  const gmsMemberLocation = () => {
    const loc = new Location()
    loc.longitude = 9.573224
    loc.latitude = 49.679437
    return Location2Point(loc)
  }

  describe('gms consent withdrawn and given again', () => {
    const ENTRY_UUID = 'b6f0c1d2-3e4a-4b5c-8d9e-0f1a2b3c4d5e'
    const upsertMock = upsertGmsUsers as jest.Mock
    const snapshotMock = putGmsMatchingEntrySnapshots as jest.Mock
    const deleteMock = deleteGmsUser as jest.Mock
    let member: User

    beforeAll(async () => {
      await cleanDB()
      const homeCom = await writeHomeCommunityEntry()
      homeCom.gmsApiKey = 'gms-test-key'
      await DbCommunity.save(homeCom)

      member = await userFactory(testEnv, bibiBloxberg)
      // The member is already published over there, and has one live entry with them.
      await User.update(
        { id: member.id },
        {
          gmsAllowed: true,
          location: gmsMemberLocation(),
          gmsRegistered: true,
          gmsRegisteredAt: new Date(),
        },
      )
      const inserted = await dbInsertMatchingEntry({
        uuid: ENTRY_UUID,
        userId: member.id,
        matchingType: 'offer',
        summary: 'Lastenrad zum Ausleihen',
        details: null,
        remote: false,
        active: true,
      })
      if (!inserted.success) {
        throw new Error('could not create the matching entry the assertions rely on')
      }

      CONFIG.GMS_ACTIVE = true
      upsertMock.mockResolvedValue(true)
      snapshotMock.mockResolvedValue(true)
      deleteMock.mockResolvedValue(true)
      await mutate({
        mutation: login,
        variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
      })
    })

    afterAll(async () => {
      CONFIG.GMS_ACTIVE = false
      await cleanDB()
    })

    it('deletes the member in the GMS and stops counting them as registered', async () => {
      await mutate({ mutation: updateUserInfos, variables: { gmsAllowed: false } })

      expect(deleteMock).toHaveBeenCalledWith('gms-test-key', member.gradidoID)
      const stored = await User.findOneOrFail({ where: { id: member.id } })
      expect(stored.gmsRegistered).toBe(false)
      expect(stored.gmsRegisteredAt).toBeNull()
    })

    it('sends the member back with their live entries when they join again', async () => {
      upsertMock.mockClear()
      snapshotMock.mockClear()

      await mutate({ mutation: updateUserInfos, variables: { gmsAllowed: true } })

      expect(upsertMock).toHaveBeenCalledTimes(1)
      expect(snapshotMock).toHaveBeenCalledTimes(1)
      const [, snapshots] = snapshotMock.mock.calls[0]
      // Without the snapshot the GMS keeps what it has - and after the delete above that
      // is nothing, so the member's offer would be gone from every search.
      expect(snapshots).toEqual([
        expect.objectContaining({
          userUuid: member.gradidoID,
          entries: [
            expect.objectContaining({ uuid: ENTRY_UUID, summary: 'Lastenrad zum Ausleihen' }),
          ],
        }),
      ])
      // The member has to exist over there before their entries are addressed to them,
      // or the GMS drops the snapshot with a warning and still answers 200.
      expect(upsertMock.mock.invocationCallOrder[0]).toBeLessThan(
        snapshotMock.mock.invocationCallOrder[0],
      )
    })
  })

  // What a member writes about themselves is published, so changing it has to travel
  // too. Deleting it is the case that matters: the text is gone from the wallet, and
  // the GMS would go on showing it next to their entries.
  describe('gms publishing when a member edits what they wrote about themselves', () => {
    const upsertMock = upsertGmsUsers as jest.Mock
    let member: User

    beforeAll(async () => {
      await cleanDB()
      const homeCom = await writeHomeCommunityEntry()
      homeCom.gmsApiKey = 'gms-test-key'
      await DbCommunity.save(homeCom)

      member = await userFactory(testEnv, bibiBloxberg)
      await User.update(
        { id: member.id },
        {
          gmsAllowed: true,
          location: gmsMemberLocation(),
          gmsRegistered: true,
          gmsRegisteredAt: new Date(),
          aboutMe: 'Ich baue Moebel aus Altholz.',
        },
      )

      CONFIG.GMS_ACTIVE = true
      upsertMock.mockResolvedValue(true)
      await mutate({
        mutation: login,
        variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
      })
    })

    afterAll(async () => {
      CONFIG.GMS_ACTIVE = false
      await cleanDB()
    })

    beforeEach(() => {
      upsertMock.mockClear()
    })

    it('sends the new text when they change it', async () => {
      await mutate({
        mutation: updateUserInfos,
        variables: { aboutMe: 'Ich repariere Fahrraeder.' },
      })

      expect(upsertMock).toHaveBeenCalledTimes(1)
      const [, gmsUsers] = upsertMock.mock.calls[0]
      expect(gmsUsers[0].aboutMe).toBe('Ich repariere Fahrraeder.')
    })

    it('sends the empty text when they delete it', async () => {
      await mutate({ mutation: updateUserInfos, variables: { aboutMe: null } })

      // The local row has to be cleared as well, otherwise the payload below could be
      // right for a reason that has nothing to do with the comparison being fixed.
      const stored = await User.findOneOrFail({ where: { id: member.id } })
      expect(stored.aboutMe).toBeNull()
      expect(upsertMock).toHaveBeenCalledTimes(1)
      const [, gmsUsers] = upsertMock.mock.calls[0]
      expect(gmsUsers[0].aboutMe).toBeNull()
    })
  })

  // A member who does not take part has no business being over there at all. The GMS
  // knows nothing of consent - it has no such column, and neither its name search nor
  // its map filters on one - so whether a member is findable is decided here and
  // nowhere else.
  describe('gms publishing for a member who does not take part', () => {
    const upsertMock = upsertGmsUsers as jest.Mock
    const deleteMock = deleteGmsUser as jest.Mock
    let member: User

    beforeAll(async () => {
      await cleanDB()
      const homeCom = await writeHomeCommunityEntry()
      homeCom.gmsApiKey = 'gms-test-key'
      await DbCommunity.save(homeCom)

      member = await userFactory(testEnv, bibiBloxberg)
      await User.update({ id: member.id }, { gmsAllowed: false, gmsRegistered: false })

      CONFIG.GMS_ACTIVE = true
      upsertMock.mockResolvedValue(true)
      deleteMock.mockResolvedValue(true)
      await mutate({
        mutation: login,
        variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
      })
    })

    afterAll(async () => {
      CONFIG.GMS_ACTIVE = false
      await cleanDB()
    })

    beforeEach(() => {
      upsertMock.mockClear()
      deleteMock.mockClear()
    })

    it('sends nothing when they edit their name', async () => {
      await mutate({ mutation: updateUserInfos, variables: { firstName: 'Benjamin' } })

      // The edit itself has to have gone through, otherwise both expectations below
      // would hold for a reason that has nothing to do with the gate. That the GMS is
      // reachable at all in this describe is what the next test proves - it expects a
      // call rather than the absence of one, on the same fixture.
      const stored = await User.findOneOrFail({ where: { id: member.id } })
      expect(stored.firstName).toBe('Benjamin')
      expect(upsertMock).not.toHaveBeenCalled()
      expect(deleteMock).not.toHaveBeenCalled()
    })

    it('removes a copy the GMS should never have been given', async () => {
      // What an upsert before the gate left behind: taking part switched off, yet
      // marked as published over there.
      await User.update({ id: member.id }, { gmsRegistered: true, gmsRegisteredAt: new Date() })

      await mutate({ mutation: updateUserInfos, variables: { firstName: 'Boris' } })

      expect(deleteMock).toHaveBeenCalledWith('gms-test-key', member.gradidoID)
      expect(upsertMock).not.toHaveBeenCalled()
      const stored = await User.findOneOrFail({ where: { id: member.id } })
      expect(stored.gmsRegistered).toBe(false)
    })
  })

  // Where the GMS answers, for the wallet's place search on the home map. It has to reach
  // exactly the members the token query turns away: whoever switched "findable" off, and
  // whoever the GMS has never been sent. Without the search they cannot set their home.
  describe('gms dashboard url', () => {
    const verifyMock = verifyAuthToken as jest.Mock
    const dashboardUrlBefore = CONFIG.GMS_DASHBOARD_URL
    let member: User

    beforeAll(async () => {
      await cleanDB()
      const homeCom = await writeHomeCommunityEntry()
      homeCom.gmsApiKey = 'gms-test-key'
      await DbCommunity.save(homeCom)

      member = await userFactory(testEnv, bibiBloxberg)
      await User.update({ id: member.id }, { gmsAllowed: false, gmsRegistered: false })
    })

    afterAll(async () => {
      CONFIG.GMS_ACTIVE = false
      CONFIG.GMS_DASHBOARD_URL = dashboardUrlBefore
      resetToken()
      await cleanDB()
    })

    describe('unauthenticated', () => {
      it('throws an error', async () => {
        resetToken()
        CONFIG.GMS_ACTIVE = true
        await expect(query({ query: gmsDashboardUrl })).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated, as a member who does not take part in the GMS', () => {
      beforeAll(async () => {
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
      })

      beforeEach(() => {
        verifyMock.mockReset()
        CONFIG.GMS_ACTIVE = true
        CONFIG.GMS_DASHBOARD_URL = 'https://gms.example.org'
      })

      it('hands out the configured address, closed with a slash', async () => {
        // The fixture itself, or the line below would hold for any member.
        const stored = await User.findOneOrFail({ where: { id: member.id } })
        expect(stored.gmsAllowed).toBe(false)

        await expect(query({ query: gmsDashboardUrl })).resolves.toMatchObject({
          errors: undefined,
          data: { gmsDashboardUrl: 'https://gms.example.org/' },
        })
      })

      it('asks the GMS nothing to do so', async () => {
        await query({ query: gmsDashboardUrl })

        expect(verifyMock).not.toHaveBeenCalled()
      })

      // The same fixture, the query next to it: that one does mint a token, with this
      // member's id. So the silence above is the new query's, not the mock's.
      it('while the token query next to it does ask', async () => {
        verifyMock.mockResolvedValue('a-token')

        await query({ query: authenticateGmsUserSearch })

        expect(verifyMock).toHaveBeenCalledWith('gms-test-key', expect.any(String))
      })

      it('answers null where this server has no GMS', async () => {
        CONFIG.GMS_ACTIVE = false

        await expect(query({ query: gmsDashboardUrl })).resolves.toMatchObject({
          errors: undefined,
          data: { gmsDashboardUrl: null },
        })
      })
    })
  })

  // What the quota is for: not tidiness, but somebody cycling through near-misses of a
  // popular name to catch payments meant for its owner. Every case below is about how
  // much of that a member can do in a year, and what it costs them.
  describe('taking, leaving and reclaiming a name', () => {
    let member: User

    beforeAll(async () => {
      await cleanDB()
      await writeHomeCommunityEntry()
      member = await userFactory(testEnv, bibiBloxberg)
      await mutate({
        mutation: login,
        variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
      })
    })

    afterAll(async () => {
      await cleanDB()
    })

    beforeEach(async () => {
      await UserAlias.delete({ userId: member.id })
      await User.update({ id: member.id }, { alias: 'BBB' })
    })

    const changeTo = async (alias: string) =>
      mutate({ mutation: updateUserInfos, variables: { alias } })

    const ownedNames = async () =>
      (await UserAlias.find({ where: { userId: member.id }, order: { id: 'ASC' } })).map(
        (row) => row.alias,
      )

    it('records the name it takes, not the one it leaves', async () => {
      await changeTo('bibi-one')

      expect(await ownedNames()).toEqual(['bibi-one'])
      const stored = await User.findOneByOrFail({ id: member.id })
      expect(stored.alias).toBe('bibi-one')
    })

    // Reclaiming moves the marker and writes nothing, because no name enters their
    // possession - which is why it costs none of the four.
    it('writes nothing when a member comes back to a name of their own', async () => {
      await changeTo('bibi-one')
      await changeTo('bibi-two')
      expect(await ownedNames()).toEqual(['bibi-one', 'bibi-two'])

      await changeTo('bibi-one')

      expect(await ownedNames()).toEqual(['bibi-one', 'bibi-two'])
      const stored = await User.findOneByOrFail({ id: member.id })
      expect(stored.alias).toBe('bibi-one')
    })

    // Ping-pong between two names one already owns is free and pointless: the count
    // neither rises nor resets, and it never exceeds two names.
    it('keeps the count steady however often somebody flips between two of their names', async () => {
      await changeTo('bibi-one')
      await changeTo('bibi-two')
      for (let round = 0; round < 3; round++) {
        await changeTo('bibi-one')
        await changeTo('bibi-two')
      }

      expect(await ownedNames()).toHaveLength(2)
    })

    it('refuses the fifth pick of the year', async () => {
      await changeTo('bibi-one')
      await changeTo('bibi-two')
      await changeTo('bibi-three')
      await changeTo('bibi-four')

      await expect(changeTo('bibi-five')).resolves.toEqual(
        expect.objectContaining({
          errors: [new GraphQLError('ALIAS_QUOTA_EXHAUSTED')],
        }),
      )
      const stored = await User.findOneByOrFail({ id: member.id })
      expect(stored.alias).toBe('bibi-four')
    })

    // A name handed out by the system is a proposal until it is adopted, so it must not
    // eat a pick - otherwise everyone would start the year with three instead of four.
    it('does not spend a pick on a name the system handed out', async () => {
      await UserAlias.save(
        UserAlias.create({
          userId: member.id,
          alias: 'BBB',
          origin: ALIAS_ORIGIN_ASSIGNED,
        }),
      )

      await expect(query({ query: aliasStatus })).resolves.toMatchObject({
        data: { aliasStatus: { changesLeft: 4, nextChangeAt: null } },
      })
    })

    // Keeping the built name answers the question the window at first login asks, which
    // is what stops it coming back - but it is not a pick and must cost none of the four
    // (NU-010/011). Both halves are the point, so both are asserted.
    it('settles the question when the member keeps the built name, and spends no pick', async () => {
      await UserAlias.save(
        UserAlias.create({
          userId: member.id,
          alias: 'BBB',
          origin: ALIAS_ORIGIN_ASSIGNED,
        }),
      )

      await expect(mutate({ mutation: adoptAlias })).resolves.toMatchObject({
        data: { adoptAlias: true },
      })

      await expect(query({ query: aliasStatus })).resolves.toMatchObject({
        data: { aliasStatus: { aliasSettled: true, changesLeft: 4 } },
      })
    })

    // The column ignores case, so changing only the capitalisation keeps the very same
    // row and writes nothing. Comparing with `===` in TypeScript stopped finding that
    // row, reported the question as unanswered, and put the window back on screen at
    // every page mount - with no way out of it but spending one of the four.
    it('stays settled when the member only changes the capitalisation', async () => {
      await changeTo('bibi-one')
      await expect(query({ query: aliasStatus })).resolves.toMatchObject({
        data: { aliasStatus: { aliasSettled: true } },
      })

      await changeTo('BIBI-ONE')

      const stored = await User.findOneByOrFail({ id: member.id })
      expect(stored.alias).toBe('BIBI-ONE')
      expect(await ownedNames()).toEqual(['bibi-one'])
      await expect(query({ query: aliasStatus })).resolves.toMatchObject({
        data: { aliasStatus: { aliasSettled: true, changesLeft: 3 } },
      })
    })

    // The quota blocks TAKING a name, not returning to one already owned - that writes
    // no row, so there is nothing to charge for.
    it('lets a member return to a name of their own after the quota is gone', async () => {
      await changeTo('bibi-one')
      await changeTo('bibi-two')
      await changeTo('bibi-three')
      await changeTo('bibi-four')
      await expect(query({ query: aliasStatus })).resolves.toMatchObject({
        data: { aliasStatus: { changesLeft: 0 } },
      })

      await changeTo('bibi-one')

      const stored = await User.findOneByOrFail({ id: member.id })
      expect(stored.alias).toBe('bibi-one')
    })

    // The resolver opens a transaction before it validates anything, so every way out
    // has to close it again. The most travelled one is the call that changes nothing: it
    // used to return without a rollback or a release and handed back a connection that
    // was still inside a REPEATABLE READ transaction.
    //
    // Watched at the runner rather than at the pool. Draining a pool only fails while
    // the pool stays smaller than the number of rounds, which is an assumption nobody
    // states and nobody maintains; this asserts the invariant itself - not one runner
    // this resolver made is left unreleased.
    const watchQueryRunners = () => {
      const dataSource = db.getDataSource()
      const create = dataSource.createQueryRunner.bind(dataSource)
      const created: QueryRunner[] = []
      const spy = jest.spyOn(dataSource, 'createQueryRunner').mockImplementation((mode) => {
        const runner = create(mode)
        jest.spyOn(runner, 'release')
        created.push(runner)
        return runner
      })
      return { created, stop: () => spy.mockRestore() }
    }

    it.each([
      ['nothing changed', 'BBB'],
      ['the name was refused', 'no'],
    ])('gives the connection back when %s', async (_case, alias) => {
      const watch = watchQueryRunners()
      try {
        await changeTo(alias)
      } finally {
        watch.stop()
      }

      expect(watch.created.length).toBeGreaterThan(0)
      for (const runner of watch.created) {
        expect(runner.release).toHaveBeenCalled()
      }
    })

    describe('the status query', () => {
      it('counts down as names are picked', async () => {
        await changeTo('bibi-one')

        await expect(query({ query: aliasStatus })).resolves.toMatchObject({
          data: { aliasStatus: { changesLeft: 3, nextChangeAt: null } },
        })
      })

      // The window rolls, so the date is a year after the oldest pick still inside it -
      // not a year from today, which would keep somebody waiting too long.
      it('names the date the next pick becomes possible', async () => {
        await changeTo('bibi-one')
        await changeTo('bibi-two')
        await changeTo('bibi-three')
        await changeTo('bibi-four')

        const result = await query({ query: aliasStatus })
        expect(result.data.aliasStatus.changesLeft).toBe(0)
        expect(result.data.aliasStatus.nextChangeAt).not.toBeNull()

        const oldest = await UserAlias.findOneOrFail({
          where: { userId: member.id, origin: ALIAS_ORIGIN_CHOSEN },
          order: { createdAt: 'ASC' },
        })
        const expected = new Date(oldest.createdAt.getTime() + 365 * 24 * 60 * 60 * 1000)
        expect(new Date(result.data.aliasStatus.nextChangeAt).getTime()).toBeCloseTo(
          expected.getTime(),
          -3,
        )
      })
    })
  })

  // checkUsername now has to know who is asking: a member may reclaim an alias they
  // held before, so the query skips their own history rows. That identity only exists
  // behind the token, which is why the right moved out of INALIENABLE_RIGHTS - and why
  // these tests sign in first.
  describe('check username', () => {
    beforeAll(async () => {
      await cleanDB()
      await userFactory(testEnv, bibiBloxberg)
      await mutate({
        mutation: login,
        variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
      })
    })

    afterAll(async () => {
      await cleanDB()
    })

    describe('reserved alias', () => {
      it('returns false', async () => {
        await expect(
          query({ query: checkUsername, variables: { username: 'root' } }),
        ).resolves.toMatchObject({
          data: {
            checkUsername: false,
          },
          errors: undefined,
        })
      })
    })

    describe('valid alias', () => {
      it('returns true', async () => {
        await expect(
          query({ query: checkUsername, variables: { username: 'valid' } }),
        ).resolves.toMatchObject({
          data: {
            checkUsername: true,
          },
          errors: undefined,
        })
      })
    })
  })
})

describe('printTimeDuration', () => {
  it('works with 10 minutes', () => {
    expect(printTimeDuration(10)).toBe('10 minutes')
  })

  it('works with 1440 minutes', () => {
    expect(printTimeDuration(1440)).toBe('24 hours')
  })

  it('works with 1410 minutes', () => {
    expect(printTimeDuration(1410)).toBe('23 hours and 30 minutes')
  })
})
