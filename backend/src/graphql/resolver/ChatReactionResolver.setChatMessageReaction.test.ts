// AI-GENERATED — not an architecture reference

import { getLogger } from 'config-schema/test/testSetup'
import {
  ChatConversationMemberSelect,
  ChatMessageReactionSelect,
  ChatMessageSelect,
  User as DbUser,
  dbDeleteChatMessageReaction,
  dbFindUsersByIds,
  dbSelectChatConversationMembers,
  dbSelectChatGroupUuids,
  dbSelectChatMessageForMember,
  dbSelectChatMessageImageInfos,
  dbSelectChatMessageReactions,
  dbSelectUsersByUuids,
  dbUpdateChatMessageReactedAt,
  dbUpsertChatMessageReaction,
} from 'database'
import { CHAT_REACTION_EMOJI_ROWS } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { CHAT_REACTIONS_MAX_PER_REQUEST } from '@/data/ChatReaction.logic'
import { Context, newRequestBudget } from '@/server/context'
import { ChatReactionResolver } from './ChatReactionResolver'

// What the database answers is mocked here: the subject is what the resolver decides itself when
// a member reacts to a message (migration 0158) -- to which message and with what, that every
// refusal comes before anything is written, and that the stamp and the reaction are written in
// one transaction, the stamp first. The statements themselves run against a database in
// database/src/queries (chatMessageReactions.test.ts, chatMessages.test.ts).
const transaction = jest.fn()
jest.mock('database', () => {
  const originalModule = jest.requireActual('database')
  return {
    __esModule: true,
    ...originalModule,
    drizzleDb: () => ({ transaction: (...args: unknown[]) => transaction(...args) }),
    dbSelectChatMessageForMember: jest.fn(),
    dbSelectChatConversationMembers: jest.fn(),
    dbUpdateChatMessageReactedAt: jest.fn(),
    dbUpsertChatMessageReaction: jest.fn(),
    dbDeleteChatMessageReaction: jest.fn(),
    dbSelectChatMessageReactions: jest.fn(),
    dbSelectChatMessageImageInfos: jest.fn(),
    dbSelectChatGroupUuids: jest.fn(),
    dbSelectUsersByUuids: jest.fn(),
    dbFindUsersByIds: jest.fn(),
    dbFindMemberAvatarTimestamps: jest.fn(async () => new Map()),
    getHomeCommunity: jest.fn(async () => ({ communityUuid: HOME, name: 'Gradido Akademie' })),
  }
})

// With letters in it: a test below spells it in capitals, and digits alone have no capitals.
const HOME = '1a1a1a1a-1111-4111-8111-11111111aaaa'
const ELSEWHERE = '22222222-2222-4222-8222-222222222222'
const LENA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const MAX = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const NORA = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const GROUP = '30000000-0000-4000-8000-000000000009'
const MESSAGE = '40000000-0000-4000-8000-000000000001'
const WITH_MAX = 21
const IN_GROUP = 9
const REACTED_AT = new Date('2026-10-11T06:30:00.000Z')
const THUMB = '👍'
// With the selector for its coloured drawing, as the list has it.
const HEART = '❤️'
/** What stands in for the transaction's handle: the statements are to be given this very one. */
const TX = { the: 'transaction' }

const lenaUser = {
  id: 1,
  communityUuid: HOME,
  gradidoID: LENA,
  alias: 'lena',
  firstName: 'Lena',
  lastName: 'Near',
  language: 'de',
  foreign: false,
} as unknown as DbUser

/** A request of Lena's, with a budget of its own. */
const lenasRequest = (): Context => ({
  token: null,
  setHeaders: [],
  requestBudget: newRequestBudget(),
  user: lenaUser,
})

/** A message Max wrote to Lena. */
const row = (rest: Partial<ChatMessageSelect> = {}): ChatMessageSelect => ({
  id: 5,
  messageUuid: MESSAGE,
  conversationId: WITH_MAX,
  senderCommunityUuid: HOME,
  senderGradidoId: MAX,
  subject: null,
  body: 'Der Hofflohmarkt ist am Sonntag ab 11 Uhr.',
  forwardedFromCommunityUuid: null,
  forwardedFromGradidoId: null,
  replyToMessageUuid: null,
  notify: 'none',
  mailState: null,
  deliveryState: 'delivered',
  lastAttemptAt: null,
  delaySeconds: null,
  createdAt: new Date('2026-09-30T14:28:00.000Z'),
  editedAt: null,
  reactedAt: null,
  deletedAt: null,
  ...rest,
})

