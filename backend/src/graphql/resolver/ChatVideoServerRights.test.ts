// AI-GENERATED — not an architecture reference
import { RoleNames } from '@enum/RoleNames'
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { AppDatabase, dbSelectChatVideoServers, User, UserRole } from 'database'
import { DocumentNode, GraphQLError } from 'graphql'
import { getLogger as originalGetLogger } from 'log4js'
import { chatVideoServerPool } from '@/apis/jitsi/chatVideoServerPool'
import { probeJitsiServer } from '@/apis/jitsi/jitsiProbe'
import { userFactory } from '@/seeds/factory/user'
import {
  checkChatVideoServersNow,
  createChatVideoServer,
  deleteChatVideoServer,
  login,
  updateChatVideoServer,
} from '@/seeds/graphql/mutations'
import { adminListContributions, chatVideoServers } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'

// The list of the chat's video servers is guarded by MANAGE_CHAT_VIDEO_SERVERS, which sits in
// ADMIN_RIGHTS alone (Bernd, 26.09.2026: "nur für Administratoren"): it decides whose servers the
// whole community's calls are sent to. A moderator sees neither the list nor the menu entry.
//
// ⛔ Only a request through the schema can see the guard: `@Authorized` lives at the GraphQL
// layer, and a test that calls the resolver's methods would stay green without it.

jest.mock('@/password/EncryptorUtils')
// No server is asked: the probe answers as a server that passes. The checks the mutations start
// run against this, and so does checkChatVideoServersNow.
jest.mock('@/apis/jitsi/jitsiProbe', () => ({
  probeJitsiServer: jest.fn(async () => ({ success: true, value: { latencyMs: 50 } })),
}))

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase

beforeAll(async () => {
  const testEnv = await testEnvironment(originalGetLogger('apollo'))
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
})

afterAll(async () => {
  // The checks the mutations started, through before the tables go.
  await chatVideoServerPool.refreshNow()
  await cleanDB()
  await db.destroy()
})

const loginAs = async (email: string): Promise<void> => {
  resetToken()
  const { errors } = await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
  // ⛔ A login that failed leaves the token empty, and an empty token is refused with the very
  // words the refusals below assert. Without this line every refusal would pass with nobody
  // logged in at all.
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

const FAIRMEETING = {
  baseUrl: 'https://fairmeeting.net/',
  operator: 'fairmeeting (fairkom)',
  roomPrefix: 'GradidoAkademie',
  note: 'Akademie-Lizenz',
  active: true,
}

/** The five operations of the page, each as a request that would go through for an administrator. */
const operations = (id: number): { name: string; send: () => Promise<unknown> }[] => {
  const asQuery = (document: DocumentNode) => () => query({ query: document })
  const asMutation = (document: DocumentNode, variables?: Record<string, unknown>) => () =>
    mutate({ mutation: document, variables })
  return [
    { name: 'chatVideoServers', send: asQuery(chatVideoServers) },
    {
      name: 'createChatVideoServer',
      send: asMutation(createChatVideoServer, {
        input: { ...FAIRMEETING, baseUrl: 'https://meet.example.org/' },
      }),
    },
    {
      name: 'updateChatVideoServer',
      send: asMutation(updateChatVideoServer, { id, input: { ...FAIRMEETING, active: false } }),
    },
    { name: 'deleteChatVideoServer', send: asMutation(deleteChatVideoServer, { id }) },
    { name: 'checkChatVideoServersNow', send: asMutation(checkChatVideoServersNow) },
  ]
}

describe('the list of the chat video servers -- only administrators', () => {
  let moderator: User
  let stored: number

  beforeAll(async () => {
    await userFactory({ mutate, query, db }, peterLustig) // administrator
    moderator = await userFactory({ mutate, query, db }, bibiBloxberg)
    await setRole(moderator.id, RoleNames.MODERATOR)
    await userFactory({ mutate, query, db }, bobBaumeister) // member
    // The row the refusals would touch: with a real id, a refusal cannot be a NOT_FOUND.
    await loginAs('peter@lustig.de')
    const created: any = await mutate({
      mutation: createChatVideoServer,
      variables: { input: FAIRMEETING },
    })
    expect(created.errors).toBeUndefined()
    stored = created.data.createChatVideoServer.id
  })

  afterAll(() => {
    resetToken()
  })

  it('has a moderator who is really logged in and really a moderator', async () => {
    // ⚠️ Logged out, member, moderator and KI-moderator all fail the page's calls with the SAME
    // sentence, so no refusal below can tell them apart. This can: ADMIN_LIST_CONTRIBUTIONS is in
    // MODERATOR_RIGHTS and in no lesser set, so it fails if setRole ever stops taking.
    await loginAs('bibi@bloxberg.de')
    const { errors } = await query({
      query: adminListContributions,
      variables: { paginated: { pageSize: 1 } },
    })
    expect(errors).toBeUndefined()
  })

  describe.each([
    ['a moderator', 'bibi@bloxberg.de'],
    ['a member', 'bob@baumeister.de'],
  ])('refuses %s', (_who, email) => {
    it.each(operations(0).map(({ name }) => name))('%s', async (name) => {
      await loginAs(email)
      const operation = operations(stored).find((candidate) => candidate.name === name)
      await expect(operation?.send()).resolves.toEqual(unauthorized)
    })
  })

  it('refuses a KI-Moderator just the same', async () => {
    await setRole(moderator.id, RoleNames.MODERATOR_AI)
    try {
      await loginAs('bibi@bloxberg.de')
      for (const operation of operations(stored)) {
        await expect(operation.send()).resolves.toEqual(unauthorized)
      }
    } finally {
      // ⚠️ In a `finally`: the day MANAGE_CHAT_VIDEO_SERVERS lands in MODERATOR_AI_RIGHTS, the
      // assertion above throws, and the next test must not run as a KI-moderator.
      await setRole(moderator.id, RoleNames.MODERATOR)
    }
  })

  it('left the list as it was through every refusal', async () => {
    const rows = await dbSelectChatVideoServers()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ id: stored, ...FAIRMEETING })
  })

  // The counterpart to the refusals: without it, a decorator that refused EVERYBODY would pass
  // every test above.
  it('lets an administrator do all five', async () => {
    await loginAs('peter@lustig.de')
    const results: any[] = []
    for (const operation of operations(stored)) {
      results.push(await operation.send())
    }
    for (const result of results) {
      expect(result.errors).toBeUndefined()
    }
    const [listed, created, updated, deleted, checked] = results
    expect(listed.data.chatVideoServers.map((row: any) => row.id)).toEqual([stored])
    expect(created.data.createChatVideoServer.host).toBe('meet.example.org')
    expect(updated.data.updateChatVideoServer).toMatchObject({ id: stored, active: false })
    expect(deleted.data.deleteChatVideoServer).toBe(true)
    expect(checked.data.checkChatVideoServersNow.map((row: any) => row.host)).toEqual([
      'meet.example.org',
    ])
    expect(probeJitsiServer).toHaveBeenCalled()
  })
})
