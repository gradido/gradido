// AI-GENERATED — not an architecture reference

import { getLogger } from 'config-schema/test/testSetup'
import {
  User as DbUser,
  dbDeleteTransactionReaction,
  dbMarkReceivedTransferSeen,
  dbSelectReceivedTransferOfUser,
  dbSelectTransactionReactions,
  dbUpsertTransactionReaction,
} from 'database'
import { CHAT_REACTION_EMOJI_ROWS, GradidoUnit } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { TRANSACTION_REACTIONS_MAX_PER_REQUEST } from '@/data/TransactionReaction.logic'
import { Context, newRequestBudget } from '@/server/context'
import { TransactionReactionResolver } from './TransactionReactionResolver'
import { notifyGiverOfReaction } from './util/transactionReactionMail'

// What the database answers is mocked here: the subject is what the resolver decides itself when
// a member reacts to a transfer (migration 0159) -- that only the recipient does, to a transfer
// from a member of this server, with one of the forty-eight, and that every refusal comes before
// anything is written. The statements themselves run against a database in database/src/queries
// (transactionReactions.test.ts, transactions.test.ts), and the whole way in
// TransactionReactionResolver.test.ts.
jest.mock('database', () => {
  const originalModule = jest.requireActual('database')
  return {
    __esModule: true,
    ...originalModule,
    dbSelectReceivedTransferOfUser: jest.fn(),
    dbSelectTransactionReactions: jest.fn(),
    dbUpsertTransactionReaction: jest.fn(),
    dbDeleteTransactionReaction: jest.fn(),
    dbMarkReceivedTransferSeen: jest.fn(),
  }
})

// The mail about a first reaction (W1) is watched, not sent: what it is told, and when. What it
// makes of that is held in transactionReactionMail.test.ts and, with a database, in
// TransactionReactionResolver.test.ts.
jest.mock('./util/transactionReactionMail', () => ({
  __esModule: true,
  notifyGiverOfReaction: jest.fn(async () => 'MAIL'),
}))

const LENA_ID = 17
const PAUL_ID = 23
const RECEIVED = 501
const THUMB = '👍'
// With the selector for its coloured drawing, as the list has it.
const HEART = '❤️'

const lenaUser = { id: LENA_ID, alias: 'lena', language: 'de', foreign: false } as unknown as DbUser
/** Lena's RECEIVE row of a transfer from Paul, a member here, as the one read answers it. */
const transferFromPaul = (id: number) => ({
  id,
  senderIsMemberHere: true,
  senderUserId: PAUL_ID,
  amount: GradidoUnit.fromNumber(5),
  memo: 'Für das Brot',
})

/** A request of Lena's, with a budget of its own. */
const lenasRequest = (): Context => ({
  token: null,
  setHeaders: [],
  requestBudget: newRequestBudget(),
  user: lenaUser,
})

const received = dbSelectReceivedTransferOfUser as jest.Mock
const reactionsBefore = dbSelectTransactionReactions as jest.Mock
const upsert = dbUpsertTransactionReaction as jest.Mock
const takeBack = dbDeleteTransactionReaction as jest.Mock
const markSeen = dbMarkReceivedTransferSeen as jest.Mock
const notify = notifyGiverOfReaction as jest.Mock

/**
 * Lena reacts to the transfer RECEIVED: with a thumb where a test names nothing, else with
 * exactly what it names -- `undefined` too, which a default parameter would swallow.
 */
const react = (...given: [emoji?: string | null, request?: Context, transactionId?: number]) =>
  new TransactionReactionResolver().setTransactionReaction(
    { transactionId: given[2] ?? RECEIVED, emoji: given.length === 0 ? THUMB : given[0] },
    given[1] ?? lenasRequest(),
  )

const nothingWritten = () => {
  expect(upsert).not.toHaveBeenCalled()
  expect(takeBack).not.toHaveBeenCalled()
  // And no mail about what was not written.
  expect(notify).not.toHaveBeenCalled()
}

beforeEach(() => {
  jest.clearAllMocks()
  // The booking is Lena's own RECEIVE row of a transfer from a member of this server.
  received.mockImplementation(async (transactionId: number) => ({
    success: true,
    value: transferFromPaul(transactionId),
  }))
  // Nobody reacted to it yet.
  reactionsBefore.mockResolvedValue([])
  upsert.mockResolvedValue(undefined)
  takeBack.mockResolvedValue(true)
  markSeen.mockResolvedValue(true)
})

