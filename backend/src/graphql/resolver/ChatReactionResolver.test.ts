// AI-GENERATED — not an architecture reference
import { ApolloServerTestClient, cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { getLogger } from 'config-schema/test/testSetup'
import {
  CONFIG as CORE_CONFIG,
  sendChatGroupAddedEmail,
  sendChatGroupMessageEmail,
  sendCustomEmail,
} from 'core'
import {
  AppDatabase,
  chatConversationMembersTable,
  chatMessageReactionsTable,
  chatMessagesTable,
  User as DbUser,
  UserContact as DbUserContact,
  User,
} from 'database'
import { and, eq } from 'drizzle-orm'
import { GraphQLError } from 'graphql'
import { v4 as uuidv4 } from 'uuid'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { userFactory } from '@/seeds/factory/user'
import {
  createChatGroup,
  editChatMessage,
  login,
  sendChatGroupMessage,
  sendChatMessage,
  setChatMessageReaction,
} from '@/seeds/graphql/mutations'
import {
  chatMessagesWithMemberAndReactions,
  newChatMessagesAndReactionsSince,
} from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { peterLustig } from '@/seeds/users/peter-lustig'

/**
 * Reacting to a message (migration 0158), through the whole server and against a database: a
 * member reacts, the thread shows it to both, and the other member's beat hands the message out
 * -- by the database's clock, with a cursor of its own. What the resolver decides itself is held
 * in ChatReactionResolver.setChatMessageReaction.test.ts, where each answer of the database can
 * be brought about.
 */
// The mails are watched, to see that a reaction sends none. Nothing is sent either way.
jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    sendCustomEmail: jest.fn(async () => ({ accepted: ['watched'] })),
    sendChatGroupAddedEmail: jest.fn(async () => ({ accepted: ['watched'] })),
    sendChatGroupMessageEmail: jest.fn(async () => ({ accepted: ['watched'] })),
  }
})
const mails = [sendCustomEmail, sendChatGroupAddedEmail, sendChatGroupMessageEmail] as jest.Mock[]

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
let garrick: User

const THUMB = '👍'
const SEEDLING = '🌱'
// With the selector for its coloured drawing: two code points, sent and read back whole.
const HEART = '❤️'

type ChatRef = { communityUuid: string; gradidoID: string }
type Reaction = { emoji: string; count: number; mine: boolean }
type Reacted = {
  id: number
  messageUuid: string
  mine: boolean
  body: string
  reactedAt: string | null
  reactions: Reaction[]
}
type Beat = {
  latestId: number
  unreadConversations: number
  messages: { id: number; body: string; reactedAt: string | null; reactions: Reaction[] }[]
  reacted: Reacted[]
  reactedCursor: string
}

const ref = (member: User): ChatRef => ({
  communityUuid: member.communityUuid,
  gradidoID: member.gradidoID,
})

const loginAs = async (email: string): Promise<void> => {
  await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
}

/** Writes in the chat to `to`, as whoever is logged in: the sender's own copy. */
const said = async (to: ChatRef, body: string) => {
  const res: any = await mutate({
    mutation: sendChatMessage,
    variables: { ref: to, body, notify: 'NONE' },
  })
  expect(res.errors).toBeUndefined()
  return res.data.sendChatMessage as { id: number; messageUuid: string }
}

/** Reacts to a message, or takes the reaction back (`null`), as whoever is logged in. */
const react = (messageUuid: string, emoji: string | null): Promise<any> =>
  mutate({ mutation: setChatMessageReaction, variables: { messageUuid, emoji } })

/** The same, where it must go through: the caller's copy as it stands then. */
const reacted = async (messageUuid: string, emoji: string | null): Promise<Reacted> => {
  const res = await react(messageUuid, emoji)
  expect(res.errors).toBeUndefined()
  return res.data.setChatMessageReaction
}

/** The beat of whoever is logged in. */
const beat = async (
  variables: { afterId?: number | null; reactedCursor?: string | null } = {},
): Promise<Beat> => {
  const res: any = await query({ query: newChatMessagesAndReactionsSince, variables })
  expect(res.errors).toBeUndefined()
  return res.data.newChatMessagesSince
}

