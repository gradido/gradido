/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { createTestClient } from 'apollo-server-testing'
import gql from 'graphql-tag'
import { GraphQLError } from 'graphql'
import createServer from '../../server/createServer'
import { resetDB, initialize } from '@dbTools/helpers'
import { getRepository } from 'typeorm'
import { LoginEmailOptIn } from '@entity/LoginEmailOptIn'
import { User } from '@entity/User'
import CONFIG from '../../config'
import { sendAccountActivationEmail } from '../../mailer/sendAccountActivationEmail'
import { klicktippSignIn } from '../../apis/KlicktippController'

jest.mock('../../mailer/sendAccountActivationEmail', () => {
  return {
    __esModule: true,
    sendAccountActivationEmail: jest.fn(),
  }
})

jest.mock('../../apis/KlicktippController', () => {
  return {
    __esModule: true,
    klicktippSignIn: jest.fn(),
  }
})

let mutate: any
let con: any

beforeAll(async () => {
  const server = await createServer({})
  con = server.con
  mutate = createTestClient(server.apollo).mutate
  await initialize()
  await resetDB()
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

    const mutation = gql`
      mutation (
        $email: String!
        $firstName: String!
        $lastName: String!
        $language: String!
        $publisherId: Int
      ) {
        createUser(
          email: $email
          firstName: $firstName
          lastName: $lastName
          language: $language
          publisherId: $publisherId
        )
      }
    `

    let result: any
    let emailOptIn: string

    beforeAll(async () => {
      result = await mutate({ mutation, variables })
    })

    afterAll(async () => {
      await resetDB()
    })

    it('returns success', () => {
      expect(result).toEqual(expect.objectContaining({ data: { createUser: 'success' } }))
    })

    describe('valid input data', () => {
      let user: User[]
      let loginEmailOptIn: LoginEmailOptIn[]
      beforeAll(async () => {
        user = await getRepository(User).createQueryBuilder('state_user').getMany()
        loginEmailOptIn = await getRepository(LoginEmailOptIn)
          .createQueryBuilder('login_email_optin')
          .getMany()
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
              username: '',
              description: '',
              password: '0',
              pubKey: null,
              privKey: null,
              emailHash: expect.any(Buffer),
              createdAt: expect.any(Date),
              emailChecked: false,
              passphraseShown: false,
              language: 'de',
              disabled: false,
              groupId: 1,
              publisherId: 1234,
            },
          ])
        })

        it('saves the user in state_user table', () => {
          expect(user).toEqual([
            {
              id: expect.any(Number),
              indexId: 0,
              groupId: 0,
              pubkey: expect.any(Buffer),
              email: 'peter@lustig.de',
              firstName: 'Peter',
              lastName: 'Lustig',
              username: '',
              disabled: false,
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
        await expect(mutate({ mutation, variables })).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('User already exists.')],
          }),
        )
      })
    })

    describe('unknown language', () => {
      it('sets "de" as default language', async () => {
        await mutate({
          mutation,
          variables: { ...variables, email: 'bibi@bloxberg.de', language: 'es' },
        })
        await expect(getRepository(User).createQueryBuilder('user').getMany()).resolves.toEqual(
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
          mutation,
          variables: { ...variables, email: 'raeuber@hotzenplotz.de', publisherId: undefined },
        })
        await expect(getRepository(User).createQueryBuilder('user').getMany()).resolves.toEqual(
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
    const createUserMutation = gql`
      mutation (
        $email: String!
        $firstName: String!
        $lastName: String!
        $language: String!
        $publisherId: Int
      ) {
        createUser(
          email: $email
          firstName: $firstName
          lastName: $lastName
          language: $language
          publisherId: $publisherId
        )
      }
    `

    const createUserVariables = {
      email: 'peter@lustig.de',
      firstName: 'Peter',
      lastName: 'Lustig',
      language: 'de',
      publisherId: 1234,
    }

    const setPasswordMutation = gql`
      mutation ($code: String!, $password: String!) {
        setPassword(code: $code, password: $password)
      }
    `
    let result: any
    let emailOptIn: string

    describe('valid optin code and valid password', () => {
      let loginUser: any
      let newLoginUser: any
      let newUser: any

      beforeAll(async () => {
        await mutate({ mutation: createUserMutation, variables: createUserVariables })
        const loginEmailOptIn = await getRepository(LoginEmailOptIn)
          .createQueryBuilder('login_email_optin')
          .getMany()
        emailOptIn = loginEmailOptIn[0].verificationCode.toString()
        result = await mutate({
          mutation: setPasswordMutation,
          variables: { code: emailOptIn, password: 'Aa12345_' },
        })
        newUser = await getRepository(User).createQueryBuilder('state_user').getMany()
      })

      afterAll(async () => {
        await resetDB()
      })

      it('sets email checked to true', () => {
        expect(newLoginUser[0].emailChecked).toBeTruthy()
      })

      it('updates the password', () => {
        expect(newLoginUser[0].password).toEqual('3917921995996627700')
      })

      it('removes the optin', async () => {
        await expect(
          getRepository(LoginEmailOptIn).createQueryBuilder('login_email_optin').getMany(),
        ).resolves.toHaveLength(0)
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
        const loginEmailOptIn = await getRepository(LoginEmailOptIn)
          .createQueryBuilder('login_email_optin')
          .getMany()
        emailOptIn = loginEmailOptIn[0].verificationCode.toString()
        result = await mutate({
          mutation: setPasswordMutation,
          variables: { code: emailOptIn, password: 'not-valid' },
        })
      })

      afterAll(async () => {
        await resetDB()
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
        await resetDB()
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
})

afterAll(async () => {
  await resetDB(true)
  await con.close()
})