describe('setTransactionReaction, what the resolver decides itself', () => {
  it("sets the recipient's reaction on the booking and answers the emoji", async () => {
    expect(await react()).toBe(THUMB)

    // ⛔ Asked as the CALLER's own booking: with their id from the session, not from the request.
    expect(received.mock.calls).toEqual([[RECEIVED, LENA_ID]])
    expect(upsert.mock.calls).toEqual([[RECEIVED, THUMB]])
    expect(takeBack).not.toHaveBeenCalled()
  })

  it('takes the reaction back for null in the place of an emoji, and answers none', async () => {
    expect(await react(null)).toBeNull()

    expect(takeBack.mock.calls).toEqual([[RECEIVED]])
    expect(upsert).not.toHaveBeenCalled()
  })

  it('takes the reaction back for nothing in the place of an emoji', async () => {
    expect(await react(undefined)).toBeNull()

    expect(takeBack.mock.calls).toEqual([[RECEIVED]])
    expect(upsert).not.toHaveBeenCalled()
  })

  // Taking back where there is none is an answer, not a failure.
  it('answers none where there was no reaction to take back', async () => {
    takeBack.mockResolvedValue(false)

    expect(await react(null)).toBeNull()
  })

  it('takes every one of the forty-eight, each as it stands in the list', async () => {
    for (const emoji of CHAT_REACTION_EMOJI_ROWS.flat()) {
      expect(await react(emoji)).toBe(emoji)
    }
    expect(upsert).toHaveBeenCalledTimes(48)
    expect(upsert.mock.calls.map(([, emoji]) => emoji)).toEqual(CHAT_REACTION_EMOJI_ROWS.flat())
  })

  // ⛔ The booking the write goes to is the one the database answered as the caller's own.
  it('writes to the booking the read answered, by its id', async () => {
    received.mockResolvedValue({ success: true, value: transferFromPaul(777) })

    await react(HEART)

    expect(upsert.mock.calls).toEqual([[777, HEART]])
    expect(reactionsBefore.mock.calls).toEqual([[[777]]])
  })
})

/**
 * Chat E-086: a transfer answered with a reaction is seen -- it no longer counts as unread at the
 * sender's name (Bernd: "oder in anderer Weise reagiert wurde").
 */
describe('setTransactionReaction, what it says about the transfer being seen', () => {
  it("marks the booking the read answered as seen, as the caller's", async () => {
    received.mockResolvedValue({ success: true, value: transferFromPaul(777) })

    await react(HEART)

    expect(markSeen.mock.calls).toEqual([[LENA_ID, 777]])
  })

  it('marks nothing where a reaction is taken back', async () => {
    await react(null)

    expect(markSeen).not.toHaveBeenCalled()
  })

  it('marks nothing where the reaction is refused', async () => {
    received.mockResolvedValue({ success: false, error: new Error('no such booking') })

    await expect(react()).rejects.toThrow('UNKNOWN_TRANSFER')

    expect(markSeen).not.toHaveBeenCalled()
  })

  // Its own write: the reaction stands, and the transfer stays unread until it is seen another way.
  it('answers the emoji where the mark fails, with the code in the log', async () => {
    const log = getLogger(
      `${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.TransactionReactionResolver`,
    )
    markSeen.mockRejectedValue(
      Object.assign(new Error('Failed query: insert …'), {
        cause: { code: 'ER_LOCK_WAIT_TIMEOUT' },
      }),
    )

    expect(await react(HEART)).toBe(HEART)

    expect((log.warn as jest.Mock).mock.calls).toEqual([
      [
        `transfer not marked seen after a reaction: transaction_id=${RECEIVED}`,
        'ER_LOCK_WAIT_TIMEOUT',
      ],
    ])
    expect(notify).toHaveBeenCalledTimes(1)
  })
})

/**
 * W1: the mail about a first reaction is decided on what stood at the booking BEFORE the write,
 * and goes out after it. The resolver reads that and hands it over; the rule and the mail are
 * the delivery's (notifyGiverOfReaction).
 */
