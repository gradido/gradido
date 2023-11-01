/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Connection } from '@dbTools/typeorm'
import { Community as DbCommunity } from '@entity/Community'
import { Event as DbEvent } from '@entity/Event'
import { TransactionLink } from '@entity/TransactionLink'
import { User } from '@entity/User'
import { UserContact } from '@entity/UserContact'
import { UserRole } from '@entity/UserRole'
import { UserInputError } from 'apollo-server-express'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { GraphQLError } from 'graphql'
import { v4 as uuidv4, validate as validateUUID, version as versionUUID } from 'uuid'

import { OptInType } from '@enum/OptInType'
import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import { RoleNames } from '@enum/RoleNames'
import { UserContactType } from '@enum/UserContactType'
import { ContributionLink } from '@model/ContributionLink'
import { testEnvironment, headerPushMock, resetToken, cleanDB } from '@test/helpers'
import { logger, i18n as localization } from '@test/testSetup'

import { subscribe } from '@/apis/KlicktippController'
import { CONFIG } from '@/config'
import {
  sendAccountActivationEmail,
  sendAccountMultiRegistrationEmail,
  sendResetPasswordEmail,
} from '@/emails/sendEmailVariants'
import { EventType } from '@/event/Events'
import { SecretKeyCryptographyCreateKey } from '@/password/EncryptorUtils'
import { encryptPassword } from '@/password/PasswordEncryptor'
import { contributionLinkFactory } from '@/seeds/factory/contributionLink'
import { transactionLinkFactory } from '@/seeds/factory/transactionLink'
import { userFactory } from '@/seeds/factory/user'
import {
  login,
  logout,
  createUser,
  setPassword,
  forgotPassword,
  updateUserInfos,
  createContribution,
  confirmContribution,
  setUserRole,
  deleteUser,
  unDeleteUser,
  sendActivationEmail,
} from '@/seeds/graphql/mutations'
import {
  verifyLogin,
  queryOptIn,
  searchAdminUsers,
  searchUsers,
  user as userQuery,
  checkUsername,
} from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { stephenHawking } from '@/seeds/users/stephen-hawking'
import { printTimeDuration } from '@/util/time'
import { objectValuesToArray } from '@/util/utilities'

jest.mock('@/emails/sendEmailVariants', () => {
  const originalModule = jest.requireActual('@/emails/sendEmailVariants')
  return {
    __esModule: true,
    ...originalModule,
    sendAccountActivationEmail: jest.fn((a) => originalModule.sendAccountActivationEmail(a)),
    sendAccountMultiRegistrationEmail: jest.fn((a) =>
      originalModule.sendAccountMultiRegistrationEmail(a),
    ),
    sendResetPasswordEmail: jest.fn((a) => originalModule.sendResetPasswordEmail(a)),
  }
})

jest.mock('@/apis/KlicktippController', () => {
  return {
    __esModule: true,
    subscribe: jest.fn(),
    getKlickTippUser: jest.fn(),
  }
})

let admin: User
let user: User
let mutate: ApolloServerTestClient['mutate'],
  query: ApolloServerTestClient['query'],
  con: Connection
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: Connection
}