const member = (
  conversationId: number,
  gradidoId: string,
  communityUuid = HOME,
): ChatConversationMemberSelect => ({
  conversationId,
  communityUuid,
  gradidoId,
  role: 'member',
  joinedAt: new Date('2026-09-29T08:00:00.000Z'),
  lastReadMessageId: null,
  mutedAt: null,
})

const reactionOf = (
  id: number,
  gradidoId: string,
  emoji: string,
  messageId = 5,
): ChatMessageReactionSelect => ({
  id,
  messageId,
  communityUuid: HOME,
  gradidoId,
  emoji,
  createdAt: new Date('2026-10-11T06:00:00.000Z'),
})

const source = dbSelectChatMessageForMember as jest.Mock
const membersOf = dbSelectChatConversationMembers as jest.Mock
const stamp = dbUpdateChatMessageReactedAt as jest.Mock
const upsert = dbUpsertChatMessageReaction as jest.Mock
const takeBack = dbDeleteChatMessageReaction as jest.Mock
const reactionRows = dbSelectChatMessageReactions as jest.Mock
const pictureInfos = dbSelectChatMessageImageInfos as jest.Mock
const groupUuids = dbSelectChatGroupUuids as jest.Mock
const byUuids = dbSelectUsersByUuids as jest.Mock
const usersByIds = dbFindUsersByIds as jest.Mock

/**
 * Lena reacts to MESSAGE: with a thumb where a test names nothing, else with exactly what it
 * names -- `undefined` too, which a default parameter would swallow.
 */
const react = (...given: [emoji?: string | null, request?: Context]) =>
  new ChatReactionResolver().setChatMessageReaction(
    { messageUuid: MESSAGE, emoji: given.length === 0 ? THUMB : given[0] },
    given[1] ?? lenasRequest(),
  )

const nothingWritten = () => {
  expect(transaction).not.toHaveBeenCalled()
  expect(stamp).not.toHaveBeenCalled()
  expect(upsert).not.toHaveBeenCalled()
  expect(takeBack).not.toHaveBeenCalled()
}

/** The message the database holds under MESSAGE, as the caller may read it. */
let held: ChatMessageSelect
const holds = (message: ChatMessageSelect) => {
  held = message
  source.mockImplementation(async () => ({ success: true, value: held }))
}

beforeEach(() => {
  jest.clearAllMocks()
  holds(row())
  // A transaction as drizzle runs one: the callback with the handle, and what it returns.
  transaction.mockImplementation(async (work: (tx: unknown) => Promise<unknown>) => work(TX))
  membersOf.mockImplementation(async (conversationId: number) => [
    member(conversationId, LENA),
    member(conversationId, MAX),
  ])
  // The stamp as the query writes it: the database's clock, on the row both members read.
  stamp.mockImplementation(async () => {
    held = { ...held, reactedAt: REACTED_AT }
    return { success: true }
  })
  upsert.mockResolvedValue(undefined)
  takeBack.mockResolvedValue(true)
  reactionRows.mockResolvedValue([])
  pictureInfos.mockResolvedValue([])
  groupUuids.mockImplementation(
    async (ids: number[]) =>
      new Map(ids.filter((id) => id === IN_GROUP).map((id) => [id, GROUP] as const)),
  )
  byUuids.mockImplementation(async (pairs: { communityUuid: string; gradidoId: string }[]) =>
    pairs.map((pair) => ({ id: 1, ...pair, alias: 'max', deletedAt: null })),
  )
  usersByIds.mockResolvedValue([lenaUser])
})