describe('setTransactionReaction, what it tells the mail about a first reaction', () => {
  it('reads whether a reaction stood at the booking before it writes, and says it did not', async () => {
    await react(HEART)

    expect(reactionsBefore.mock.calls).toEqual([[[RECEIVED]]])
    expect(reactionsBefore.mock.invocationCallOrder[0]).toBeLessThan(
      upsert.mock.invocationCallOrder[0],
    )
    expect(notify.mock.calls).toEqual([
      [
        {
          recipientUser: lenaUser,
          received: transferFromPaul(RECEIVED),
          emoji: HEART,
          hadReaction: false,
        },
      ],
    ])
  })

  it('says a reaction stood there before, where one did -- another emoji in its place', async () => {
    reactionsBefore.mockResolvedValue([
      { transactionId: RECEIVED, emoji: THUMB, linkedTransactionId: 500 },
    ])

    expect(await react(HEART)).toBe(HEART)

    expect(upsert.mock.calls).toEqual([[RECEIVED, HEART]])
    expect(notify.mock.calls).toEqual([
      [
        {
          recipientUser: lenaUser,
          received: transferFromPaul(RECEIVED),
          emoji: HEART,
          hadReaction: true,
        },
      ],
    ])
  })

  // ⛔ After the write, never before: the reaction is stored whatever becomes of the mail.
  it('tells the mail only once the reaction is stored', async () => {
    await react(HEART)

    expect(notify).toHaveBeenCalledTimes(1)
    expect(upsert.mock.invocationCallOrder[0]).toBeLessThan(notify.mock.invocationCallOrder[0])
  })

  // What the delete answered says whether there was one; nothing else is read for it.
  it('tells the mail of a reaction taken back, with what the delete answered, and reads nothing', async () => {
    takeBack.mockResolvedValue(true)
    expect(await react(null)).toBeNull()
    takeBack.mockResolvedValue(false)
    expect(await react(null)).toBeNull()

    expect(reactionsBefore).not.toHaveBeenCalled()
    expect(notify.mock.calls.map(([told]) => [told.emoji, told.hadReaction])).toEqual([
      [null, true],
      [null, false],
    ])
    expect(takeBack.mock.invocationCallOrder[0]).toBeLessThan(notify.mock.invocationCallOrder[0])
  })

  it('answers the emoji whatever the mail made of it', async () => {
    notify.mockResolvedValue('MUTED')
    expect(await react(HEART)).toBe(HEART)
    notify.mockResolvedValue('NOT_SENT')
    expect(await react(HEART)).toBe(HEART)
  })
})

