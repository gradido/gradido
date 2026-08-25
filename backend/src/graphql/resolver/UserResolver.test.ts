import { GmsPublishLocationType } from '@enum/GmsPublishLocationType'
import { OptInType } from '@enum/OptInType'
import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import { RoleNames } from '@enum/RoleNames'
import { UserContactType } from '@enum/UserContactType'
import { ContributionLink } from '@model/ContributionLink'
import { Location } from '@model/Location'
import { cleanDB, headerPushMock, resetToken, testEnvironment } from '@test/helpers'
import { UserInputError } from 'apollo-server-express'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { getLogger } from 'config-schema/test/testSetup'
import {
  objectValuesToArray,
  sendAccountActivationEmail,
  sendAccountMultiRegistrationEmail,
  sendResetPasswordEmail,
} from 'core'
import {
  ALIAS_ORIGIN_ASSIGNED,
  ALIAS_ORIGIN_CHOSEN,
  AppDatabase,
  Community as DbCommunity,
  Event as DbEvent,
  dbInsertMatchingEntry,
  TransactionLink,
  User,
  UserAlias,
  UserContact,
  UserRole,
} from 'database'
import { GraphQLError } from 'graphql'
import { AVATAR_FULL_MAX_BYTES, AVATAR_SMALL_MAX_BYTES } from 'shared'
import { QueryRunner } from 'typeorm'
import { v4 as uuidv4, validate as validateUUID, version as versionUUID } from 'uuid'
import { deleteGmsUser, upsertGmsUsers } from '@/apis/gms/GmsClient'
import { subscribe } from '@/apis/KlicktippController'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { EventType } from '@/event/Events'
import { PublishNameType } from '@/graphql/enum/PublishNameType'
import { SecretKeyCryptographyCreateKey } from '@/password/EncryptorUtils'
import { encryptPassword } from '@/password/PasswordEncryptor'
import { writeHomeCommunityEntry } from '@/seeds/community'
import { contributionLinkFactory } from '@/seeds/factory/contributionLink'
import { transactionLinkFactory } from '@/seeds/factory/transactionLink'
import { userFactory } from '@/seeds/factory/user'
import {
  adoptAlias,
  confirmContribution,
  createContribution,
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
  avatarFull,
  checkUsername,
  memberAvatars,
  queryOptIn,
  searchAdminUsers,
  searchUsers,
  userAboutMe,
  userAvatar,
  user as userQuery,
  verifyLogin,
  verifyLoginAboutMe,
  verifyLoginAvatar,
} from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { stephenHawking } from '@/seeds/users/stephen-hawking'
import { printTimeDuration } from '@/util/time'
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
    deleteGmsUser: jest.fn(),
  }
})

jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    sendAccountActivationEmail: jest.fn(),
    sendAccountMultiRegistrationEmail: jest.fn(),
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
const createUserLogger = resolverLogger('createUser')
const setPasswordLogger = resolverLogger('setPassword')
const loginLogger = resolverLogger('login')
const forgotPasswordLogger = resolverLogger('forgotPassword')
const updateUserInfosLogger = resolverLogger('updateUserInfos')
const sendActivationEmailLogger = resolverLogger('sendActivationEmail')
const findUserByEmailLogger = resolverLogger('findUserByEmail')
const logErrorLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

