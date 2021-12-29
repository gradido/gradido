/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { createTestClient } from 'apollo-server-testing'
import gql from 'graphql-tag'
import { GraphQLError } from 'graphql'
import createServer from '../../server/createServer'
import { resetDB, initialize } from '@dbTools/helpers'
import { getRepository } from 'typeorm'
import { LoginUser } from '@entity/LoginUser'
import { LoginUserBackup } from '@entity/LoginUserBackup'
import { LoginEmailOptIn } from '@entity/LoginEmailOptIn'
import { User } from '@entity/User'
import CONFIG from '../../config'
import { sendEMail } from '../../util/sendEMail'

jest.mock('../../util/sendEMail', () => {
  return {
    __esModule: true,
    sendEMail: jest.fn(),
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
    let newUser: User

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
      let loginUser: LoginUser[]
      let user: User[]
      let loginUserBackup: LoginUserBackup[]
      let loginEmailOptIn: LoginEmailOptIn[]
      beforeAll(async () => {
        loginUser = await getRepository(LoginUser).createQueryBuilder('login_user').getMany()
        user = await getRepository(User).createQueryBuilder('state_user').getMany()
        loginUserBackup = await getRepository(LoginUserBackup)
          .createQueryBuilder('login_user_backup')
          .getMany()
        loginEmailOptIn = await getRepository(LoginEmailOptIn)
          .createQueryBuilder('login_email_optin')
          .getMany()
        newUser = user[0]
        emailOptIn = loginEmailOptIn[0].verificationCode.toString()
      })

      describe('filling all tables', () => {
        it('saves the user in login_user table', () => {
          expect(loginUser).toEqual([
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

        it('saves the user in login_user_backup table', () => {
          expect(loginUserBackup).toEqual([
            {
              id: expect.any(Number),
              passphrase: expect.any(String),
              userId: loginUser[0].id,
              mnemonicType: 2,
            },
          ])
        })

        it('creates an email optin', () => {
          expect(loginEmailOptIn).toEqual([
            {
              id: expect.any(Number),
              userId: loginUser[0].id,
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
        const activationLink = CONFIG.EMAIL_LINK_VERIFICATION.replace(/\$1/g, emailOptIn)
        expect(sendEMail).toBeCalledWith({
          from: `Gradido (nicht antworten) <${CONFIG.EMAIL_SENDER}>`,
          to: `${newUser.firstName} ${newUser.lastName} <${newUser.email}>`,
          subject: 'Gradido: E-Mail Überprüfung',
          text:
            expect.stringContaining(`Hallo ${newUser.firstName} ${newUser.lastName},`) &&
            expect.stringContaining(activationLink),
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
        await expect(
          getRepository(LoginUser).createQueryBuilder('login_user').getMany(),
        ).resolves.toEqual(
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
        await expect(
          getRepository(LoginUser).createQueryBuilder('login_user').getMany(),
        ).resolves.toEqual(
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
})

afterAll(async () => {
  await resetDB(true)
  await con.close()
})