describe('setChatMessageReaction, what the resolver decides itself', () => {
  it("sets the caller's reaction and hands back the message with its reactions", async () => {
    reactionRows.mockResolvedValue([reactionOf(1, MAX, HEART), reactionOf(2, LENA, THUMB)])

    const copy = await react(THUMB)

    expect(source).toHaveBeenCalledWith(MESSAGE, { communityUuid: HOME, gradidoId: LENA })
    expect(transaction).toHaveBeenCalledTimes(1)
    expect(stamp.mock.calls).toEqual([[5, { communityUuid: HOME, gradidoId: LENA }, TX]])
    expect(upsert.mock.calls).toEqual([
      [{ messageId: 5, communityUuid: HOME, gradidoId: LENA, emoji: THUMB }, TX],
    ])
    expect(takeBack).not.toHaveBeenCalled()
    // Read after the write: the answer carries the stamp and the reactions as they stand.
    expect(reactionRows.mock.calls).toEqual([[[5]]])
    expect(copy).toMatchObject({ messageUuid: MESSAGE, mine: false, reactedAt: REACTED_AT })
    expect(copy.reactions).toEqual([
      { emoji: HEART, count: 1, mine: false },
      { emoji: THUMB, count: 1, mine: true },
    ])
  })

  // ⛔ The stamp first: it holds the message's row while the reaction is written, and it is the
  // statement that carries the rule once more.
  it('writes the stamp before the reaction, both in the one transaction', async () => {
    const steps: string[] = []
    transaction.mockImplementation(async (work: (tx: unknown) => Promise<unknown>) => {
      steps.push('transaction begun')
      const result = await work(TX)
      steps.push('transaction ended')
      return result
    })
    stamp.mockImplementation(async () => {
      steps.push('stamped')
      held = { ...held, reactedAt: REACTED_AT }
      return { success: true }
    })
    upsert.mockImplementation(async () => {
      steps.push('reaction written')
    })
    source.mockImplementation(async () => {
      steps.push('message read')
      return { success: true, value: held }
    })

    await react()

    expect(steps).toEqual([
      'message read',
      'transaction begun',
      'stamped',
      'reaction written',
      'transaction ended',
      'message read',
    ])
  })

  it.each([
    ['null', null],
    ['nothing', undefined],
  ])("takes the caller's reaction back for %s in the place of an emoji", async (_name, emoji) => {
    const copy = await react(emoji)

    expect(stamp.mock.calls).toEqual([[5, { communityUuid: HOME, gradidoId: LENA }, TX]])
    expect(takeBack.mock.calls).toEqual([[5, { communityUuid: HOME, gradidoId: LENA }, TX]])
    expect(upsert).not.toHaveBeenCalled()
    expect(copy.reactions).toEqual([])
    expect(copy.reactedAt).toEqual(REACTED_AT)
  })

  // None there to take back: the answer is the message as it stands, and no refusal.
  it('answers the message as it stands where there was no reaction to take back', async () => {
    takeBack.mockResolvedValue(false)
    reactionRows.mockResolvedValue([reactionOf(1, MAX, HEART)])

    expect((await react(null)).reactions).toEqual([{ emoji: HEART, count: 1, mine: false }])
  })

  it('lets the caller react to a message of their own', async () => {
    holds(row({ senderGradidoId: LENA }))

    const copy = await react(HEART)

    expect(upsert.mock.calls[0][0]).toMatchObject({ gradidoId: LENA, emoji: HEART })
    expect(copy.mine).toBe(true)
  })

  it('lets a member of a group of this community react', async () => {
    holds(row({ conversationId: IN_GROUP }))
    membersOf.mockResolvedValue([
      member(IN_GROUP, LENA),
      member(IN_GROUP, MAX),
      member(IN_GROUP, NORA),
    ])

    const copy = await react()

    expect(membersOf).toHaveBeenCalledWith(IN_GROUP)
    expect(upsert).toHaveBeenCalledTimes(1)
    expect(copy.groupUuid).toBe(GROUP)
  })

  it('takes every one of the forty-eight, each as it stands in the list', async () => {
    const all = CHAT_REACTION_EMOJI_ROWS.flat()
    expect(all).toHaveLength(48)
    for (const emoji of all) {
      await react(emoji)
    }
    expect(upsert.mock.calls.map(([written]) => written.emoji)).toEqual(all)
  })
})

