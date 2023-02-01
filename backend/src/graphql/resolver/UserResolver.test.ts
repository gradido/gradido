/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { objectValuesToArray } from '@/util/utilities'
import { testEnvironment, headerPushMock, resetToken, cleanDB } from '@test/helpers'
import { logger, i18n as localization } from '@test/testSetup'
import { printTimeDuration } from '@/util/time'
import { userFactory } from '@/seeds/factory/user'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
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
} from '@/seeds/graphql/mutations'
import { verifyLogin, queryOptIn, searchAdminUsers, searchUsers } from '@/seeds/graphql/queries'
import { GraphQLError } from 'graphql'
import { User } from '@entity/User'
import CONFIG from '@/config'
import {
  sendAccountActivationEmail,
  sendAccountMultiRegistrationEmail,
  sendResetPasswordEmail,
} from '@/emails/sendEmailVariants'
import { contributionLinkFactory } from '@/seeds/factory/contributionLink'
import { transactionLinkFactory } from '@/seeds/factory/transactionLink'
import { ContributionLink } from '@model/ContributionLink'
import { TransactionLink } from '@entity/TransactionLink'
import { EventProtocolType } from '@/event/EventProtocolType'
import { EventProtocol } from '@entity/EventProtocol'
import { validate as validateUUID, version as versionUUID } from 'uuid'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { UserContact } from '@entity/UserContact'
import { OptInType } from '../enum/OptInType'
import { UserContactType } from '../enum/UserContactType'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { stephenHawking } from '@/seeds/users/stephen-hawking'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { encryptPassword } from '@/password/PasswordEncryptor'
import { PasswordEncryptionType } from '../enum/PasswordEncryptionType'
import { SecretKeyCryptographyCreateKey } from '@/password/EncryptorUtils'

// import { klicktippSignIn } from '@/apis/KlicktippController'

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

/*

jest.mock('@/apis/KlicktippController', () => {
  return {
    __esModule: true,
    klicktippSignIn: jest.fn(),
  }
})
*/

