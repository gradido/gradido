// AI-GENERATED — not an architecture reference
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { AppDatabase, User as DbUser } from 'database'
import { GraphQLError } from 'graphql'
import { userFactory } from '@/seeds/factory/user'
import { login } from '@/seeds/graphql/mutations'
import { showFriends } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
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
let namedArrival: DbUser

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
  // A second pair, untouched by the tests above: this arrival HAS a user name, so alias
  // and identifier are different strings. `emailChecked`, because only a confirmed
  // address counts as an arrival at all.
  const namedHost = await userFactory(testEnv, bobBaumeister)
  namedArrival = await userFactory(testEnv, {
    ...garrickOllivander,
    alias: 'carla-sonne',
    emailChecked: true,
  })
  await DbUser.update(namedArrival.id, { referrerId: namedHost.id })
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
              gradidoID: arrived.gradidoID,
              // No alias of their own, so the public name is the full gradidoID.
              alias: arrived.gradidoID,
              first: true,
            },
          },
        },
        errors: undefined,
      })
    })

    /**
     * The identifier and the name are two different things, and that only SHOWS where the
     * member has chosen a user name -- above they are the same string, so a resolver
     * handing the public name out as the identifier would pass unnoticed.
     *
     * It matters because the tile does two things with them: it prints the alias and
     * hands the identifier to the contact window (ZE-010). Swap them and the tap opens
     * nobody, or somebody else.
     *
     * ⛔ Its own pair rather than a user name lent to `arrived` for the length of one
     * test: the column is not nullable to TypeORM, so there is no giving it back, and the
     * two tests above are written in terms of that member having none.
     */
    it('names the arrival and identifies them as two separate things', async () => {
      await loginAs('bob@baumeister.de')
      await expect(query({ query: showFriends })).resolves.toMatchObject({
        data: {
          showFriends: {
            latestArrival: { gradidoID: namedArrival.gradidoID, alias: 'carla-sonne' },
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
