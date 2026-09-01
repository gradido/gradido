// AI-GENERATED — not an architecture reference
import { RoleNames } from '@enum/RoleNames'
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { AppDatabase, User, UserRole } from 'database'
import { GraphQLError } from 'graphql'
import { getLogger as originalGetLogger } from 'log4js'
import { userFactory } from '@/seeds/factory/user'
import {
  login,
  setCreaMatchingKeying,
  setCreaSettings,
  testCreaModel,
} from '@/seeds/graphql/mutations'
import { adminListContributions, creaSettings } from '@/seeds/graphql/queries'
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
  const { errors } = await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })

  // ⛔ The assertion that keeps this whole file honest. A login that FAILED leaves
  // `context.token` empty, and `isAuthorized` answers an empty token with the very
  // words the refusals below assert - `401 Unauthorized`, byte for byte. Without this
  // line, a renamed seed user, a changed seed password or an unchecked email address
  // would make every refusal pass with nobody logged in at all, and the guard would be
  // reported as measured while measuring nothing.
  expect(errors).toBeUndefined()
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

// Distinctive on every field, because the neutral state is also what `readCreaSettings`
// answers when no row exists - so a save asserted with `{model: null, effort:
// 'disabled', fastMode: false}` cannot tell a write from a write that never happened.
const SETTINGS = { input: { model: 'claude-probe-value', effort: 'high', fastMode: true } }

// ⛔ Its own constant, and deliberately the neutral one. `model` means something else
// to the probe than to the save - `CreaResolver` reads `input.model?.trim() ||
// defaultCreaModel()` - so anyone strengthening the save above by putting a real model
// into it must not thereby arm a paid probe down here.
const PROBE = { input: { model: null, effort: 'disabled', fastMode: false } }

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

  it('has a moderator who is really logged in and really a moderator', async () => {
    // ⚠️ The control the refusals cannot do without. Logged out, plain user, moderator
    // and KI-moderator all fail the Crea calls with the SAME sentence, so no refusal
    // below can tell them apart. This one can, and it runs first so a broken fixture is
    // named here rather than disguised as four passing guards.
    //
    // ⛔ It has to be a MODERATOR-only operation. `listContributionLinks` was the
    // obvious pick and the wrong one: `LIST_CONTRIBUTION_LINKS` sits in USER_RIGHTS, so
    // a plain user passes it too, and the control would have proved only the login -
    // which `loginAs` already asserts. `ADMIN_LIST_CONTRIBUTIONS` is in MODERATOR_RIGHTS
    // and in no lesser set, so this fails if `setRole` ever stops taking.
    await loginAs('bibi@bloxberg.de')
    const { errors } = await query({
      query: adminListContributions,
      variables: { paginated: { pageSize: 1 } },
    })

    expect(errors).toBeUndefined()
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

  it('refuses to let a moderator spend a probe call', async () => {
    // ⚠️ The fourth AI_SETTINGS operation, and it reaches the Anthropic API - so this
    // file asserts only the REFUSAL for it. The guard runs as middleware, before the
    // resolver body, so nothing is billed here. There is deliberately no
    // administrator-succeeds counterpart: that one would cost real money on every CI
    // run, and the positive control above already proves the fixture is sound.
    await loginAs('bibi@bloxberg.de')
    await expect(mutate({ mutation: testCreaModel, variables: PROBE })).resolves.toEqual(
      unauthorized,
    )
  })

  it('refuses a KI-Moderator just the same', async () => {
    // MODERATOR_AI may send Crea a message; it may not decide what Crea costs.
    await setRole(moderator.id, RoleNames.MODERATOR_AI)
    try {
      await loginAs('bibi@bloxberg.de')
      await expect(
        mutate({ mutation: setCreaMatchingKeying, variables: { active: true } }),
      ).resolves.toEqual(unauthorized)
    } finally {
      // ⚠️ In a `finally`, because the protection is worth exactly nothing otherwise:
      // the day somebody puts AI_SETTINGS into MODERATOR_AI_RIGHTS, the assertion above
      // throws and the restore that stops the next test from silently running as a
      // KI-moderator is the line that does not run.
      await setRole(moderator.id, RoleNames.MODERATOR)
    }
  })

  it('lets an administrator read them', async () => {
    await loginAs('peter@lustig.de')
    const { errors } = await query({ query: creaSettings })
    expect(errors).toBeUndefined()
  })

  it('lets an administrator save the moderation settings, and stores them', async () => {
    // Without this, `@Authorized` on `setCreaSettings` could name any right that
    // administrators also lack and the refusal above would still pass.
    await loginAs('peter@lustig.de')
    const { data, errors } = await mutate({ mutation: setCreaSettings, variables: SETTINGS })

    expect(errors).toBeUndefined()
    // ⚠️ Read back rather than trusting the absence of an error. The GraphQL layer only
    // notices a resolver that returns NOTHING, never one that returns without writing -
    // so dropping the save inside `writeCreaSettings` would leave a green test here.
    expect(data?.setCreaSettings).toMatchObject(SETTINGS.input)
    const stored = await query({ query: creaSettings })
    expect(stored.data?.creaSettings).toMatchObject(SETTINGS.input)
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