/** The thread of whoever is logged in with `member`: each message's text and its reactions. */
const threadWith = async (member: User): Promise<[string, Reaction[]][]> => {
  const res: any = await query({
    query: chatMessagesWithMemberAndReactions,
    variables: { ref: ref(member) },
  })
  expect(res.errors).toBeUndefined()
  return res.data.chatMessagesWithMember.messages.map(
    (message: { body: string; reactions: Reaction[] }) => [message.body, message.reactions],
  )
}

const drizzle = () => AppDatabase.getInstance().getDrizzleDataSource()

/** The row of a message, as this server has it filed. */
const rowOf = async (messageUuid: string) => {
  const [row] = await drizzle()
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.messageUuid, messageUuid))
  return row
}

/** The reactions filed for a message: who, and with what, in the order they reacted. */
const filedFor = async (messageId: number): Promise<[string, string][]> =>
  (
    await drizzle()
      .select()
      .from(chatMessageReactionsTable)
      .where(eq(chatMessageReactionsTable.messageId, messageId))
      .orderBy(chatMessageReactionsTable.id)
  ).map((row) => [row.gradidoId, row.emoji])

beforeAll(async () => {
  testEnv = await testEnvironment(logger)
  mutate = testEnv.mutate
  query = testEnv.query
  await cleanDB()
  bibi = await userFactory(testEnv, bibiBloxberg)
  bob = await userFactory(testEnv, bobBaumeister)
  peter = await userFactory(testEnv, peterLustig)
  // Confirmed, so that a password exists and he can log in (his seed is not).
  garrick = await userFactory(testEnv, { ...garrickOllivander, emailChecked: true })
})

afterAll(async () => {
  await cleanDB()
  await testEnv.db.destroy()
})

describe('setChatMessageReaction without a login', () => {
  beforeAll(() => resetToken())

  it('answers 401', async () => {
    expect((await react(uuidv4(), THUMB)).errors).toEqual([new GraphQLError('401 Unauthorized')])
  })
})

/**
 * bibi writes to bob, bob answers. bob's and peter's wallets stand where their first beat put
 * them; then bibi reacts to bob's message.
 */