describe('setChatMessageReaction, what it refuses before anything is written', () => {
  it.each([
    ['an emoji the wallets do not offer', '🦄'],
    ['a word', 'ja'],
    ['two of the forty-eight', '👍👍'],
    ['one of them with a word behind it', '👍 ok'],
    ['the heart without its selector', '❤'],
    ['a thumb with a skin tone', '👍🏽'],
    ['a space', ' '],
    ['nothing at all, as a text', ''],
  ])('%s: UNKNOWN_EMOJI', async (_name, emoji) => {
    await expect(react(emoji)).rejects.toThrow('CHAT_REACTION_NOT_SET: UNKNOWN_EMOJI')
    // Not even looked up: what is no reaction says nothing about any message.
    expect(source).not.toHaveBeenCalled()
    nothingWritten()
  })

  it('a message the caller cannot read, or none: UNKNOWN_MESSAGE', async () => {
    source.mockResolvedValue({ success: false, error: new Error('not found') })

    await expect(react()).rejects.toThrow('CHAT_REACTION_NOT_SET: UNKNOWN_MESSAGE')
    expect(membersOf).not.toHaveBeenCalled()
    nothingWritten()
  })

  // Their server holds a copy of the message, and a reaction has no way there yet.
  it('a conversation with a member of another community: OTHER_COMMUNITY', async () => {
    membersOf.mockResolvedValue([member(WITH_MAX, LENA), member(WITH_MAX, MAX, ELSEWHERE)])

    await expect(react()).rejects.toThrow('CHAT_REACTION_NOT_SET: OTHER_COMMUNITY')
    nothingWritten()
  })

  it('a group with one member of another community among several: OTHER_COMMUNITY', async () => {
    holds(row({ conversationId: IN_GROUP }))
    membersOf.mockResolvedValue([
      member(IN_GROUP, LENA),
      member(IN_GROUP, MAX),
      member(IN_GROUP, NORA, ELSEWHERE),
    ])

    await expect(react(null)).rejects.toThrow('CHAT_REACTION_NOT_SET: OTHER_COMMUNITY')
    nothingWritten()
  })

  it('takes this community for the same whatever the case it is written in', async () => {
    membersOf.mockResolvedValue([member(WITH_MAX, LENA), member(WITH_MAX, MAX, HOME.toUpperCase())])

    await react()

    expect(upsert).toHaveBeenCalledTimes(1)
  })

  // ⛔ Counted before anything is looked up: a document may repeat the field under any number
  // of aliases, and each one is a transaction.
  it('more reactions in one request than CHAT_REACTIONS_MAX_PER_REQUEST', async () => {
    const request = lenasRequest()
    for (let n = 0; n < CHAT_REACTIONS_MAX_PER_REQUEST; n += 1) {
      await react(THUMB, request)
    }
    expect(upsert).toHaveBeenCalledTimes(CHAT_REACTIONS_MAX_PER_REQUEST)
    jest.clearAllMocks()

    await expect(react(THUMB, request)).rejects.toThrow('Too many chat reactions set at once')
    expect(source).not.toHaveBeenCalled()
    nothingWritten()
    // The next request has a budget of its own.
    await react(THUMB)
    expect(upsert).toHaveBeenCalledTimes(1)
  })
})

