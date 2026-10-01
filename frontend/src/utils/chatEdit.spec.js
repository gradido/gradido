// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'vitest'
import { chatEditProblem, withChatMessagesEdited } from './chatEdit'

/** A message as a thread holds it; `editedAt` null for one never changed. */
const message = (id, body, editedAt = null) => ({ id, messageUuid: `uuid-${id}`, body, editedAt })

const T1 = '2026-10-01T09:00:00.000Z'
const T2 = '2026-10-01T09:00:05.250Z'

describe('withChatMessagesEdited (E-060)', () => {
  it('puts a changed message in the place of the one held, by its id', () => {
    const held = [message(1, 'eins'), message(2, 'zwei'), message(3, 'drei')]
    const now = message(2, 'zwei, geändert', T1)

    const { messages, changed } = withChatMessagesEdited(held, [now])

    expect(messages).toEqual([held[0], now, held[2]])
    expect(messages[1]).toBe(now)
    expect(changed).toEqual([now])
    // The list held is not written into: the page it came from is the cache's.
    expect(held[1].body).toBe('zwei')
  })

  it('takes several at once, each in its place, in the order of the page', () => {
    const held = [message(1, 'eins'), message(2, 'zwei'), message(3, 'drei')]
    const three = message(3, 'DREI', T1)
    const one = message(1, 'EINS', T2)

    const { messages, changed } = withChatMessagesEdited(held, [three, one])

    expect(messages.map((m) => m.body)).toEqual(['EINS', 'zwei', 'DREI'])
    expect(changed).toEqual([one, three])
  })

  // The beat brings the changes of all conversations, and of pages not loaded.
  it('passes over a message the page does not hold', () => {
    const held = [message(1, 'eins')]

    const { messages, changed } = withChatMessagesEdited(held, [message(9, 'neun', T1)])

    expect(messages).toBe(held)
    expect(changed).toEqual([])
  })

  /**
   * The same change comes again with the next beats for some seconds: no news, and the list is
   * the one held -- so nothing is written into the page, and nothing said twice.
   */
  it('takes the same state for no change, and hands back the list held', () => {
    const held = [message(1, 'eins'), message(2, 'zwei, geändert', T1)]

    const { messages, changed } = withChatMessagesEdited(held, [message(2, 'zwei, geändert', T1)])

    expect(messages).toBe(held)
    expect(changed).toEqual([])
  })

  it('takes nothing from an empty list', () => {
    const held = [message(1, 'eins')]
    expect(withChatMessagesEdited(held, [])).toEqual({ messages: held, changed: [] })
    expect(withChatMessagesEdited([], [message(1, 'eins', T1)])).toEqual({
      messages: [],
      changed: [],
    })
  })

  // Changed back to the words it had: another state all the same -- it says "bearbeitet" now.
  it('takes the same words changed at another moment', () => {
    const held = [message(2, 'zwei', T1)]
    const now = message(2, 'zwei', T2)

    expect(withChatMessagesEdited(held, [now]).changed).toEqual([now])
  })

  /**
   * ⛔ Two answers of the server can pass each other: the beat read the message before one's own
   * change and comes in after that change's answer. The text never goes back to one it had.
   */
  describe('never goes back', () => {
    it('passes over a state changed before the one held', () => {
      const held = [message(2, 'zweite Fassung', T2)]

      const { messages, changed } = withChatMessagesEdited(held, [message(2, 'erste Fassung', T1)])

      expect(messages).toBe(held)
      expect(changed).toEqual([])
    })

    it('passes over a state never changed where the one held was', () => {
      const held = [message(2, 'geändert', T1)]

      expect(withChatMessagesEdited(held, [message(2, 'wie am Anfang', null)]).changed).toEqual([])
    })

    it('takes a state changed after the one held', () => {
      const held = [message(2, 'erste Fassung', T1)]
      const now = message(2, 'zweite Fassung', T2)

      expect(withChatMessagesEdited(held, [now]).messages).toEqual([now])
    })

    // The moments are compared as moments, not as text: written with another offset, the later
    // one can read as the earlier and the earlier as the later.
    it('compares the moments, however they are written', () => {
      const held = [message(2, 'erste Fassung', '2026-10-01T09:00:00.000Z')]
      // A millisecond later, and "08:00" to the eye.
      const later = message(2, 'zweite Fassung', '2026-10-01T08:00:00.001-01:00')
      // A second earlier, and "10:59" to the eye.
      const earlier = message(2, 'Fassung davor', '2026-10-01T10:59:59.000+02:00')

      expect(withChatMessagesEdited(held, [later]).messages).toEqual([later])
      expect(withChatMessagesEdited(held, [earlier]).messages).toBe(held)
    })

    // Two states of the same moment cannot be told apart by it: the one that came is taken.
    it('takes another text of the same moment', () => {
      const held = [message(2, 'eine Fassung', T1)]
      const now = message(2, 'andere Fassung', T1)

      expect(withChatMessagesEdited(held, [now]).messages).toEqual([now])
    })

    // One answer bringing the same message twice: the later state counts, in whichever order.
    it('takes the latest of two states that come together', () => {
      const held = [message(2, 'wie am Anfang')]
      const first = message(2, 'erste Fassung', T1)
      const second = message(2, 'zweite Fassung', T2)

      expect(withChatMessagesEdited(held, [first, second]).messages).toEqual([second])
      expect(withChatMessagesEdited(held, [second, first]).messages).toEqual([second])
      expect(withChatMessagesEdited(held, [second, first]).changed).toEqual([second])
    })
  })
})