beforeAll(async () => {
  testEnv = await testEnvironment(logger, localization)
  mutate = testEnv.mutate
  query = testEnv.query
  con = testEnv.con
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await con.close()
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
              alias: null,
              emailContact: expect.any(UserContact), // 'peter@lustig.de',
              emailId: expect.any(Number),
              firstName: 'Peter',
              lastName: 'Lustig',
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
              communityUuid: null,
              foreign: false,
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
            phone: null,
            createdAt: expect.any(Date),
            deletedAt: null,
            updatedAt: null,
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
        const activationLink = CONFIG.EMAIL_LINK_VERIFICATION.replace(
          /{optin}/g,
          emailVerificationCode,
        ).replace(/{code}/g, '')
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
        expect(logger.info).toBeCalledWith('User already exists with this email=peter@lustig.de')
      })

      it('sends an account multi registration email', () => {
        expect(sendAccountMultiRegistrationEmail).toBeCalledWith({
          firstName: 'Peter',
          lastName: 'Lustig',
          email: 'peter@lustig.de',
          language: 'de',
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
          variables: { ...variables, email: 'bibi@bloxberg.de', language: 'it' },
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
            variables: { amount: 1000, memo: 'testing', creationDate: new Date().toISOString() },
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
              user: expect.objectContaining({ referrerId: bob.data.login.id }),
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
            amount: 19.99,
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

      it('updates the password', () => {
        const encryptedPass = encryptPassword(newUser, 'Aa12345_')
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
        expect(logger.error).toBeCalledWith(
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
        expect(logger.error).toBeCalledWith('Could not login with emailVerificationCode')
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
        expect(await mutate({ mutation: login, variables })).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('No user with this credentials')],
          }),
        )
      })

      it('logs the error found', () => {
        expect(logger.error).toBeCalledWith('No user with this credentials', variables.email)
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
                firstName: 'Bibi',
                hasElopage: false,
                id: expect.any(Number),
                klickTipp: {
                  newsletterState: false,
                },
                language: 'de',
                lastName: 'Bloxberg',
                publisherId: 1234,
                roles: [],
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

      it('logs the error thrown', () => {
        expect(logger.error).toBeCalledWith('No user with this credentials', variables.email)
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

      it('logs the error thrown', () => {
        expect(logger.error).toBeCalledWith(
          'This user was permanently deleted. Contact support for questions',
          expect.objectContaining({
            firstName: stephenHawking.firstName,
            lastName: stephenHawking.lastName,
          }),
        )
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

      it('logs the error thrown', () => {
        expect(logger.error).toBeCalledWith(
          'The Users email is not validate yet',
          expect.objectContaining({
            firstName: garrickOllivander.firstName,
            lastName: garrickOllivander.lastName,
          }),
        )
      })
    })

    // eslint-disable-next-line jest/no-disabled-tests
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

      it('logs the error thrown', () => {
        expect(logger.error).toBeCalledWith(
          'The User has not set a password yet',
          expect.objectContaining({
            firstName: bibiBloxberg.firstName,
            lastName: bibiBloxberg.lastName,
          }),
        )
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
        await userFactory(testEnv, bibiBloxberg)
      })

      afterAll(async () => {
        await cleanDB()
        CONFIG.EMAIL_CODE_REQUEST_TIME = emailCodeRequestTime
      })

      describe('duration not expired', () => {
        it('throws an error', async () => {
          await expect(mutate({ mutation: forgotPassword, variables })).resolves.toEqual(
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
          await expect(mutate({ mutation: forgotPassword, variables })).resolves.toEqual(
            expect.objectContaining({
              data: {
                forgotPassword: true,
              },
            }),
          )
        })

        it('sends reset password email', () => {
          expect(sendResetPasswordEmail).toBeCalledWith({
            firstName: 'Bibi',
            lastName: 'Bloxberg',
            email: 'bibi@bloxberg.de',
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
            where: { email: 'bibi@bloxberg.de' },
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
        it('thows an error', async () => {
          CONFIG.EMAIL_CODE_REQUEST_TIME = emailCodeRequestTime
          await expect(mutate({ mutation: forgotPassword, variables })).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('Email already sent less than 10 minutes ago')],
            }),
          )
        })

        it('logs the error found', () => {
          expect(logger.error).toBeCalledWith(`Email already sent less than 10 minutes ago`)
        })
      })
    })
  })

  describe('queryOptIn', () => {
    let emailContact: UserContact

    beforeAll(async () => {
      await userFactory(testEnv, bibiBloxberg)
      emailContact = await UserContact.findOneOrFail({ where: { email: bibiBloxberg.email } })
    })

    afterAll(async () => {
      await cleanDB()
    })

    describe('wrong optin code', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        await expect(
          query({ query: queryOptIn, variables: { optIn: 'not-valid' } }),
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
            variables: { optIn: emailContact.emailVerificationCode.toString() },
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
        await expect(mutate({ mutation: updateUserInfos })).resolves.toEqual(
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
        await expect(mutate({ mutation: updateUserInfos })).resolves.toEqual(
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
            await mutate({
              mutation: updateUserInfos,
              variables: {
                alias: 'bibi_Bloxberg',
              },
            })
            await expect(User.find()).resolves.toEqual([
              expect.objectContaining({
                alias: 'bibi_Bloxberg',
              }),
            ])
          })
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
              errors: [new GraphQLError('Given language is not a valid language')],
            }),
          )
        })

        it('logs the error found', () => {
          expect(logger.error).toBeCalledWith('Given language is not a valid language', 'not-valid')
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

          it('logs the error found', () => {
            expect(logger.error).toBeCalledWith(`Old password is invalid`)
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

          it('logs the error found', () => {
            expect(logger.error).toBeCalledWith(
              'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
            )
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

          it('logs the error thrown', () => {
            expect(logger.error).toBeCalledWith(
              'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
            )
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
            password: SecretKeyCryptographyCreateKey(bibi.gradidoID.toString(), 'Aa12345_')[0]
              .readBigUInt64LE()
              .toString(),
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
        bibi.password = SecretKeyCryptographyCreateKey(
          'bibi@bloxberg.de',
          'Aa12345_',
        )[0].readBigUInt64LE()

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
            password: SecretKeyCryptographyCreateKey(bibi.gradidoID.toString(), 'Aa12345_')[0]
              .readBigUInt64LE()
              .toString(),
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
                firstName: 'Bibi',
                hasElopage: false,
                id: expect.any(Number),
                klickTipp: {
                  newsletterState: false,
                },
                language: 'de',
                lastName: 'Bloxberg',
                publisherId: 1234,
                roles: [],
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
            expect(logger.error).toBeCalledWith('Could not find user with given ID', admin.id + 1)
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
              expect(logger.error).toBeCalledWith('Administrator can not change his own role')
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
                expect(logger.error).toBeCalledWith('User already has role=', RoleNames.ADMIN)
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
                expect(logger.error).toBeCalledWith('User already has role=', RoleNames.MODERATOR)
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
                expect(logger.error).toBeCalledWith('User is already an usual user')
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
            expect(logger.error).toBeCalledWith('Could not find user with given ID', admin.id + 1)
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
            expect(logger.error).toBeCalledWith('Moderator can not delete his own account')
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
              expect(logger.error).toBeCalledWith('Could not find user with given ID', user.id)
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
            expect(logger.error).toBeCalledWith('No user with this credentials', 'invalid')
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

          it('logs the error thrown', () => {
            expect(logger.error).toBeCalledWith(
              'User with given email contact is deleted',
              'stephen@hawking.uk',
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
            const userConatct = await UserContact.findOneOrFail({
              where: { email: 'bibi@bloxberg.de' },
              relations: ['user'],
            })
            const activationLink = CONFIG.EMAIL_LINK_VERIFICATION.replace(
              /{optin}/g,
              userConatct.emailVerificationCode.toString(),
            ).replace(/{code}/g, '')
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
            const userConatct = await UserContact.findOneOrFail({
              where: { email: 'bibi@bloxberg.de' },
              relations: ['user'],
            })
            await expect(DbEvent.find()).resolves.toContainEqual(
              expect.objectContaining({
                type: EventType.EMAIL_ADMIN_CONFIRMATION,
                affectedUserId: userConatct.user.id,
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
            expect(logger.error).toBeCalledWith('Could not find user with given ID', admin.id + 1)
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
            expect(logger.error).toBeCalledWith('User is not deleted')
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
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
        expect(logger.error).toBeCalledWith('401 Unauthorized')
      })
    })

    describe('authenticated', () => {
      const uuid = uuidv4()

      beforeAll(async () => {
        user = await userFactory(testEnv, bibiBloxberg)
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
        await mutate({
          mutation: updateUserInfos,
          variables: {
            alias: 'bibi',
          },
        })
      })

      describe('identifier is no gradido ID, no email and no alias', () => {
        it('throws and logs "Unknown identifier type" error', async () => {
          await expect(
            query({
              query: userQuery,
              variables: {
                identifier: 'identifier_is_no_valid_alias!',
                communityIdentifier: homeCom1.communityUuid,
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('Unknown identifier type')],
            }),
          )
          expect(logger.error).toBeCalledWith(
            'Unknown identifier type',
            'identifier_is_no_valid_alias!',
          )
        })
      })

      describe('identifier is not found', () => {
        it('throws and logs "No user found to given identifier" error', async () => {
          await expect(
            query({
              query: userQuery,
              variables: {
                identifier: uuid,
                communityIdentifier: homeCom1.communityUuid,
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('No user found to given identifier(s)')],
            }),
          )
          expect(logger.error).toBeCalledWith(
            'No user found to given identifier(s)',
            uuid,
            homeCom1.communityUuid,
          )
        })
      })

      describe('identifier is found via email, but not matching community', () => {
        it('returns user', async () => {
          await expect(
            query({
              query: userQuery,
              variables: {
                identifier: 'bibi@bloxberg.de',
                communityIdentifier: foreignCom1.communityUuid,
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [
                new GraphQLError('Found user to given contact, but belongs to other community'),
              ],
            }),
          )
          expect(logger.error).toBeCalledWith(
            'Found user to given contact, but belongs to other community',
            'bibi@bloxberg.de',
            foreignCom1.communityUuid,
          )
        })
      })

      describe('identifier is found via email', () => {
        it('returns user', async () => {
          await expect(
            query({
              query: userQuery,
              variables: {
                identifier: 'bibi@bloxberg.de',
                communityIdentifier: homeCom1.communityUuid,
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              data: {
                user: expect.objectContaining({
                  firstName: 'Bibi',
                  lastName: 'Bloxberg',
                }),
              },
              errors: undefined,
            }),
          )
        })
      })

      describe('identifier is found via gradidoID', () => {
        it('returns user', async () => {
          await expect(
            query({
              query: userQuery,
              variables: {
                identifier: user.gradidoID,
                communityIdentifier: homeCom1.communityUuid,
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              data: {
                user: expect.objectContaining({
                  firstName: 'Bibi',
                  lastName: 'Bloxberg',
                }),
              },
              errors: undefined,
            }),
          )
        })
      })

      describe('identifier is found via alias', () => {
        it('returns user', async () => {
          await expect(
            query({
              query: userQuery,
              variables: {
                identifier: 'bibi',
                communityIdentifier: homeCom1.communityUuid,
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              data: {
                user: expect.objectContaining({
                  firstName: 'Bibi',
                  lastName: 'Bloxberg',
                }),
              },
              errors: undefined,
            }),
          )
        })
      })
    })
  })

  describe('check username', () => {
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
