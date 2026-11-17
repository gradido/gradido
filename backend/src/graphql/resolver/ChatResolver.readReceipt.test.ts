// AI-GENERATED — not an architecture reference
import { ApolloServerTestClient, cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { getLogger } from 'config-schema/test/testSetup'
import { CONFIG as CORE_CONFIG } from 'core'
import {
  AppDatabase,
  chatConversationMembersTable,
  dbEnsureDirectChatConversation,
  User,
} from 'database'
import { and, eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { userFactory } from '@/seeds/factory/user'
import {
  login,
  markChatConversationRead,
  sendChatMessage,
  setChatConversationMuted,
} from '@/seeds/graphql/mutations'
import { chatMessagesWithMember, newChatMessagesAndReadSince } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'

/*
 * The two ticks in a conversation of two (Chat E-093), against a database: how far the OTHER
 * member has read, on the thread's page and on the beat. What the resolver decides without a
 * database is held in ChatResolver.newChatMessagesSince.test.ts, the rule in
 * data/ChatConversation.logic.test.ts, the query in database's chatConversations.test.ts; the
 * group's page in ChatGroupResolver.test.ts.
 */

// No mail has to go out: with mail switched off the mail functions answer null.
jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    sendCustomEmail: jest.fn(async () => ({ accepted: ['watched'] })),
  }
})

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)
CORE_CONFIG.EMAIL = false

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  db: AppDatabase
}

let bibi: User
let bob: User
let peter: User

type ChatRef = { communityUuid: string | null; gradidoID: string }
const ref = (member: User): ChatRef => ({
  communityUuid: member.communityUuid,
  gradidoID: member.gradidoID,
})

const loginAs = async (email: string): Promise<void> => {
  await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
}

/** Writes in the chat to `to`, as whoever is logged in; the id of the own copy. */
const said = async (to: ChatRef, body: string): Promise<number> => {
  const res: any = await mutate({
    mutation: sendChatMessage,
    variables: { ref: to, body, notify: 'NONE' },
  })
  expect(res.errors).toBeUndefined()
  return res.data.sendChatMessage.id
}

/** The page of whoever is logged in with `to`. */
const pageWith = async (to: ChatRef) => {
  const res: any = await query({ query: chatMessagesWithMember, variables: { ref: to } })
  expect(res.errors).toBeUndefined()
  return res.data.chatMessagesWithMember
}

/** What the beat of whoever is logged in says about how far the members named have read. */
const readUpTo = async (readBy: ChatRef[]) => {
  const res: any = await query({
    query: newChatMessagesAndReadSince,
    variables: { afterId: 0, readBy },
  })
  expect(res.errors).toBeUndefined()
  return res.data.newChatMessagesSince.readUpTo
}

const markRead = async (to: ChatRef, upToMessageId: number) => {
  const res: any = await mutate({
    mutation: markChatConversationRead,
    variables: { ref: to, upToMessageId },
  })
  expect(res.errors).toBeUndefined()
  expect(res.data.markChatConversationRead).toBe(true)
}

beforeAll(async () => {
  testEnv = await testEnvironment(logger)
  mutate = testEnv.mutate
  query = testEnv.query
  await cleanDB()
  bibi = await userFactory(testEnv, bibiBloxberg)
  bob = await userFactory(testEnv, bobBaumeister)
  peter = await userFactory(testEnv, peterLustig)
})

afterAll(async () => {
  await cleanDB()
  await testEnv.db.destroy()
})

describe('the two ticks in a conversation of two', () => {
  let first: number
  let second: number

  beforeAll(async () => {
    await loginAs('bibi@bloxberg.de')
    first = await said(ref(peter), 'One')
    second = await said(ref(peter), 'Two')
  })
  afterAll(() => resetToken())

  it("says 0 on the writer's page before the other one opened the conversation", async () => {
    await loginAs('bibi@bloxberg.de')
    expect((await pageWith(ref(peter))).partnerReadUpTo).toBe(0)
  })

  it("says how far the other one read on the writer's page, and the writer's pointer on the reader's", async () => {
    await loginAs('peter@lustig.de')
    await markRead(ref(bibi), first)
    // His own page: how far BIBI has read -- nothing yet, whatever he read himself.
    expect((await pageWith(ref(bibi))).partnerReadUpTo).toBe(0)

    await loginAs('bibi@bloxberg.de')
    expect((await pageWith(ref(peter))).partnerReadUpTo).toBe(first)
  })

  it('says the same on the beat, in the order the members are named', async () => {
    await loginAs('peter@lustig.de')
    await markRead(ref(bibi), second)

    await loginAs('bibi@bloxberg.de')
    expect(await readUpTo([ref(bob), ref(peter)])).toEqual([0, second])
  })

  // Bob has no conversation with Peter: what Peter read with Bibi is nothing of his.
  it('tells a third member nothing of a conversation they are not in', async () => {
    await loginAs('bob@baumeister.de')
    expect(await readUpTo([ref(peter), ref(bibi)])).toEqual([0, 0])
    expect((await pageWith(ref(peter))).partnerReadUpTo).toBe(0)
  })

  it("keeps the mute mark the reader's own beside it", async () => {
    await loginAs('peter@lustig.de')
    await markRead(ref(bibi), second)

    await loginAs('bibi@bloxberg.de')
    const muted: any = await mutate({
      mutation: setChatConversationMuted,
      variables: { ref: ref(peter), muted: true },
    })
    expect(muted.errors).toBeUndefined()
    expect(await pageWith(ref(peter))).toMatchObject({ mutedByMe: true, partnerReadUpTo: second })

    await loginAs('peter@lustig.de')
    expect(await pageWith(ref(bibi))).toMatchObject({ mutedByMe: false, partnerReadUpTo: 0 })
  })
})

/**
 * A member of another community: their pointer never moves on this server (only a member's own
 * wallet moves it, asking its own server), so it is not known here -- null, whatever their row
 * says. The row is set by hand, as nothing here would ever set it.
 */
describe('the two ticks with a member of another community', () => {
  const stranger = { communityUuid: uuidv4(), gradidoID: uuidv4() }

  beforeAll(async () => {
    const bibisPair = { communityUuid: bibi.communityUuid, gradidoId: bibi.gradidoID }
    const strangersPair = { communityUuid: stranger.communityUuid, gradidoId: stranger.gradidoID }
    const conversation = await dbEnsureDirectChatConversation(bibisPair, strangersPair)
    await AppDatabase.getInstance()
      .getDrizzleDataSource()
      .update(chatConversationMembersTable)
      .set({ lastReadMessageId: 4711 })
      .where(
        and(
          eq(chatConversationMembersTable.conversationId, conversation.id),
          eq(chatConversationMembersTable.gradidoId, stranger.gradidoID),
        ),
      )
    await loginAs('bibi@bloxberg.de')
  })
  afterAll(() => resetToken())

  it('says null on the page and on the beat, whatever their row says', async () => {
    expect((await pageWith(stranger)).partnerReadUpTo).toBeNull()
    expect(await readUpTo([stranger, ref(peter)])).toEqual([null, expect.any(Number)])
  })

  it('says null on an empty page with somebody of another community, 0 with somebody of this one', async () => {
    const nobodyYet = { communityUuid: uuidv4(), gradidoID: uuidv4() }
    expect(await pageWith(nobodyYet)).toEqual({
      messages: [],
      hasMore: false,
      mutedByMe: false,
      partnerReadUpTo: null,
    })
    expect(
      (await pageWith({ communityUuid: null, gradidoID: bob.gradidoID })).partnerReadUpTo,
    ).toBe(0)
  })
})
