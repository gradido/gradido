// AI-GENERATED — not an architecture reference
import { RoleNames } from '@enum/RoleNames'
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { AppDatabase, User, UserRole } from 'database'
import { GraphQLError } from 'graphql'
import { getLogger as originalGetLogger } from 'log4js'
import { userFactory } from '@/seeds/factory/user'
import { login, setCreaMatchingKeying, setCreaSettings } from '@/seeds/graphql/mutations'
import { creaSettings } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'

// The Crea settings are guarded by `AI_SETTINGS`, which sits in ADMIN_RIGHTS and is
// deliberately absent from MODERATOR_AI_RIGHTS: the model applies to every moderator
// at once, and the keying switch decides whether a language model is PAID per matching
// entry. Moderators inherit the effect, not the control.
//
// ⛔ Why this file exists rather than an assertion in the unit test next door: a test
// that calls `resolver.setCreaMatchingKeying(true)` is a plain method call, and
// `@Authorized` lives at the GraphQL layer. Deleting the decorator - in a refactor, a
// merge, a copy-paste - would leave that suite entirely green while handing the one
// switch that spends money to every moderator. Only a request through the schema can
// see the difference.

jest.mock('@/password/EncryptorUtils')

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  db: AppDatabase
}

beforeAll(async () => {
  testEnv = await testEnvironment(originalGetLogger('apollo'))
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

const loginAs = async (email: string): Promise<void> => {
  resetToken()
  await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
}

const setRole = async (userId: number, role: RoleNames): Promise<void> => {
  const existing = await UserRole.findOne({ where: { userId } })
  const entry = existing ?? UserRole.create()
  entry.createdAt = entry.createdAt ?? new Date()
  entry.userId = userId
  entry.role = role
  await entry.save()
}

const unauthorized = expect.objectContaining({
  errors: [new GraphQLError('401 Unauthorized')],
})

const SETTINGS = { input: { model: null, effort: 'disabled', fastMode: false } }

describe('the Crea settings — only administrators', () => {
  let moderator: User

  beforeAll(async () => {
    await userFactory(testEnv, peterLustig) // administrator
    moderator = await userFactory(testEnv, bibiBloxberg)
    await setRole(moderator.id, RoleNames.MODERATOR)
  })

  afterAll(() => {
    resetToken()
  })

  it('refuses to let a moderator read them', async () => {
    await loginAs('bibi@bloxberg.de')
    await expect(query({ query: creaSettings })).resolves.toEqual(unauthorized)
  })

  it('refuses to let a moderator change the model', async () => {
    await loginAs('bibi@bloxberg.de')
    await expect(mutate({ mutation: setCreaSettings, variables: SETTINGS })).resolves.toEqual(
      unauthorized,
    )
  })

  it('refuses to let a moderator switch the keying on', async () => {
    // ⛔ The one that costs money, and the reason this file is worth its runtime.
    await loginAs('bibi@bloxberg.de')
    await expect(
      mutate({ mutation: setCreaMatchingKeying, variables: { active: true } }),
    ).resolves.toEqual(unauthorized)
  })

  it('refuses a KI-Moderator just the same', async () => {
    // MODERATOR_AI may send Crea a message; it may not decide what Crea costs.
    await setRole(moderator.id, RoleNames.MODERATOR_AI)
    await loginAs('bibi@bloxberg.de')
    await expect(
      mutate({ mutation: setCreaMatchingKeying, variables: { active: true } }),
    ).resolves.toEqual(unauthorized)
  })

  it('lets an administrator read them', async () => {
    await loginAs('peter@lustig.de')
    const { errors } = await query({ query: creaSettings })
    expect(errors).toBeUndefined()
  })

  it('lets an administrator switch the keying on and off again', async () => {
    // The counterpart to the refusals above: without it, a decorator that refused
    // EVERYBODY would pass every test in this file.
    await loginAs('peter@lustig.de')

    const on = await mutate({ mutation: setCreaMatchingKeying, variables: { active: true } })
    expect(on.errors).toBeUndefined()
    expect(on.data?.setCreaMatchingKeying).toBe(true)

    const off = await mutate({ mutation: setCreaMatchingKeying, variables: { active: false } })
    expect(off.errors).toBeUndefined()
    expect(off.data?.setCreaMatchingKeying).toBe(false)
  })
})