describe('chatEditProblem (E-060)', () => {
  // B5: across the border a change counts only once the other server has taken it.
  it.each([
    'CHAT_MESSAGE_NOT_EDITED: NOT_CONFIRMED',
    'CHAT_MESSAGE_NOT_EDITED: NO_WAY_TO_DELIVER',
    // As the wallet gets it: Apollo's words before the server's.
    'GraphQL error: CHAT_MESSAGE_NOT_EDITED: NOT_CONFIRMED',
  ])('reads "the other community did not take it" from %s', (message) => {
    expect(chatEditProblem(new Error(message))).toBe('NOT_CONFIRMED')
  })

  it('reads "still on its way" from PENDING', () => {
    expect(chatEditProblem(new Error('CHAT_MESSAGE_NOT_EDITED: PENDING'))).toBe('PENDING')
  })

  it.each([
    'CHAT_MESSAGE_NOT_EDITED: UNKNOWN_MESSAGE',
    'CHAT_MESSAGE_NOT_EDITED: NOT_OWN',
    'CHAT_MESSAGE_NOT_EDITED: FORWARDED',
    'CHAT_MESSAGE_NOT_EDITED: EMPTY',
    'CHAT_MESSAGE_NOT_EDITED: OTHER_COMMUNITY',
    'CHAT_MESSAGE_NOT_EDITED: NOT_STORED',
    'Network error',
    '',
  ])('takes %s for "not changed", without a reason of its own', (message) => {
    expect(chatEditProblem(new Error(message))).toBe('OTHER')
  })

  // ⛔ Only a refusal of a CHANGE is read: the words of another error that happens to hold the
  // same word are no reason.
  it('reads no reason out of another error', () => {
    expect(chatEditProblem(new Error('CHAT_MESSAGE_NOT_SENT: NOT_CONFIRMED'))).toBe('OTHER')
    expect(chatEditProblem(new Error('PENDING'))).toBe('OTHER')
  })

  it('takes what is no error for "not changed"', () => {
    expect(chatEditProblem(null)).toBe('OTHER')
    expect(chatEditProblem(undefined)).toBe('OTHER')
    expect(chatEditProblem({})).toBe('OTHER')
  })
})