CONFIG.EMAIL_CODE_REQUEST_TIME = 10

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
    let homeCom: DbCommunity

    beforeAll(async () => {
      jest.clearAllMocks()
      homeCom = await writeHomeCommunityEntry()
      result = await mutate({ mutation: createUser, variables })
    })

    afterAll(async () => {
      await cleanDB()
    })

    it('returns success', () => {
      expect(result).toEqual(
        expect.objectContaining({ data: { createUser: { id: expect.any(Number) } } }),
      )
    })

    describe('valid input data', () => {
      // let loginEmailOptIn: LoginEmailOptIn[]
      beforeAll(async () => {
        user = await User.find({ relations: ['emailContact', 'userRoles'] })
        // loginEmailOptIn = await LoginEmailOptIn.find()
        emailVerificationCode = user[0].emailContact.emailVerificationCode.toString()
      })

      describe('filling all tables', () => {
        it('saves the user in users table', () => {
          expect(user).toEqual([
            {
              id: expect.any(Number),
              gradidoID: expect.any(String),
              hideAmountGDD: expect.any(Boolean),
              hideAmountGDT: expect.any(Boolean),
              // Built from the name rather than left empty: everybody holds one from
              // registration on, or their transaction rows would have nothing where a
              // name belongs.
              alias: 'PeterL',
              emailContact: expect.any(UserContact), // 'peter@lustig.de',
              emailId: expect.any(Number),
              firstName: 'Peter',
              lastName: 'Lustig',
              aboutMe: null,
              // On from the start: a member who uploads a picture has already shown an
              // intention, so the switch follows rather than asks a second time.
              avatarVisibleToMembers: true,
              gender: null,
              salutation: null,
              creaSignature: null,
              password: '0',
              createdAt: expect.any(Date),
              // emailChecked: false,
              language: 'de',
              userRoles: [],
              deletedAt: null,
              publisherId: 1234,
              referrerId: null,
              contributionLinkId: null,
              passwordEncryptionType: PasswordEncryptionType.NO_PASSWORD,
              communityUuid: homeCom.communityUuid,
              foreign: false,
              gmsAllowed: true,
              humhubAllowed: true,
              gmsPublishName: 0,
              humhubPublishName: 0,
              gmsPublishLocation: 2,
              location: null,
              gmsRegistered: false,
              gmsRegisteredAt: null,
            },
          ])
          const valUUID = validateUUID(user[0].gradidoID)
          const verUUID = versionUUID(user[0].gradidoID)
          expect(valUUID).toEqual(true)
          expect(verUUID).toEqual(4)
        })

        it('creates an email contact', () => {
          expect(user[0].emailContact).toEqual({
            id: expect.any(Number),
            type: UserContactType.USER_CONTACT_EMAIL,
            userId: user[0].id,
            email: 'peter@lustig.de',
            emailChecked: false,
            emailVerificationCode: expect.any(String),
            emailOptInTypeId: OptInType.EMAIL_OPT_IN_REGISTER,
            emailResendCount: 0,
            changeVetoCode: null,
            countryCode: null,
            phone: null,
            createdAt: expect.any(Date),
            deletedAt: null,
            updatedAt: null,
            gmsPublishEmail: false,
            gmsPublishPhone: 0,
          })
        })
      })

      it('stores the USER_REGISTER event in the database', async () => {
        const userConatct = await UserContact.findOneOrFail({
          where: {
            email: 'peter@lustig.de',
          },
          relations: ['user'],
        })
        await expect(DbEvent.find()).resolves.toContainEqual(
          expect.objectContaining({
            type: EventType.USER_REGISTER,
            affectedUserId: userConatct.user.id,
            actingUserId: userConatct.user.id,
          }),
        )
      })
    })

    describe('account activation email', () => {
      it('sends an account activation email', () => {
        const activationLink = `${
          CONFIG.EMAIL_LINK_VERIFICATION
        }${emailVerificationCode.toString()}`

        expect(sendAccountActivationEmail).toBeCalledWith({
          firstName: 'Peter',
          lastName: 'Lustig',
          email: 'peter@lustig.de',
          language: 'de',
          activationLink,
          timeDurationObject: expect.objectContaining({
            hours: expect.any(Number),
            minutes: expect.any(Number),
          }),
        })
      })

      it('stores the EMAIL_CONFIRMATION event in the database', async () => {
        await expect(DbEvent.find()).resolves.toContainEqual(
          expect.objectContaining({
            type: EventType.EMAIL_CONFIRMATION,
            affectedUserId: user[0].id,
            actingUserId: user[0].id,
          }),
        )
      })
    })

    describe('user already exists', () => {
      let mutation: any
      beforeAll(async () => {
        mutation = await mutate({ mutation: createUser, variables })
      })

      it('logs an info', () => {
        expect(createUserLogger.info).toBeCalledWith('User already exists')
        expect(createUserLogger.addContext).toBeCalledWith('user', user[0].id)
      })

      it('sends an account multi registration email without the helper branch', () => {
        // No redeem code on this attempt, so no helper link (EM-013): the mail renders
        // exactly as it always has.
        expect(sendAccountMultiRegistrationEmail).toBeCalledWith({
          firstName: 'Peter',
          lastName: 'Lustig',
          email: 'peter@lustig.de',
          language: 'de',
          helperLink: null,
        })
      })

      it('results with partly faked user with random "id"', () => {
        expect(mutation).toEqual(
          expect.objectContaining({
            data: {
              createUser: {
                id: expect.any(Number),
              },
            },
          }),
        )
      })

      it('stores the EMAIL_ACCOUNT_MULTIREGISTRATION event in the database', async () => {
        const userConatct = await UserContact.findOneOrFail({
          where: { email: 'peter@lustig.de' },
          relations: ['user'],
        })
        await expect(DbEvent.find()).resolves.toContainEqual(
          expect.objectContaining({
            type: EventType.EMAIL_ACCOUNT_MULTIREGISTRATION,
            affectedUserId: userConatct.user.id,
            actingUserId: 0,
          }),
        )
      })
    })

    describe('unknown language', () => {
      it('sets "de" as default language', async () => {
        await mutate({
          mutation: createUser,
          variables: { ...variables, email: 'bibi@bloxberg.de', language: 'xx' },
        })
        await expect(
          UserContact.findOne({ where: { email: 'bibi@bloxberg.de' }, relations: ['user'] }),
        ).resolves.toEqual(
          expect.objectContaining({
            email: 'bibi@bloxberg.de',
            user: expect.objectContaining({ language: 'de' }),
          }),
        )
      })
    })

    describe('no publisher id', () => {
      it('sets publisher id to 0', async () => {
        await mutate({
          mutation: createUser,
          variables: { ...variables, email: 'raeuber@hotzenplotz.de', publisherId: undefined },
        })
        await expect(User.find({ relations: ['emailContact'] })).resolves.toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              emailContact: expect.objectContaining({
                email: 'raeuber@hotzenplotz.de',
              }),
              publisherId: 0,
            }),
          ]),
        )
      })
    })

    describe('redeem codes', () => {
      let result: any
      let link: ContributionLink

      describe('contribution link', () => {
        beforeAll(async () => {
          // activate account of admin Peter Lustig
          await mutate({
            mutation: setPassword,
            variables: { code: emailVerificationCode, password: 'Aa12345_' },
          })

          // make Peter Lustig Admin
          const peter = await User.findOneOrFail({
            where: { id: user[0].id },
            relations: ['userRoles'],
          })
          peter.userRoles = [] as UserRole[]
          peter.userRoles[0] = UserRole.create()
          peter.userRoles[0].createdAt = new Date()
          peter.userRoles[0].role = RoleNames.ADMIN
          peter.userRoles[0].userId = peter.id
          await peter.userRoles[0].save()

          // date statement
          const actualDate = new Date()
          const futureDate = new Date() // Create a future day from the executed day
          futureDate.setDate(futureDate.getDate() + 1)

          // factory logs in as Peter Lustig
          link = await contributionLinkFactory(testEnv, {
            name: 'Dokumenta 2022',
            memo: 'Vielen Dank für deinen Besuch bei der Dokumenta 2022',
            amount: 200,
            validFrom: actualDate,
            validTo: futureDate,
          })
          resetToken()
          result = await mutate({
            mutation: createUser,
            variables: { ...variables, email: 'ein@besucher.de', redeemCode: 'CL-' + link.code },
          })
        })

        afterAll(async () => {
          await cleanDB()
        })

        it('sets the contribution link id', async () => {
          await expect(
            UserContact.findOne({ where: { email: 'ein@besucher.de' }, relations: ['user'] }),
          ).resolves.toEqual(
            expect.objectContaining({
              user: expect.objectContaining({
                contributionLinkId: link.id,
              }),
            }),
          )
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

        it('stores the USER_REGISTER_REDEEM event in the database', async () => {
          await expect(DbEvent.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventType.USER_REGISTER_REDEEM,
              affectedUserId: result.data.createUser.id,
              actingUserId: result.data.createUser.id,
              involvedContributionLinkId: link.id,
            }),
          )
        })
      })

      describe('transaction link', () => {
        let contribution: any
        let bob: any
        let transactionLink: TransactionLink
        let newUser: any

        const bobData = {
          email: 'bob@baumeister.de',
          password: 'Aa12345_',
          publisherId: 1234,
        }

        const peterData = {
          email: 'peter@lustig.de',
          password: 'Aa12345_',
          publisherId: 1234,
        }

        beforeAll(async () => {
          await userFactory(testEnv, peterLustig)
          await userFactory(testEnv, bobBaumeister)
          await mutate({ mutation: login, variables: bobData })

          // create contribution as user bob
          contribution = await mutate({
            mutation: createContribution,
            variables: {
              amount: '1000',
              memo: 'testing',
              contributionDate: new Date().toISOString(),
            },
          })

          // login as admin
          await mutate({ mutation: login, variables: peterData })

          // confirm the contribution
          contribution = await mutate({
            mutation: confirmContribution,
            variables: { id: contribution.data.createContribution.id },
          })

          // login as user bob
          bob = await mutate({ mutation: login, variables: bobData })

          // create transaction link
          await transactionLinkFactory(testEnv, {
            email: 'bob@baumeister.de',
            amount: 19.99,
            memo: `testing transaction link`,
          })

          transactionLink = await TransactionLink.findOneOrFail({ where: { userId: bob.id } })
          resetToken()

          // create new user using transaction link of bob
          newUser = await mutate({
            mutation: createUser,
            variables: {
              ...variables,
              email: 'which@ever.de',
              redeemCode: transactionLink.code,
            },
          })
        })

        it('sets the referrer id to bob baumeister id', async () => {
          await expect(
            UserContact.findOne({ where: { email: 'which@ever.de' }, relations: ['user'] }),
          ).resolves.toEqual(
            expect.objectContaining({
              user: expect.objectContaining({ referrerId: transactionLink.userId }), // bob.data.login.id }),
            }),
          )
        })

        it('stores the USER_REGISTER_REDEEM event in the database', async () => {
          await expect(DbEvent.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventType.USER_REGISTER_REDEEM,
              affectedUserId: newUser.data.createUser.id,
              actingUserId: newUser.data.createUser.id,
              involvedTransactionLinkId: transactionLink.id,
            }),
          )
        })
      })

      /* A transaction link requires GDD on account
      describe('transaction link', () => {
        let code: string
        beforeAll(async () => {
          // factory logs in as Peter Lustig
          await transactionLinkFactory(testEnv, {
            email: 'peter@lustig.de',
            amount: '19.99',
            memo: `Kein Trick, keine Zauberrei,
    bei Gradidio sei dabei!`,
          })
          const transactionLink = await TransactionLink.findOneOrFail()
          resetToken()
          await mutate({
            mutation: createUser,
            variables: { ...variables, email: 'neuer@user.de', redeemCode: transactionLink.code },
          })          
        })
    
        it('sets the referrer id to Peter Lustigs id', async () => {
          await expect(User.findOne({ email: 'neuer@user.de' })).resolves.toEqual(expect.objectContaining({
            referrerId: user[0].id,
          }))
        })
      })
    
      */
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
                'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
              ),
            ],
          }),
        )
      })

      it('logs the error thrown', () => {
        expect(logErrorLogger.error).toBeCalledWith(
          'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
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

      it('logs the error found', () => {
        expect(findUserByEmailLogger.warn).toBeCalledWith(
          `findUserByEmail failed, user with email=${variables.email} not found`,
        )
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
                gmsAllowed: true,
                gmsPublishLocation: 'GMS_LOCATION_TYPE_RANDOM',
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
                roles: [],
                userLocation: null,
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

      it('returns an error', () => {
        expect(result).toEqual(
          expect.objectContaining({
            errors: [
              new GraphQLError('This user was permanently deleted. Contact support for questions'),
            ],
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
          user = await User.find({ relations: ['userRoles'] })
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
                  klickTipp: {
                    newsletterState: false,
                  },
                  hasElopage: false,
                  publisherId: 1234,
                  roles: [],
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
              gmsAllowed: true,
              gmsPublishName: PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS,
              gmsPublishLocation: GmsPublishLocationType.GMS_LOCATION_TYPE_RANDOM,
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
                gmsAllowed: true,
                gmsPublishName: PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS,
                gmsPublishLocation: GmsPublishLocationType.GMS_LOCATION_TYPE_RANDOM,
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
                gmsAllowed: true,
                gmsPublishName: PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS,
                gmsPublishLocation: GmsPublishLocationType.GMS_LOCATION_TYPE_RANDOM,
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
                  GmsPublishLocationType[GmsPublishLocationType.GMS_LOCATION_TYPE_RANDOM],
              },
            })
            await expect(User.find()).resolves.toEqual([
              expect.objectContaining({
                gmsAllowed: true,
                gmsPublishName: PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS,
                location: Location2Point(loc),
                gmsPublishLocation: GmsPublishLocationType.GMS_LOCATION_TYPE_RANDOM,
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
                    'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
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
      beforeAll(async () => {
        await userFactory(testEnv, bibiBloxberg)
        await userFactory(testEnv, peterLustig)
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
                  expect.objectContaining({
                    firstName: 'Peter',
                    lastName: 'Lustig',
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
            password: (
              await SecretKeyCryptographyCreateKey(bibi.gradidoID.toString(), 'Aa12345_')
            ).toString(),
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
        bibi.password = await SecretKeyCryptographyCreateKey('bibi@bloxberg.de', 'Aa12345_')

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
            password: (
              await SecretKeyCryptographyCreateKey(bibi.gradidoID.toString(), 'Aa12345_')
            ).toString(),
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
                gmsAllowed: true,
                gmsPublishLocation: 'GMS_LOCATION_TYPE_RANDOM',
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
                roles: [],
                userLocation: null,
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
                expect(result).toEqual(
                  expect.objectContaining({
                    data: {
                      setUserRole: RoleNames.MODERATOR,
                    },
                  }),
                )
                expect(new Date(result.data.setUserRole)).toEqual(expect.any(Date))
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
              it('returns null', async () => {
                await expect(
                  mutate({ mutation: setUserRole, variables: { userId: user.id, role: null } }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    data: {
                      setUserRole: null,
                    },
                  }),
                )
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
                    new UserInputError(
                      'Variable "$role" got invalid value "unknown rolename"; Value "unknown rolename" does not exist in "RoleNames" enum.',
                    ),
                  ],
                }),
              )
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
      await DbCommunity.clear()
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

  // The profile picture the member sets for their own account. Own view only: nothing
  // hands it to anybody else, which is the boundary this delivery deliberately keeps.
  describe('user avatar', () => {
    // A minimal but real JPEG head. The resolver checks the magic bytes, so anything
    // that is not one would be rejected for the right reason and prove nothing.
    const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0xff, 0xd9])
    const JPEG_BASE64 = JPEG.toString('base64')
    // The full rendition has to differ from the small one, or a resolver handing back the
    // wrong column would pass every assertion below.
    const JPEG_FULL = Buffer.from([
      0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10, 0x45, 0x78, 0x69, 0xff, 0xd9,
    ])
    const JPEG_FULL_BASE64 = JPEG_FULL.toString('base64')
    const bothPictures = { avatarSmall: JPEG_BASE64, avatarFull: JPEG_FULL_BASE64 }

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
    })
  })

  // Leaving the GMS removes the member and everything of theirs over there. Joining again
  // therefore has to hand the GMS a whole member, entries included - the two mutations
  // below are one story and run in order.
  describe('gms consent withdrawn and given again', () => {
    const ENTRY_UUID = 'b6f0c1d2-3e4a-4b5c-8d9e-0f1a2b3c4d5e'
    const upsertMock = upsertGmsUsers as jest.Mock
    const deleteMock = deleteGmsUser as jest.Mock
    let member: User

    beforeAll(async () => {
      await cleanDB()
      const homeCom = await writeHomeCommunityEntry()
      homeCom.gmsApiKey = 'gms-test-key'
      await DbCommunity.save(homeCom)

      member = await userFactory(testEnv, bibiBloxberg)
      // The member is already published over there, and has one live entry with them.
      await User.update({ id: member.id }, { gmsRegistered: true, gmsRegisteredAt: new Date() })
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

      await mutate({ mutation: updateUserInfos, variables: { gmsAllowed: true } })

      expect(upsertMock).toHaveBeenCalledTimes(1)
      const [, gmsUsers] = upsertMock.mock.calls[0]
      // Without the entries the GMS keeps what it has - and after the delete above that
      // is nothing, so the member's offer would be gone from every search.
      expect(gmsUsers[0].matchingEntries).toEqual([
        expect.objectContaining({ uuid: ENTRY_UUID, summary: 'Lastenrad zum Ausleihen' }),
      ])
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
          communityUuid: member.communityUuid,
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
          communityUuid: member.communityUuid,
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