describe('a reaction to a message of a conversation of two', () => {
  let bibis: { id: number; messageUuid: string }
  let bobs: { id: number; messageUuid: string }
  let bobStood: Beat
  let peterStood: Beat
  let first: Reacted

  beforeAll(async () => {
    await loginAs('bibi@bloxberg.de')
    bibis = await said(ref(bob), 'Shall we meet at ten?')
    await loginAs('bob@baumeister.de')
    bobs = await said(ref(bibi), 'Ten is fine.')
    bobStood = await beat()
    await loginAs('peter@lustig.de')
    peterStood = await beat()

    for (const mail of mails) {
      mail.mockClear()
    }
    await loginAs('bibi@bloxberg.de')
    first = await reacted(bobs.messageUuid, THUMB)
  })
  afterAll(() => resetToken())

  it('hands the member the message with her reaction and the moment of it', () => {
    expect(first).toMatchObject({
      id: bobs.id,
      messageUuid: bobs.messageUuid,
      mine: false,
      body: 'Ten is fine.',
      reactions: [{ emoji: THUMB, count: 1, mine: true }],
    })
    expect(first.reactedAt).not.toBeNull()
  })

  it('files one row for it and stamps the message, and changes nothing else on it', async () => {
    expect(await filedFor(bobs.id)).toEqual([[bibi.gradidoID, THUMB]])
    const row = await rowOf(bobs.messageUuid)
    expect(row.reactedAt?.toISOString()).toBe(first.reactedAt)
    expect(row).toMatchObject({ body: 'Ten is fine.', editedAt: null, deletedAt: null })
    // The other message of the thread is untouched.
    expect((await rowOf(bibis.messageUuid)).reactedAt).toBeNull()
  })

  it('sends no mail about it', () => {
    for (const mail of mails) {
      expect(mail).not.toHaveBeenCalled()
    }
  })

  it('shows the reaction in the thread, to both of them -- each reads whose it is', async () => {
    expect(await threadWith(bob)).toEqual([
      ['Shall we meet at ten?', []],
      ['Ten is fine.', [{ emoji: THUMB, count: 1, mine: true }]],
    ])
    await loginAs('bob@baumeister.de')
    expect(await threadWith(bibi)).toEqual([
      ['Shall we meet at ten?', []],
      ['Ten is fine.', [{ emoji: THUMB, count: 1, mine: false }]],
    ])
  })

  describe("on the other member's beat", () => {
    beforeAll(() => loginAs('bob@baumeister.de'))

    it('comes as a message whose reactions changed, not as a new one, and makes nothing unread', async () => {
      const update = await beat({
        afterId: bobStood.latestId,
        reactedCursor: bobStood.reactedCursor,
      })

      expect(update.messages).toEqual([])
      expect(update.reacted).toEqual([
        {
          id: bobs.id,
          messageUuid: bobs.messageUuid,
          mine: true,
          body: 'Ten is fine.',
          reactedAt: first.reactedAt,
          reactions: [{ emoji: THUMB, count: 1, mine: false }],
        },
      ])
      expect(update.latestId).toBe(bobs.id)
      expect(update.unreadConversations).toBe(bobStood.unreadConversations)
    })

    // The place handed on lies behind the clock, as for a changed text: the message comes once
    // more, and a reaction committed a moment late is not passed over.
    it('comes once more with the cursor the answer hands on, and not after itself', async () => {
      const once = await beat({ reactedCursor: bobStood.reactedCursor })
      const [moment, id] = once.reactedCursor.split('-').map(Number)
      expect(moment).toBeLessThan(Date.parse(first.reactedAt as string))
      expect(id).toBe(0)
      expect((await beat({ reactedCursor: once.reactedCursor })).reacted.map((m) => m.id)).toEqual([
        bobs.id,
      ])

      const afterIt = `${Date.parse(first.reactedAt as string)}-${bobs.id}`
      expect((await beat({ reactedCursor: afterIt })).reacted).toEqual([])
    })

    it('does not come without a cursor, and what is no cursor is refused', async () => {
      const none = await beat()
      expect(none.reacted).toEqual([])
      expect(none.reactedCursor).toMatch(/^\d+-0$/)

      const res: any = await query({
        query: newChatMessagesAndReactionsSince,
        variables: { reactedCursor: 'yesterday' },
      })
      expect(res.errors?.[0]?.message).toContain('Argument Validation Error')
    })
  })

  it('never comes on the beat of somebody who is not in the conversation', async () => {
    await loginAs('peter@lustig.de')
    const update = await beat({
      afterId: peterStood.latestId,
      reactedCursor: peterStood.reactedCursor,
    })
    expect(update.reacted).toEqual([])
    expect(update.messages).toEqual([])
  })

  describe('and after it', () => {
    it('the other member reacts as well: two emoji in the order they came up', async () => {
      await loginAs('bob@baumeister.de')
      const bobsCopy = await reacted(bobs.messageUuid, HEART)

      expect(bobsCopy.mine).toBe(true)
      expect(bobsCopy.reactions).toEqual([
        { emoji: THUMB, count: 1, mine: false },
        { emoji: HEART, count: 1, mine: true },
      ])
      expect(await filedFor(bobs.id)).toEqual([
        [bibi.gradidoID, THUMB],
        [bob.gradidoID, HEART],
      ])
      // The heart came back as it was sent: two code points.
      expect([...bobsCopy.reactions[1].emoji]).toHaveLength(2)
    })

    it('the same emoji from both is one emoji, counted twice', async () => {
      await loginAs('bob@baumeister.de')
      const bobsCopy = await reacted(bobs.messageUuid, THUMB)

      expect(bobsCopy.reactions).toEqual([{ emoji: THUMB, count: 2, mine: true }])
      await loginAs('bibi@bloxberg.de')
      expect((await threadWith(bob))[1][1]).toEqual([{ emoji: THUMB, count: 2, mine: true }])
    })

    // ⛔ One reaction a member and message: another one takes the place of the first.
    it('another emoji takes the place of the one before, and nobody else’s goes with it', async () => {
      await loginAs('bibi@bloxberg.de')
      const before = (await rowOf(bobs.messageUuid)).reactedAt as Date
      const bibisCopy = await reacted(bobs.messageUuid, SEEDLING)

      expect(bibisCopy.reactions).toEqual([
        { emoji: SEEDLING, count: 1, mine: true },
        { emoji: THUMB, count: 1, mine: false },
      ])
      expect(await filedFor(bobs.id)).toEqual([
        [bibi.gradidoID, SEEDLING],
        [bob.gradidoID, THUMB],
      ])
      expect(Date.parse(bibisCopy.reactedAt as string)).toBeGreaterThanOrEqual(before.getTime())
    })

    it('is taken back by sending none, and the message is stamped again', async () => {
      await loginAs('bibi@bloxberg.de')
      const stood = await beat()
      const bibisCopy = await reacted(bobs.messageUuid, null)

      expect(bibisCopy.reactions).toEqual([{ emoji: THUMB, count: 1, mine: false }])
      expect(await filedFor(bobs.id)).toEqual([[bob.gradidoID, THUMB]])
      // bob learns that it is gone: the message comes on his beat, without her seedling.
      await loginAs('bob@baumeister.de')
      const update = await beat({ reactedCursor: stood.reactedCursor })
      expect(update.reacted.map((m) => [m.id, m.reactions])).toEqual([
        [bobs.id, [{ emoji: THUMB, count: 1, mine: true }]],
      ])
    })

    it('taking back where there is none is no failure', async () => {
      await loginAs('bibi@bloxberg.de')
      expect((await reacted(bobs.messageUuid, null)).reactions).toEqual([
        { emoji: THUMB, count: 1, mine: false },
      ])
      expect(await filedFor(bobs.id)).toEqual([[bob.gradidoID, THUMB]])
    })

    it('a member reacts to a message of her own', async () => {
      await loginAs('bibi@bloxberg.de')
      const own = await reacted(bibis.messageUuid, HEART)

      expect(own).toMatchObject({ mine: true, reactions: [{ emoji: HEART, count: 1, mine: true }] })
    })

    // A text changed afterwards keeps its reactions, and a reaction does not mark a text as
    // changed: the two clocks are apart.
    it('leaves the text unmarked, and a changed text keeps its reactions', async () => {
      await loginAs('bibi@bloxberg.de')
      expect((await rowOf(bibis.messageUuid)).editedAt).toBeNull()
      const res: any = await mutate({
        mutation: editChatMessage,
        variables: { messageUuid: bibis.messageUuid, body: 'Shall we meet at eleven?' },
      })
      expect(res.errors).toBeUndefined()

      expect((await threadWith(bob))[0]).toEqual([
        'Shall we meet at eleven?',
        [{ emoji: HEART, count: 1, mine: true }],
      ])
    })
  })

  describe('what is refused, with nothing written', () => {
    let filedBefore: [string, string][]
    let stampBefore: Date | null

    beforeAll(async () => {
      filedBefore = await filedFor(bobs.id)
      stampBefore = (await rowOf(bobs.messageUuid)).reactedAt
    })
    afterEach(async () => {
      expect(await filedFor(bobs.id)).toEqual(filedBefore)
      expect((await rowOf(bobs.messageUuid)).reactedAt).toEqual(stampBefore)
    })

    it('somebody who is not in the conversation: UNKNOWN_MESSAGE', async () => {
      await loginAs('peter@lustig.de')
      expect((await react(bobs.messageUuid, THUMB)).errors).toEqual([
        new GraphQLError('CHAT_REACTION_NOT_SET: UNKNOWN_MESSAGE'),
      ])
      // Not to take one back either.
      expect((await react(bobs.messageUuid, null)).errors).toEqual([
        new GraphQLError('CHAT_REACTION_NOT_SET: UNKNOWN_MESSAGE'),
      ])
    })

    it('a message nobody has filed: UNKNOWN_MESSAGE', async () => {
      await loginAs('bibi@bloxberg.de')
      expect((await react(uuidv4(), THUMB)).errors).toEqual([
        new GraphQLError('CHAT_REACTION_NOT_SET: UNKNOWN_MESSAGE'),
      ])
    })

    it('an emoji that is none of the forty-eight: UNKNOWN_EMOJI', async () => {
      await loginAs('bibi@bloxberg.de')
      for (const emoji of ['🦄', 'ok', `${THUMB}${THUMB}`, '❤']) {
        expect((await react(bobs.messageUuid, emoji)).errors).toEqual([
          new GraphQLError('CHAT_REACTION_NOT_SET: UNKNOWN_EMOJI'),
        ])
      }
    })

    it('what is longer than a reaction, and what names no message, where the arguments arrive', async () => {
      await loginAs('bibi@bloxberg.de')
      // Seventeen signs. The bound counts a sign beyond the basic plane as one, as the column
      // does; sixteen thumbs pass it and are refused as no reaction.
      const tooLong: any = await react(bobs.messageUuid, THUMB.repeat(17))
      expect(tooLong.errors?.[0]?.message).toContain('Argument Validation Error')
      const noUuid: any = await react('the last one', THUMB)
      expect(noUuid.errors?.[0]?.message).toContain('Argument Validation Error')
      expect((await react(bobs.messageUuid, THUMB.repeat(16))).errors).toEqual([
        new GraphQLError('CHAT_REACTION_NOT_SET: UNKNOWN_EMOJI'),
      ])
    })
  })

  // Their server holds a copy of the message, and a reaction has no way there yet.
  describe('in a conversation with a member of another community', () => {
    const ELSEWHERE = '22222222-2222-4222-8222-222222222222'
    let conversationId: number

    beforeAll(async () => {
      conversationId = (await rowOf(bobs.messageUuid)).conversationId
      await drizzle()
        .update(chatConversationMembersTable)
        .set({ communityUuid: ELSEWHERE })
        .where(
          and(
            eq(chatConversationMembersTable.conversationId, conversationId),
            eq(chatConversationMembersTable.gradidoId, bob.gradidoID),
          ),
        )
    })
    afterAll(async () => {
      await drizzle()
        .update(chatConversationMembersTable)
        .set({ communityUuid: bob.communityUuid })
        .where(
          and(
            eq(chatConversationMembersTable.conversationId, conversationId),
            eq(chatConversationMembersTable.gradidoId, bob.gradidoID),
          ),
        )
    })

    it('is refused: OTHER_COMMUNITY, and nothing is written', async () => {
      const filedBefore = await filedFor(bobs.id)
      const stampBefore = (await rowOf(bobs.messageUuid)).reactedAt
      await loginAs('bibi@bloxberg.de')

      expect((await react(bobs.messageUuid, SEEDLING)).errors).toEqual([
        new GraphQLError('CHAT_REACTION_NOT_SET: OTHER_COMMUNITY'),
      ])
      expect(await filedFor(bobs.id)).toEqual(filedBefore)
      expect((await rowOf(bobs.messageUuid)).reactedAt).toEqual(stampBefore)
    })
  })

  describe('to a message marked deleted', () => {
    beforeAll(async () => {
      await drizzle()
        .update(chatMessagesTable)
        .set({ deletedAt: new Date() })
        .where(eq(chatMessagesTable.messageUuid, bibis.messageUuid))
    })
    afterAll(async () => {
      await drizzle()
        .update(chatMessagesTable)
        .set({ deletedAt: null })
        .where(eq(chatMessagesTable.messageUuid, bibis.messageUuid))
    })

    it('is refused: UNKNOWN_MESSAGE', async () => {
      await loginAs('bob@baumeister.de')
      expect((await react(bibis.messageUuid, THUMB)).errors).toEqual([
        new GraphQLError('CHAT_REACTION_NOT_SET: UNKNOWN_MESSAGE'),
      ])
    })
  })
})