describe('setChatMessageReaction, where the write does not go through', () => {
  // Gone, or the caller no longer in the conversation, between the look and the write: the stamp
  // finds no row, and no reaction is written beside it.
  it('writes no reaction where the stamp finds no message: UNKNOWN_MESSAGE', async () => {
    stamp.mockResolvedValue({ success: false, error: new Error('not found') })

    await expect(react()).rejects.toThrow('CHAT_REACTION_NOT_SET: UNKNOWN_MESSAGE')
    expect(stamp).toHaveBeenCalledTimes(1)
    expect(upsert).not.toHaveBeenCalled()
    expect(takeBack).not.toHaveBeenCalled()
  })

  it('answers NOT_STORED where the database fails, with its code in the log and nothing more', async () => {
    const errors = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)
    upsert.mockRejectedValue(
      Object.assign(new Error(`Failed query: insert … params: 5,${HOME},${LENA},${THUMB}`), {
        cause: { code: 'ER_LOCK_WAIT_TIMEOUT' },
      }),
    )

    await expect(react()).rejects.toThrow('CHAT_REACTION_NOT_SET: NOT_STORED')

    expect((errors.error as jest.Mock).mock.calls).toEqual([
      ['CHAT_REACTION_NOT_SET: NOT_STORED', MESSAGE, 'ER_LOCK_WAIT_TIMEOUT'],
    ])
    // Tried once: only a transaction the database ended for a deadlock is tried again.
    expect(transaction).toHaveBeenCalledTimes(1)
  })

  /**
   * A transaction the database ended to resolve a deadlock wrote nothing, and the one it met is
   * through by the second try: the stamp holds the message and reads the membership, marking a
   * conversation read holds the membership and reads the message.
   */
  describe('a deadlock', () => {
    const deadlock = () =>
      Object.assign(new Error(`Failed query: update … params: 5,${HOME},${LENA}`), {
        cause: { code: 'ER_LOCK_DEADLOCK' },
      })

    it('is tried once more, and the reaction is set', async () => {
      stamp.mockRejectedValueOnce(deadlock())

      const answer = await react()

      expect(transaction).toHaveBeenCalledTimes(2)
      // The whole write again, the stamp first: nothing of the first try was kept.
      expect(stamp).toHaveBeenCalledTimes(2)
      expect(upsert).toHaveBeenCalledTimes(1)
      expect(answer.messageUuid).toBe(MESSAGE)
    })

    it('is tried once more where it met the reaction instead of the stamp', async () => {
      upsert.mockRejectedValueOnce(deadlock())

      await react()

      expect(transaction).toHaveBeenCalledTimes(2)
      expect(stamp).toHaveBeenCalledTimes(2)
      expect(upsert).toHaveBeenCalledTimes(2)
    })

    it('is tried once more for taking a reaction back as well', async () => {
      takeBack.mockRejectedValueOnce(deadlock())

      await react(undefined)

      expect(transaction).toHaveBeenCalledTimes(2)
      expect(takeBack).toHaveBeenCalledTimes(2)
      expect(upsert).not.toHaveBeenCalled()
    })

    it('answers NOT_STORED after the second one, and tries no third time', async () => {
      const errors = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)
      stamp.mockRejectedValue(deadlock())

      await expect(react()).rejects.toThrow('CHAT_REACTION_NOT_SET: NOT_STORED')

      expect(transaction).toHaveBeenCalledTimes(2)
      expect(upsert).not.toHaveBeenCalled()
      expect((errors.error as jest.Mock).mock.calls).toEqual([
        ['CHAT_REACTION_NOT_SET: NOT_STORED', MESSAGE, 'ER_LOCK_DEADLOCK'],
      ])
    })

    it('answers NOT_STORED where the second try fails for another reason', async () => {
      const errors = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)
      stamp
        .mockRejectedValueOnce(deadlock())
        .mockRejectedValueOnce(Object.assign(new Error('gone'), { code: 'ECONNRESET' }))

      await expect(react()).rejects.toThrow('CHAT_REACTION_NOT_SET: NOT_STORED')

      expect(transaction).toHaveBeenCalledTimes(2)
      expect((errors.error as jest.Mock).mock.calls).toEqual([
        ['CHAT_REACTION_NOT_SET: NOT_STORED', MESSAGE, 'ECONNRESET'],
      ])
    })
  })

  it('answers UNKNOWN_MESSAGE where the message is gone once the reaction is written', async () => {
    source
      .mockResolvedValueOnce({ success: true, value: row() })
      .mockResolvedValueOnce({ success: false, error: new Error('not found') })

    await expect(react()).rejects.toThrow('CHAT_REACTION_NOT_SET: UNKNOWN_MESSAGE')
    expect(upsert).toHaveBeenCalledTimes(1)
  })
})

describe('setChatMessageReaction, what it writes to the log', () => {
  // ⛔ The message's uuid, never the emoji: with the message it would say what somebody thought
  // of it.
  it('names the message, and whether a reaction was set or taken back -- never the emoji', async () => {
    const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ChatReactionResolver`)

    await react(HEART)
    await react(null)

    expect((logger.info as jest.Mock).mock.calls).toEqual([
      [`chat reaction set: message_uuid=${MESSAGE}`],
      [`chat reaction taken back: message_uuid=${MESSAGE}`],
    ])
  })

  it('names no emoji where it refuses one', async () => {
    const errors = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

    await expect(react('🦄')).rejects.toThrow('UNKNOWN_EMOJI')

    expect((errors.error as jest.Mock).mock.calls).toEqual([
      ['CHAT_REACTION_NOT_SET: UNKNOWN_EMOJI', MESSAGE],
    ])
  })
})
