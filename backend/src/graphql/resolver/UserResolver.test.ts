/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { testEnvironment, createUser, headerPushMock, cleanDB, resetToken } from '@test/helpers'
import { createUserMutation, setPasswordMutation } from '@test/graphql'
import gql from 'graphql-tag'
import { GraphQLError } from 'graphql'
import { LoginEmailOptIn } from '@entity/LoginEmailOptIn'
import { User } from '@entity/User'
import CONFIG from '@/config'
import { sendAccountActivationEmail } from '@/mailer/sendAccountActivationEmail'
// import { klicktippSignIn } from '@/apis/KlicktippController'

jest.setTimeout(1000000)

jest.mock('@/mailer/sendAccountActivationEmail', () => {
  return {
    __esModule: true,
    sendAccountActivationEmail: jest.fn(),
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

let mutate: any, query: any, con: any

const loginQuery = gql`
  query ($email: String!, $password: String!, $publisherId: Int) {
    login(email: $email, password: $password, publisherId: $publisherId) {
      email
      firstName
      lastName
      language
      coinanimation
      klickTipp {
        newsletterState
      }
      hasElopage
      publisherId
      isAdmin
    }
  }
`

beforeAll(async () => {
  const testEnv = await testEnvironment()
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
    let emailOptIn: string

    beforeAll(async () => {
      jest.clearAllMocks()
      result = await mutate({ mutation: createUserMutation, variables })
    })

    afterAll(async () => {
      await cleanDB()
    })

    it('returns success', () => {
      expect(result).toEqual(expect.objectContaining({ data: { createUser: 'success' } }))
    })

    describe('valid input data', () => {
      let user: User[]
      let loginEmailOptIn: LoginEmailOptIn[]
      beforeAll(async () => {
        user = await User.find()
        loginEmailOptIn = await LoginEmailOptIn.find()
        emailOptIn = loginEmailOptIn[0].verificationCode.toString()
      })

      describe('filling all tables', () => {
        it('saves the user in login_user table', () => {
          expect(user).toEqual([
            {
              id: expect.any(Number),
              email: 'peter@lustig.de',
              firstName: 'Peter',
              lastName: 'Lustig',
              password: '0',
              pubKey: null,
              privKey: null,
              emailHash: expect.any(Buffer),
              createdAt: expect.any(Date),
              emailChecked: false,
              passphrase: expect.any(String),
              language: 'de',
              deletedAt: null,
              publisherId: 1234,
            },
          ])
        })

        it('creates an email optin', () => {
          expect(loginEmailOptIn).toEqual([
            {
              id: expect.any(Number),
              userId: user[0].id,
              verificationCode: expect.any(String),
              emailOptInTypeId: 1,
              createdAt: expect.any(Date),
              resendCount: 0,
              updatedAt: expect.any(Date),
            },
          ])
        })
      })
    })

    describe('account activation email', () => {
      it('sends an account activation email', () => {
        const activationLink = CONFIG.EMAIL_LINK_VERIFICATION.replace(/{code}/g, emailOptIn)
        expect(sendAccountActivationEmail).toBeCalledWith({
          link: activationLink,
          firstName: 'Peter',
          lastName: 'Lustig',
          email: 'peter@lustig.de',
        })
      })
    })

    describe('email already exists', () => {
      it('throws an error', async () => {
        await expect(mutate({ mutation: createUserMutation, variables })).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('User already exists.')],
          }),
        )
      })
    })

    describe('unknown language', () => {
      it('sets "de" as default language', async () => {
        await mutate({
          mutation: createUserMutation,
          variables: { ...variables, email: 'bibi@bloxberg.de', language: 'es' },
        })
        await expect(User.find()).resolves.toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              email: 'bibi@bloxberg.de',
              language: 'de',
            }),
          ]),
        )
      })
    })

    describe('no publisher id', () => {
      it('sets publisher id to null', async () => {
        await mutate({
          mutation: createUserMutation,
          variables: { ...variables, email: 'raeuber@hotzenplotz.de', publisherId: undefined },
        })
        await expect(User.find()).resolves.toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              email: 'raeuber@hotzenplotz.de',
              publisherId: null,
            }),
          ]),
        )
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
    let emailOptIn: string

    describe('valid optin code and valid password', () => {
      let newUser: any

      beforeAll(async () => {
        await mutate({ mutation: createUserMutation, variables: createUserVariables })
        const loginEmailOptIn = await LoginEmailOptIn.find()
        emailOptIn = loginEmailOptIn[0].verificationCode.toString()
        result = await mutate({
          mutation: setPasswordMutation,
          variables: { code: emailOptIn, password: 'Aa12345_' },
        })
        newUser = await User.find()
      })

      afterAll(async () => {
        await cleanDB()
      })

      it('sets email checked to true', () => {
        expect(newUser[0].emailChecked).toBeTruthy()
      })

      it('updates the password', () => {
        expect(newUser[0].password).toEqual('3917921995996627700')
      })

      it('removes the optin', async () => {
        await expect(LoginEmailOptIn.find()).resolves.toHaveLength(0)
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
        await mutate({ mutation: createUserMutation, variables: createUserVariables })
        const loginEmailOptIn = await LoginEmailOptIn.find()
        emailOptIn = loginEmailOptIn[0].verificationCode.toString()
        result = await mutate({
          mutation: setPasswordMutation,
          variables: { code: emailOptIn, password: 'not-valid' },
        })
      })

      afterAll(async () => {
        await cleanDB()
      })

      it('throws an error', () => {
        expect(result).toEqual(
          expect.objectContaining({
            errors: [
              new GraphQLError(
                'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
              ),
            ],
          }),
        )
      })
    })

    describe('no valid optin code', () => {
      beforeAll(async () => {
        await mutate({ mutation: createUserMutation, variables: createUserVariables })
        result = await mutate({
          mutation: setPasswordMutation,
          variables: { code: 'not valid', password: 'Aa12345_' },
        })
      })

      afterAll(async () => {
        await cleanDB()
      })

      it('throws an error', () => {
        expect(result).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('Could not login with emailVerificationCode')],
          }),
        )
      })
    })
  })

  describe('login', () => {
    const variables = {
      email: 'peter@lustig.de',
      password: 'Aa12345_',
      publisherId: 1234,
    }

    let result: User

    afterAll(async () => {
      await cleanDB()
    })

    describe('no users in database', () => {
      beforeAll(async () => {
        result = await query({ query: loginQuery, variables })
      })

      it('throws an error', () => {
        expect(result).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('No user with this credentials')],
          }),
        )
      })
    })

    describe('user is in database and correct login data', () => {
      beforeAll(async () => {
        await createUser(mutate, {
          email: 'peter@lustig.de',
          firstName: 'Peter',
          lastName: 'Lustig',
          language: 'de',
          publisherId: 1234,
        })
        result = await query({ query: loginQuery, variables })
      })

      afterAll(async () => {
        await cleanDB()
      })

      it('returns the user object', () => {
        expect(result).toEqual(
          expect.objectContaining({
            data: {
              login: {
                coinanimation: true,
                email: 'peter@lustig.de',
                firstName: 'Peter',
                hasElopage: false,
                isAdmin: false,
                klickTipp: {
                  newsletterState: false,
                },
                language: 'de',
                lastName: 'Lustig',
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
        await createUser(mutate, {
          email: 'peter@lustig.de',
          firstName: 'Peter',
          lastName: 'Lustig',
          language: 'de',
          publisherId: 1234,
        })
      })

      afterAll(async () => {
        await cleanDB()
      })

      it('returns an error', () => {
        expect(
          query({ query: loginQuery, variables: { ...variables, password: 'wrong' } }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('No user with this credentials')],
          }),
        )
      })
    })
  })

  describe('logout', () => {
    const logoutQuery = gql`
      query {
        logout
      }
    `

    describe('unauthenticated', () => {
      it('throws an error', async () => {
        resetToken()
        await expect(query({ query: logoutQuery })).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated', () => {
      const variables = {
        email: 'peter@lustig.de',
        password: 'Aa12345_',
      }

      beforeAll(async () => {
        await createUser(mutate, {
          email: 'peter@lustig.de',
          firstName: 'Peter',
          lastName: 'Lustig',
          language: 'de',
          publisherId: 1234,
        })
        await query({ query: loginQuery, variables })
      })

      afterAll(async () => {
        await cleanDB()
      })

      it('returns true', async () => {
        await expect(query({ query: logoutQuery })).resolves.toEqual(
          expect.objectContaining({
            data: { logout: 'true' },
            errors: undefined,
          }),
        )
      })
    })
  })
})
