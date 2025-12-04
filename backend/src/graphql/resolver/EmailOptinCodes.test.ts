import { cleanDB, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { CONFIG as CORE_CONFIG } from 'core'
import { AppDatabase, User as DbUser } from 'database'
import { GraphQLError } from 'graphql'
import { DataSource } from 'typeorm'
import { CONFIG } from '@/config'
import { writeHomeCommunityEntry } from '@/seeds/community'
import { createUser, forgotPassword, setPassword } from '@/seeds/graphql/mutations'
import { queryOptIn } from '@/seeds/graphql/queries'

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let con: DataSource
let db: AppDatabase
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: DataSource
  db: AppDatabase
}

CONFIG.EMAIL_CODE_VALID_TIME = 1440
CONFIG.EMAIL_CODE_REQUEST_TIME = 10
CORE_CONFIG.EMAIL = false

beforeAll(async () => {
  testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
  con = testEnv.con
  db = testEnv.db
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await con.destroy()
  await db.getRedisClient().quit()
})

describe('EmailOptinCodes', () => {
  let optinCode: string
  beforeAll(async () => {
    const variables = {
      email: 'peter@lustig.de',
      firstName: 'Peter',
      lastName: 'Lustig',
      language: 'de',
    }
    await writeHomeCommunityEntry()
    const {
      data: { createUser: user },
    } = await mutate({ mutation: createUser, variables })
    const dbObject = await DbUser.findOneOrFail({
      where: { id: user.id },
      relations: ['emailContact'],
    })
    optinCode = dbObject.emailContact.emailVerificationCode.toString()
  })

  describe('queryOptIn', () => {
    it('has a valid optin code', async () => {
      await expect(
        query({ query: queryOptIn, variables: { optIn: optinCode } }),
      ).resolves.toMatchObject({
        data: {
          queryOptIn: true,
        },
        errors: undefined,
      })
    })

    describe('run time forward until code must be expired', () => {
      beforeAll(() => {
        jest.useFakeTimers()
        setTimeout(jest.fn(), CONFIG.EMAIL_CODE_VALID_TIME * 60 * 1000)
        jest.runAllTimers()
      })

      afterAll(() => {
        jest.useRealTimers()
      })

      it('throws an error', async () => {
        await expect(
          query({ query: queryOptIn, variables: { optIn: optinCode } }),
        ).resolves.toMatchObject({
          data: null,
          errors: [new GraphQLError('Email was sent more than 24 hours ago')],
        })
      })

      it('does not allow to set password', async () => {
        await expect(
          mutate({ mutation: setPassword, variables: { code: optinCode, password: 'Aa12345_' } }),
        ).resolves.toMatchObject({
          data: null,
          errors: [new GraphQLError('Email was sent more than 24 hours ago')],
        })
      })
    })
  })

  describe('forgotPassword', () => {
    it('throws an error', async () => {
      await mutate({ mutation: forgotPassword, variables: { email: 'peter@lustig.de' } })
      await expect(
        mutate({ mutation: forgotPassword, variables: { email: 'peter@lustig.de' } }),
      ).resolves.toMatchObject({
        data: null,
        errors: [new GraphQLError('Email already sent less than 10 minutes ago')],
      })
    })

    describe('run time forward until code can be resent', () => {
      beforeAll(() => {
        jest.useFakeTimers()
        setTimeout(jest.fn(), CONFIG.EMAIL_CODE_REQUEST_TIME * 60 * 1000)
        jest.runAllTimers()
      })

      afterAll(() => {
        jest.useRealTimers()
      })

      it('cann send email again', async () => {
        await expect(
          mutate({ mutation: forgotPassword, variables: { email: 'peter@lustig.de' } }),
        ).resolves.toMatchObject({
          data: {
            forgotPassword: true,
          },
          errors: undefined,
        })
      })
    })
  })
})