/**
 * A group of bibi's with bob and peter; garrick is not in it. Two of them react to one message.
 */
describe('reactions in a group', () => {
  let groupUuid: string
  let message: { id: number; messageUuid: string }
  let peterStood: Beat

  beforeAll(async () => {
    // bibi's contacts: the people she wrote to (KF-012).
    await loginAs('bibi@bloxberg.de')
    for (const member of [bob, peter]) {
      await said(ref(member), 'Hallo!')
    }
    const opened: any = await mutate({
      mutation: createChatGroup,
      variables: { title: 'Hofflohmarkt', members: [ref(bob), ref(peter)] },
    })
    expect(opened.errors).toBeUndefined()
    groupUuid = opened.data.createChatGroup.groupUuid
    const written: any = await mutate({
      mutation: sendChatGroupMessage,
      variables: { groupUuid, body: 'Wer bringt Kuchen mit?', announce: false },
    })
    expect(written.errors).toBeUndefined()
    message = written.data.sendChatGroupMessage
    await loginAs('peter@lustig.de')
    peterStood = await beat()
  })
  afterAll(() => resetToken())

  it('counts the members who reacted with the same emoji, and says to each whether they did', async () => {
    await loginAs('bob@baumeister.de')
    expect((await reacted(message.messageUuid, THUMB)).reactions).toEqual([
      { emoji: THUMB, count: 1, mine: true },
    ])
    await loginAs('bibi@bloxberg.de')
    expect((await reacted(message.messageUuid, THUMB)).reactions).toEqual([
      { emoji: THUMB, count: 2, mine: true },
    ])
    expect(await filedFor(message.id)).toEqual([
      [bob.gradidoID, THUMB],
      [bibi.gradidoID, THUMB],
    ])
  })

  it('reaches the member who did not react, on his beat', async () => {
    await loginAs('peter@lustig.de')
    const update = await beat({
      afterId: peterStood.latestId,
      reactedCursor: peterStood.reactedCursor,
    })

    expect(update.reacted.map((m) => [m.id, m.mine, m.reactions])).toEqual([
      [message.id, false, [{ emoji: THUMB, count: 2, mine: false }]],
    ])
  })

  it('refuses somebody who is not in the group: UNKNOWN_MESSAGE, and nothing is written', async () => {
    const stampBefore = (await rowOf(message.messageUuid)).reactedAt
    await loginAs('garrick@ollivander.com')

    expect((await react(message.messageUuid, THUMB)).errors).toEqual([
      new GraphQLError('CHAT_REACTION_NOT_SET: UNKNOWN_MESSAGE'),
    ])
    expect(await filedFor(message.id)).toEqual([
      [bob.gradidoID, THUMB],
      [bibi.gradidoID, THUMB],
    ])
    expect((await rowOf(message.messageUuid)).reactedAt).toEqual(stampBefore)
  })
})

// Behind SEND_CHAT_MESSAGE: an account that may not write may not react either.
describe('an unconfirmed account past its grace period', () => {
  let bibis: { id: number; messageUuid: string }

  beforeAll(async () => {
    await loginAs('bibi@bloxberg.de')
    bibis = await said(ref(garrick), 'Welcome!')
    // He could log in and read it; now unconfirmed, and two days old.
    await DbUser.update(
      { id: garrick.id },
      { createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    )
    await DbUserContact.update({ id: garrick.emailId ?? 0 }, { emailChecked: false })
    await loginAs('garrick@ollivander.com')
  })
  afterAll(() => resetToken())

  it('may not react to what it was written, and nothing is written', async () => {
    const before = await rowOf(bibis.messageUuid)

    expect((await react(bibis.messageUuid, THUMB)).errors).toEqual([
      new GraphQLError('401 Unauthorized'),
    ])
    expect(await rowOf(bibis.messageUuid)).toEqual(before)
    expect(await filedFor(bibis.id)).toEqual([])
  })
})
