// AI-GENERATED — not an architecture reference
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { AppDatabase, User as DbUser } from 'database'
import { GraphQLError } from 'graphql'
import { userFactory } from '@/seeds/factory/user'
import { login } from '@/seeds/graphql/mutations'
import { showFriends } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'

jest.mock('@/password/EncryptorUtils')

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  db: AppDatabase
}

let host: DbUser
let arrived: DbUser

const loginAs = async (email: string): Promise<void> => {
  resetToken()
  const { errors } = await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
  expect(errors).toBeUndefined()
}

beforeAll(async () => {
  testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
  host = await userFactory(testEnv, bibiBloxberg)
  arrived = await userFactory(testEnv, peterLustig)
  await DbUser.update(arrived.id, { referrerId: host.id })
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

describe('ShowFriendsResolver', () => {
  describe('unauthenticated', () => {
    it('throws an error', async () => {
      resetToken()
      await expect(query({ query: showFriends })).resolves.toMatchObject({
        errors: [new GraphQLError('401 Unauthorized')],
      })
    })
  })

  describe('authenticated', () => {
    // The same query, with no argument, answered out of the caller's own row: what each
    // of the two gets back is the proof that it cannot be asked about anybody else.
    it('tells the host who arrived over them, and nobody brought them', async () => {
      await loginAs('bibi@bloxberg.de')
      await expect(query({ query: showFriends })).resolves.toMatchObject({
        data: {
          showFriends: {
            referrerAlias: null,
            latestArrival: {
              // No alias of their own, so the public name is the full gradidoID.
              alias: arrived.gradidoID,
              first: true,
            },
          },
        },
        errors: undefined,
      })
    })

    it('tells the one who arrived who brought them, and nobody arrived over them', async () => {
      await loginAs('peter@lustig.de')
      await expect(query({ query: showFriends })).resolves.toMatchObject({
        data: {
          showFriends: {
            referrerAlias: bibiBloxberg.alias,
            latestArrival: null,
          },
        },
        errors: undefined,
      })
    })
  })
})