describe('setTransactionReaction, what it refuses before anything is written', () => {
  it.each([
    ['an emoji the wallets do not offer', '🦄'],
    ['a word', 'danke'],
    ['two of the forty-eight', `${THUMB}${HEART}`],
    ['one of them with a word behind it', `${THUMB} danke`],
    ['the heart without its selector', '❤'],
    ['a thumb with a skin tone', '👍🏽'],
    ['a space', ' '],
    ['nothing at all, as a text', ''],
  ])('%s: UNKNOWN_EMOJI', async (_name, emoji) => {
    await expect(react(emoji)).rejects.toThrow('TRANSACTION_REACTION_NOT_SET: UNKNOWN_EMOJI')

    // Refused before the booking is even looked up.
    expect(received).not.toHaveBeenCalled()
    nothingWritten()
  })

  // ⛔ Only the recipient reacts (Bernd, 11.10.2026). The sender's SEND row, somebody else's
  // booking, a creation, an id without a booking: the one read answers them all alike.
  it('a booking that is no transfer the caller received: UNKNOWN_TRANSFER', async () => {
    received.mockResolvedValue({ success: false, error: new Error('not found') })

    await expect(react()).rejects.toThrow('TRANSACTION_REACTION_NOT_SET: UNKNOWN_TRANSFER')
    nothingWritten()
  })

  it('no reaction is taken back from such a booking either: UNKNOWN_TRANSFER', async () => {
    received.mockResolvedValue({ success: false, error: new Error('not found') })

    await expect(react(null)).rejects.toThrow('TRANSACTION_REACTION_NOT_SET: UNKNOWN_TRANSFER')
    nothingWritten()
  })

  // Their server holds its own row of the transfer, and a reaction has no way there yet.
  it('a transfer from a member of another community: OTHER_COMMUNITY', async () => {
    received.mockResolvedValue({
      success: true,
      value: { id: RECEIVED, senderIsMemberHere: false },
    })

    await expect(react()).rejects.toThrow('TRANSACTION_REACTION_NOT_SET: OTHER_COMMUNITY')
    await expect(react(null)).rejects.toThrow('TRANSACTION_REACTION_NOT_SET: OTHER_COMMUNITY')
    nothingWritten()
  })

  // A document may repeat the field under any number of aliases.
  it('more reactions in one request than TRANSACTION_REACTIONS_MAX_PER_REQUEST', async () => {
    const request = lenasRequest()
    for (let n = 0; n < TRANSACTION_REACTIONS_MAX_PER_REQUEST; n++) {
      await react(THUMB, request)
    }
    expect(upsert).toHaveBeenCalledTimes(TRANSACTION_REACTIONS_MAX_PER_REQUEST)

    await expect(react(THUMB, request)).rejects.toThrow(
      'Too many transaction reactions set at once',
    )
    // Counted before anything is looked up: the one too many reads nothing.
    expect(received).toHaveBeenCalledTimes(TRANSACTION_REACTIONS_MAX_PER_REQUEST)
    expect(upsert).toHaveBeenCalledTimes(TRANSACTION_REACTIONS_MAX_PER_REQUEST)

    // Another request has a budget of its own.
    expect(await react(THUMB, lenasRequest())).toBe(THUMB)
  })

  it('counts a refused reaction against the budget as well', async () => {
    const request = lenasRequest()
    for (let n = 0; n < TRANSACTION_REACTIONS_MAX_PER_REQUEST; n++) {
      await expect(react('🦄', request)).rejects.toThrow('UNKNOWN_EMOJI')
    }

    await expect(react(THUMB, request)).rejects.toThrow(
      'Too many transaction reactions set at once',
    )
    nothingWritten()
  })

  it('nobody without a member in the session', async () => {
    await expect(
      react(THUMB, { token: null, setHeaders: [], requestBudget: newRequestBudget() }),
    ).rejects.toThrow('No user given in context')
    nothingWritten()
  })
})

describe('setTransactionReaction, where the database fails', () => {
  const failure = () =>
    Object.assign(new Error(`Failed query: insert … params: ${RECEIVED},${THUMB}`), {
      cause: { code: 'ER_LOCK_WAIT_TIMEOUT' },
    })

  it.each([
    ['the read', () => received.mockRejectedValue(failure()), THUMB],
    ['the read of what stood there', () => reactionsBefore.mockRejectedValue(failure()), THUMB],
    ['the write', () => upsert.mockRejectedValue(failure()), THUMB],
    ['the taking back', () => takeBack.mockRejectedValue(failure()), null],
  ])(
    'answers NOT_STORED where %s fails, with the code in the log and nothing more',
    async (_name, fail, emoji) => {
      const errors = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)
      fail()

      await expect(react(emoji)).rejects.toThrow('TRANSACTION_REACTION_NOT_SET: NOT_STORED')

      expect((errors.error as jest.Mock).mock.calls).toEqual([
        ['TRANSACTION_REACTION_NOT_SET: NOT_STORED', RECEIVED, 'ER_LOCK_WAIT_TIMEOUT'],
      ])
      // Nothing was stored, so there is nothing to mail about.
      expect(notify).not.toHaveBeenCalled()
    },
  )
})

describe('setTransactionReaction, what it writes to the log', () => {
  // ⛔ The booking's id, never the emoji: with the booking it would say what somebody thought
  // of a transfer.
  it('names the booking, and whether a reaction was set or taken back -- never the emoji', async () => {
    const log = getLogger(
      `${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.TransactionReactionResolver`,
    )

    await react(HEART)
    await react(null)

    const lines = (log.info as jest.Mock).mock.calls.map((args) => args.join(' '))
    expect(lines).toEqual([
      `transaction reaction set: transaction_id=${RECEIVED}`,
      `transaction reaction taken back: transaction_id=${RECEIVED}`,
    ])
    expect(lines.join('\n')).not.toContain('❤')
  })

  it('names no emoji where it refuses one', async () => {
    const errors = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

    await expect(react('🦄')).rejects.toThrow('UNKNOWN_EMOJI')

    expect((errors.error as jest.Mock).mock.calls).toEqual([
      ['TRANSACTION_REACTION_NOT_SET: UNKNOWN_EMOJI', RECEIVED],
    ])
  })
})
