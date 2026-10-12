// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, vi } from 'vitest'
import { effect, nextTick } from 'vue'
import {
  isTransactionReactionUnderway,
  onTransactionReaction,
  reactToTransaction,
  transactionReactionToSend,
  transferReactions,
} from './useTransactionReactions'
import { setTransactionReaction } from '@/graphql/transactions.graphql'

/**
 * Reactions to transfers (Bernd, 11.10.2026): what the booking list's row and the conversation's
 * bubble share -- what a press sends, one reaction at a time for a booking, and the word to
 * every place that holds the booking.
 */

const THUMB = '👍'
const HEART = '❤️'

/** A transfer the member received, as the booking list delivers it. */
const RECEIVED = { id: 41, typeId: 'RECEIVE', canReact: true, reaction: null }
/** One they sent: the reaction on it is the other person's. */
const SENT = { id: 42, typeId: 'SEND', canReact: false, reaction: null }

/** A client whose `mutate` answers what a test says -- or waits until the test answers. */
const clientAnswering = (answer) => ({
  mutate: vi.fn(async () =>
    typeof answer === 'function' ? answer() : { data: { setTransactionReaction: answer } },
  ),
})

const stops = []
const listen = () => {
  const heard = []
  stops.push(onTransactionReaction((said) => heard.push(said)))
  return heard
}

afterEach(() => {
  while (stops.length) stops.pop()()
})

describe('transactionReactionToSend', () => {
  it('sends the emoji for a booking without a reaction', () => {
    expect(transactionReactionToSend(RECEIVED, THUMB)).toBe(THUMB)
  })

  it('sends another emoji as it is: the server puts it in the place of the one before', () => {
    expect(transactionReactionToSend({ ...RECEIVED, reaction: THUMB }, HEART)).toBe(HEART)
  })

  // The same one again takes it back.
  it('sends none where the emoji is the booking’s reaction already', () => {
    expect(transactionReactionToSend({ ...RECEIVED, reaction: THUMB }, THUMB)).toBeNull()
  })

  it('takes a booking from before the field for one without a reaction', () => {
    expect(transactionReactionToSend({ id: 41 }, THUMB)).toBe(THUMB)
    expect(transactionReactionToSend(undefined, THUMB)).toBe(THUMB)
  })
})

describe('transferReactions', () => {
  it('is empty for a booking without a reaction', () => {
    expect(transferReactions(RECEIVED)).toEqual([])
    expect(transferReactions({ id: 41, typeId: 'RECEIVE' })).toEqual([])
    expect(transferReactions(undefined)).toEqual([])
  })

  // Only the recipient reacts: on the row of what one received, the reaction is one's own.
  it('is one’s own on the booking of what one received', () => {
    expect(transferReactions({ ...RECEIVED, reaction: THUMB })).toEqual([
      { emoji: THUMB, count: 1, mine: true },
    ])
  })

  it('is the other person’s on the booking of what one sent', () => {
    expect(transferReactions({ ...SENT, reaction: HEART })).toEqual([
      { emoji: HEART, count: 1, mine: false },
    ])
  })
})