let admin: User
let user: User
let mutate: any, query: any, con: any
let testEnv: any

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
        user = await User.find({ relations: ['emailContact'] })
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
              isAdmin: null,
              deletedAt: null,
              publisherId: 1234,
              referrerId: null,
              contributionLinkId: null,
              passwordEncryptionType: PasswordEncryptionType.NO_PASSWORD,
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

      it('stores the send confirmation event in the database', () => {
        expect(EventProtocol.find()).resolves.toContainEqual(
          expect.objectContaining({
            type: EventProtocolType.SEND_CONFIRMATION_EMAIL,
            userId: user[0].id,
          }),
        )
      })
    })

    describe('email already exists', () => {
      let mutation: User
      beforeAll(async () => {
        mutation = await mutate({ mutation: createUser, variables })
      })

      it('logs an info', async () => {
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

      it('results with partly faked user with random "id"', async () => {
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
    })

    describe('unknown language', () => {
      it('sets "de" as default language', async () => {
        await mutate({
          mutation: createUser,
          variables: { ...variables, email: 'bibi@bloxberg.de', language: 'it' },
        })
        await expect(
          UserContact.findOne({ email: 'bibi@bloxberg.de' }, { relations: ['user'] }),
        ).resolves.toEqual(
          expect.objectContaining({
            email: 'bibi@bloxberg.de',
            user: expect.objectContaining({ language: 'de' }),
          }),
        )
      })
    })

    describe('no publisher id', () => {
      it('sets publisher id to null', async () => {
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
              publisherId: null,
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
          const peter = await User.findOneOrFail({ id: user[0].id })
          peter.isAdmin = new Date()
          await peter.save()

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
            UserContact.findOne({ email: 'ein@besucher.de' }, { relations: ['user'] }),
          ).resolves.toEqual(
            expect.objectContaining({
              user: expect.objectContaining({
                contributionLinkId: link.id,
              }),
            }),
          )
        })

        it('stores the account activated event in the database', () => {
          expect(EventProtocol.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventProtocolType.ACTIVATE_ACCOUNT,
              userId: user[0].id,
            }),
          )
        })

        it('stores the redeem register event in the database', () => {
          expect(EventProtocol.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventProtocolType.REDEEM_REGISTER,
              userId: result.data.createUser.id,
              contributionId: link.id,
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

          transactionLink = await TransactionLink.findOneOrFail()

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
            UserContact.findOne({ email: 'which@ever.de' }, { relations: ['user'] }),
          ).resolves.toEqual(
            expect.objectContaining({
              user: expect.objectContaining({ referrerId: bob.data.login.id }),
            }),
          )
        })

        it('stores the redeem register event in the database', async () => {
          await expect(EventProtocol.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventProtocolType.REDEEM_REGISTER,
              userId: newUser.data.createUser.id,
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
        const emailContact = await UserContact.findOneOrFail({ email: createUserVariables.email })
        emailVerificationCode = emailContact.emailVerificationCode.toString()
        result = await mutate({
          mutation: setPassword,
          variables: { code: emailVerificationCode, password: 'Aa12345_' },
        })
        newUser = await User.findOneOrFail(
          { id: emailContact.userId },
          { relations: ['emailContact'] },
        )
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

      /*
      it('calls the klicktipp API', () => {
        expect(klicktippSignIn).toBeCalledWith(
          user[0].email,
          user[0].language,
          user[0].firstName,
          user[0].lastName,
        )
      })
      */

      it('returns true', () => {
        expect(result).toBeTruthy()
      })
    })

    describe('no valid password', () => {
      beforeAll(async () => {
        await mutate({ mutation: createUser, variables: createUserVariables })
        const emailContact = await UserContact.findOneOrFail({ email: createUserVariables.email })
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

    let result: User

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
                email: 'bibi@bloxberg.de',
                firstName: 'Bibi',
                hasElopage: false,
                id: expect.any(Number),
                isAdmin: null,
                klickTipp: {
                  newsletterState: false,
                },
                language: 'de',
                lastName: 'Bloxberg',
                publisherId: 1234,
              },
            },
          }),
        )
      })

      it('sets the token in the header', () => {
        expect(headerPushMock).toBeCalledWith({ key: 'token', value: expect.any(String) })
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
            data: { logout: 'true' },
            errors: undefined,
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
          user = await User.find()
        })

        afterAll(() => {
          resetToken()
        })

        it('returns user object', async () => {
          await expect(query({ query: verifyLogin })).resolves.toEqual(
            expect.objectContaining({
              data: {
                verifyLogin: {
                  email: 'bibi@bloxberg.de',
                  firstName: 'Bibi',
                  lastName: 'Bloxberg',
                  language: 'de',
                  klickTipp: {
                    newsletterState: false,
                  },
                  hasElopage: false,
                  publisherId: 1234,
                  isAdmin: null,
                },
              },
            }),
          )
        })

        it('stores the login event in the database', () => {
          expect(EventProtocol.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventProtocolType.LOGIN,
              userId: user[0].id,
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
      emailContact = await UserContact.findOneOrFail({ email: bibiBloxberg.email })
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
    "emailVerificationCode": "not-valid"
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
          await expect(User.findOne()).resolves.toEqual(
            expect.objectContaining({
              firstName: 'Benjamin',
              lastName: 'Blümchen',
              language: 'en',
            }),
          )
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
              errors: [new GraphQLError(`"not-valid" isn't a valid language`)],
            }),
          )
        })

        it('logs the error found', () => {
          expect(logger.error).toBeCalledWith(`"not-valid" isn't a valid language`, 'not-valid')
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
                    email: 'bibi@bloxberg.de',
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
        const usercontact = await UserContact.findOneOrFail(
          { email: 'bibi@bloxberg.de' },
          { relations: ['user'] },
        )
        bibi = usercontact.user
        bibi.passwordEncryptionType = PasswordEncryptionType.EMAIL
        bibi.password = SecretKeyCryptographyCreateKey(
          'bibi@bloxberg.de',
          'Aa12345_',
        )[0].readBigUInt64LE()

        await bibi.save()
      })

      it('changes to gradidoID on login', async () => {
        await mutate({ mutation: login, variables: variables })

        const usercontact = await UserContact.findOneOrFail(
          { email: 'bibi@bloxberg.de' },
          { relations: ['user'] },
        )
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
        expect(await mutate({ mutation: login, variables: variables })).toEqual(
          expect.objectContaining({
            data: {
              login: {
                email: 'bibi@bloxberg.de',
                firstName: 'Bibi',
                hasElopage: false,
                id: expect.any(Number),
                isAdmin: null,
                klickTipp: {
                  newsletterState: false,
                },
                language: 'de',
                lastName: 'Bloxberg',
                publisherId: 1234,
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
          mutate({ mutation: setUserRole, variables: { userId: 1, isAdmin: true } }),
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
            mutate({ mutation: setUserRole, variables: { userId: user.id + 1, isAdmin: true } }),
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

        describe('user to get a new role does not exist', () => {
          it('throws an error', async () => {
            jest.clearAllMocks()
            await expect(
              mutate({ mutation: setUserRole, variables: { userId: admin.id + 1, isAdmin: true } }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError(`Could not find user with userId: ${admin.id + 1}`)],
              }),
            )
          })

          it('logs the error thrown', () => {
            expect(logger.error).toBeCalledWith(
              `Could not find user with userId: ${admin.id + 1}`,
              admin.id + 1,
            )
          })
        })

        describe('change role with success', () => {
          beforeAll(async () => {
            user = await userFactory(testEnv, bibiBloxberg)
          })

          describe('user gets new role', () => {
            describe('to admin', () => {
              it('returns date string', async () => {
                const result = await mutate({
                  mutation: setUserRole,
                  variables: { userId: user.id, isAdmin: true },
                })
                expect(result).toEqual(
                  expect.objectContaining({
                    data: {
                      setUserRole: expect.any(String),
                    },
                  }),
                )
                expect(new Date(result.data.setUserRole)).toEqual(expect.any(Date))
              })
            })

            describe('to usual user', () => {
              it('returns null', async () => {
                await expect(
                  mutate({ mutation: setUserRole, variables: { userId: user.id, isAdmin: false } }),
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
          describe('is own role', () => {
            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({ mutation: setUserRole, variables: { userId: admin.id, isAdmin: false } }),
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

          describe('user has already role to be set', () => {
            describe('to admin', () => {
              it('throws an error', async () => {
                jest.clearAllMocks()
                await mutate({
                  mutation: setUserRole,
                  variables: { userId: user.id, isAdmin: true },
                })
                await expect(
                  mutate({ mutation: setUserRole, variables: { userId: user.id, isAdmin: true } }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [new GraphQLError('User is already admin')],
                  }),
                )
              })

              it('logs the error thrown', () => {
                expect(logger.error).toBeCalledWith('User is already admin')
              })
            })

            describe('to usual user', () => {
              it('throws an error', async () => {
                jest.clearAllMocks()
                await mutate({
                  mutation: setUserRole,
                  variables: { userId: user.id, isAdmin: false },
                })
                await expect(
                  mutate({ mutation: setUserRole, variables: { userId: user.id, isAdmin: false } }),
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
                errors: [new GraphQLError(`Could not find user with userId: ${admin.id + 1}`)],
              }),
            )
          })

          it('logs the error thrown', () => {
            expect(logger.error).toBeCalledWith(
              `Could not find user with userId: ${admin.id + 1}`,
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

          describe('delete deleted user', () => {
            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({ mutation: deleteUser, variables: { userId: user.id } }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError(`Could not find user with userId: ${user.id}`)],
                }),
              )
            })

            it('logs the error thrown', () => {
              expect(logger.error).toBeCalledWith(
                `Could not find user with userId: ${user.id}`,
                user.id,
              )
            })
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
                errors: [new GraphQLError(`Could not find user with userId: ${admin.id + 1}`)],
              }),
            )
          })

          it('logs the error thrown', () => {
            expect(logger.error).toBeCalledWith(
              `Could not find user with userId: ${admin.id + 1}`,
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
          })
        })
      })
    })
  })

  describe('search users', () => {
    const variablesWithoutTextAndFilters = {
      searchText: '',
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