describe('reactToTransaction', () => {
  it('sends the reaction by the id of the booking, past the cache, and answers what stands then', async () => {
    const client = clientAnswering(THUMB)

    expect(await reactToTransaction(client, RECEIVED, THUMB)).toEqual({ reaction: THUMB })

    expect(client.mutate.mock.calls).toEqual([
      [
        {
          mutation: setTransactionReaction,
          variables: { transactionId: 41, emoji: THUMB },
          fetchPolicy: 'no-cache',
        },
      ],
    ])
  })

  it('sends none for the emoji that is the booking’s reaction already, and answers none', async () => {
    const client = clientAnswering(null)

    expect(await reactToTransaction(client, { ...RECEIVED, reaction: THUMB }, THUMB)).toEqual({
      reaction: null,
    })

    expect(client.mutate.mock.calls[0][0].variables).toEqual({ transactionId: 41, emoji: null })
  })

  // The server's word counts, not what was sent.
  it('answers the emoji the server names', async () => {
    const client = clientAnswering(HEART)

    expect(await reactToTransaction(client, RECEIVED, THUMB)).toEqual({ reaction: HEART })
  })

  // ⛔ Only the recipient reacts, and the server says with the booking whether the member may.
  it.each([
    ['a booking the member sent', SENT],
    ['a booking that says nothing of it (an older server)', { id: 43, typeId: 'RECEIVE' }],
    ['no booking at all', undefined],
  ])('sends nothing for %s', async (_name, booking) => {
    const client = clientAnswering(THUMB)
    const heard = listen()

    expect(await reactToTransaction(client, booking, THUMB)).toBeNull()

    expect(client.mutate).not.toHaveBeenCalled()
    expect(heard).toEqual([])
  })

  it('says what was set to everybody who listens, with the id of the booking', async () => {
    const first = listen()
    const second = listen()

    await reactToTransaction(clientAnswering(THUMB), RECEIVED, THUMB)

    expect(first).toEqual([{ transactionId: 41, reaction: THUMB }])
    expect(second).toEqual(first)
  })

  it('says a reaction taken back as none', async () => {
    const heard = listen()

    await reactToTransaction(clientAnswering(null), { ...RECEIVED, reaction: THUMB }, THUMB)

    expect(heard).toEqual([{ transactionId: 41, reaction: null }])
  })

  it('says nothing more to whoever stopped listening', async () => {
    const heard = []
    const stop = onTransactionReaction((said) => heard.push(said))
    stop()

    await reactToTransaction(clientAnswering(THUMB), RECEIVED, THUMB)

    expect(heard).toEqual([])
  })

  describe('while a reaction is on its way', () => {
    /** A client whose answers a test gives one by one. */
    const waiting = () => {
      const answers = []
      const client = {
        mutate: vi.fn(() => new Promise((resolve, reject) => answers.push({ resolve, reject }))),
      }
      return { client, answers }
    }

    // ⛔ A second press would be read off a state that is about to change.
    it('sends no second one for the same booking, and answers none for it', async () => {
      const { client, answers } = waiting()

      const first = reactToTransaction(client, RECEIVED, THUMB)
      expect(await reactToTransaction(client, RECEIVED, THUMB)).toBeNull()
      expect(await reactToTransaction(client, RECEIVED, HEART)).toBeNull()
      expect(client.mutate).toHaveBeenCalledTimes(1)

      answers[0].resolve({ data: { setTransactionReaction: THUMB } })
      expect(await first).toEqual({ reaction: THUMB })
    })

    it('says so for that booking, and for no other', async () => {
      const { client, answers } = waiting()
      expect(isTransactionReactionUnderway(41)).toBe(false)

      const first = reactToTransaction(client, RECEIVED, THUMB)

      expect(isTransactionReactionUnderway(41)).toBe(true)
      expect(isTransactionReactionUnderway(42)).toBe(false)

      answers[0].resolve({ data: { setTransactionReaction: THUMB } })
      await first
      expect(isTransactionReactionUnderway(41)).toBe(false)
    })

    // What draws by it is drawn again: the emoji stand back, and come back.
    it('is seen by whatever draws by it', async () => {
      const { client, answers } = waiting()
      const seen = []
      const drawing = effect(() => seen.push(isTransactionReactionUnderway(41)))

      const first = reactToTransaction(client, RECEIVED, THUMB)
      await nextTick()
      answers[0].resolve({ data: { setTransactionReaction: THUMB } })
      await first
      await nextTick()

      expect(seen).toEqual([false, true, false])
      drawing.effect.stop()
    })

    it('takes another booking meanwhile', async () => {
      const { client, answers } = waiting()

      const first = reactToTransaction(client, RECEIVED, THUMB)
      const other = reactToTransaction(client, { ...RECEIVED, id: 77 }, HEART)
      expect(client.mutate).toHaveBeenCalledTimes(2)

      answers[1].resolve({ data: { setTransactionReaction: HEART } })
      answers[0].resolve({ data: { setTransactionReaction: THUMB } })
      expect(await other).toEqual({ reaction: HEART })
      expect(await first).toEqual({ reaction: THUMB })
    })

    it('takes the next press once the answer is in', async () => {
      const { client, answers } = waiting()

      const first = reactToTransaction(client, RECEIVED, THUMB)
      answers[0].resolve({ data: { setTransactionReaction: THUMB } })
      await first

      const second = reactToTransaction(client, { ...RECEIVED, reaction: THUMB }, THUMB)
      answers[1].resolve({ data: { setTransactionReaction: null } })
      expect(await second).toEqual({ reaction: null })
      expect(client.mutate.mock.calls[1][0].variables).toEqual({ transactionId: 41, emoji: null })
    })
  })

  describe('where the server refuses or does not answer', () => {
    it('throws, says nothing to the listeners, and takes the next press', async () => {
      const heard = listen()
      const refusing = {
        mutate: vi.fn(async () => {
          throw new Error('TRANSACTION_REACTION_NOT_SET: UNKNOWN_TRANSFER')
        }),
      }

      await expect(reactToTransaction(refusing, RECEIVED, THUMB)).rejects.toThrow(
        'UNKNOWN_TRANSFER',
      )

      expect(heard).toEqual([])
      expect(isTransactionReactionUnderway(41)).toBe(false)
      expect(await reactToTransaction(clientAnswering(THUMB), RECEIVED, THUMB)).toEqual({
        reaction: THUMB,
      })
    })

    // Null is an answer -- the reaction was taken back. No field at all is none.
    it.each([
      ['no data', () => ({})],
      ['data without the field', () => ({ data: {} })],
      ['nothing', () => undefined],
    ])('takes %s for no answer', async (_name, answer) => {
      const heard = listen()

      await expect(reactToTransaction(clientAnswering(answer), RECEIVED, THUMB)).rejects.toThrow(
        'setTransactionReaction: no answer',
      )

      expect(heard).toEqual([])
      expect(isTransactionReactionUnderway(41)).toBe(false)
    })
  })
})
