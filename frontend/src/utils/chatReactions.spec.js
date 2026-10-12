// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'vitest'
import {
  CHAT_QUICK_REACTIONS,
  chatReactionToSend,
  isEarlierReactionState,
  keepingLaterReactions,
  offersChatReactions,
  ownChatReaction,
  withChatMessagesReacted,
} from './chatReactions'
import { EMOJI_ROWS } from './emojiChoice'

const THUMB = '👍'
const HEART = '❤️'
const EARLY = '2026-10-11T06:30:00.000Z'
const LATER = '2026-10-11T06:30:05.000Z'

const message = (id, extra = {}) => ({
  id,
  messageUuid: `uuid-${id}`,
  body: `message ${id}`,
  editedAt: null,
  reactedAt: null,
  reactions: [],
  ...extra,
})
const mine = (emoji) => ({ emoji, count: 1, mine: true })
const theirs = (emoji, count = 1) => ({ emoji, count, mine: false })

describe('the six a press away', () => {
  it('are Bernd’s six, in his order', () => {
    expect([...CHAT_QUICK_REACTIONS]).toEqual(['👍', '❤️', '🙏', '😊', '🎉', '🌱'])
  })

  // ⛔ The server takes the forty-eight and no other: one of the six that is not among them, sign
  // for sign, would be refused -- the heart without its selector is another string.
  it('are each one of the forty-eight, code point for code point', () => {
    const all = EMOJI_ROWS.flat()
    for (const emoji of CHAT_QUICK_REACTIONS) {
      expect(all, emoji).toContain(emoji)
    }
    expect([...'❤️']).toHaveLength(2)
    expect(CHAT_QUICK_REACTIONS).toContain('❤️')
    expect(CHAT_QUICK_REACTIONS).not.toContain('❤')
  })

  it('cannot be changed by whoever reads them', () => {
    expect(Object.isFrozen(CHAT_QUICK_REACTIONS)).toBe(true)
  })
})

describe('isEarlierReactionState', () => {
  it('says so of a state changed before the held one, and of one never changed where the held one was', () => {
    expect(isEarlierReactionState({ reactedAt: EARLY }, { reactedAt: LATER })).toBe(true)
    expect(isEarlierReactionState({ reactedAt: null }, { reactedAt: LATER })).toBe(true)
    expect(isEarlierReactionState({}, { reactedAt: LATER })).toBe(true)
  })

  it('says no of a later state, of the same moment, and where the held one was never reacted to', () => {
    expect(isEarlierReactionState({ reactedAt: LATER }, { reactedAt: EARLY })).toBe(false)
    expect(isEarlierReactionState({ reactedAt: EARLY }, { reactedAt: EARLY })).toBe(false)
    expect(isEarlierReactionState({ reactedAt: EARLY }, { reactedAt: null })).toBe(false)
    expect(isEarlierReactionState({ reactedAt: null }, { reactedAt: null })).toBe(false)
  })
})

describe('withChatMessagesReacted', () => {
  it('gives a held message the reactions and the moment of its state, by its id', () => {
    const held = [message(1), message(2)]
    const { messages, changed } = withChatMessagesReacted(held, [
      message(2, { reactions: [theirs(THUMB)], reactedAt: EARLY }),
    ])

    expect(messages[0]).toBe(held[0])
    expect(messages[1]).toEqual(message(2, { reactions: [theirs(THUMB)], reactedAt: EARLY }))
    expect(changed).toEqual([messages[1]])
  })

  // ⛔ Only the reactions: an answer about them may be older than a change of the words.
  it('takes nothing else of the state -- the words stay as the page holds them', () => {
    const held = [message(1, { body: 'the words as changed', editedAt: LATER })]
    const { messages } = withChatMessagesReacted(held, [
      message(1, {
        body: 'the words before',
        editedAt: null,
        reactions: [mine(HEART)],
        reactedAt: EARLY,
      }),
    ])

    expect(messages[0]).toEqual(
      message(1, {
        body: 'the words as changed',
        editedAt: LATER,
        reactions: [mine(HEART)],
        reactedAt: EARLY,
      }),
    )
  })

  it('hands back the page itself where nothing changed', () => {
    const held = [message(1, { reactions: [theirs(THUMB)], reactedAt: EARLY })]
    const same = withChatMessagesReacted(held, [
      message(1, { reactions: [theirs(THUMB)], reactedAt: EARLY }),
    ])
    expect(same.messages).toBe(held)
    expect(same.changed).toEqual([])

    // Nothing of this page among them, or nothing at all.
    expect(withChatMessagesReacted(held, [message(9, { reactions: [mine(THUMB)] })]).messages).toBe(
      held,
    )
    expect(withChatMessagesReacted(held, []).messages).toBe(held)
  })

  it.each([
    ['another emoji', [theirs(HEART)]],
    ['another count', [theirs(THUMB, 2)]],
    ['another owner', [mine(THUMB)]],
    ['one more', [theirs(THUMB), theirs(HEART)]],
    ['none', []],
  ])('takes %s at the same moment as a change', (_name, reactions) => {
    const held = [message(1, { reactions: [theirs(THUMB)], reactedAt: EARLY })]
    const { messages, changed } = withChatMessagesReacted(held, [
      message(1, { reactions, reactedAt: EARLY }),
    ])
    expect(messages[0].reactions).toEqual(reactions)
    expect(changed).toHaveLength(1)
  })

  // ⛔ The beat read the message before one's own reaction and comes in after its answer.
  it('passes over a state earlier than the one the page holds', () => {
    const held = [message(1, { reactions: [mine(THUMB)], reactedAt: LATER })]
    for (const earlier of [EARLY, null]) {
      const taken = withChatMessagesReacted(held, [
        message(1, { reactions: [], reactedAt: earlier }),
      ])
      expect(taken.messages).toBe(held)
    }
  })

  it('takes the later one of two states of the same message, whatever their order', () => {
    const early = message(1, { reactions: [theirs(THUMB)], reactedAt: EARLY })
    const late = message(1, { reactions: [theirs(THUMB), mine(HEART)], reactedAt: LATER })
    for (const reacted of [
      [early, late],
      [late, early],
    ]) {
      const { messages } = withChatMessagesReacted([message(1)], reacted)
      expect(messages[0].reactions).toEqual([theirs(THUMB), mine(HEART)])
      expect(messages[0].reactedAt).toBe(LATER)
    }
  })

  it('takes a state without a list as none, and leaves the handed-in messages as they were', () => {
    const held = [message(1, { reactions: [theirs(THUMB)], reactedAt: EARLY })]
    const state = { id: 1, reactedAt: LATER }
    const { messages } = withChatMessagesReacted(held, [state])

    expect(messages[0].reactions).toEqual([])
    expect(held[0].reactions).toEqual([theirs(THUMB)])
    expect(state).toEqual({ id: 1, reactedAt: LATER })
  })
})

describe('keepingLaterReactions', () => {
  const changedText = (extra) => message(1, { body: 'changed', editedAt: LATER, ...extra })

  it('hands back the changed message itself where its reactions are the later state, or the same', () => {
    const now = changedText({ reactions: [mine(HEART)], reactedAt: LATER })
    expect(keepingLaterReactions(now, message(1, { reactedAt: EARLY }))).toBe(now)
    expect(keepingLaterReactions(now, message(1, { reactedAt: LATER }))).toBe(now)
    expect(keepingLaterReactions(now, message(1))).toBe(now)
  })

  it('keeps the held reactions where the changed message brings an earlier state of them', () => {
    const held = message(1, { reactions: [theirs(THUMB)], reactedAt: LATER })
    for (const now of [
      changedText({ reactions: [], reactedAt: EARLY }),
      changedText({ reactions: [], reactedAt: null }),
    ]) {
      expect(keepingLaterReactions(now, held)).toEqual(
        changedText({ reactions: [theirs(THUMB)], reactedAt: LATER }),
      )
    }
  })
})

describe('ownChatReaction and chatReactionToSend', () => {
  it('finds the member’s own reaction among a message’s, or none', () => {
    expect(ownChatReaction(message(1, { reactions: [theirs(THUMB), mine(HEART)] }))).toBe(HEART)
    expect(ownChatReaction(message(1, { reactions: [theirs(THUMB)] }))).toBeNull()
    expect(ownChatReaction(message(1))).toBeNull()
    expect(ownChatReaction({})).toBeNull()
    expect(ownChatReaction(null)).toBeNull()
  })

  it('sends the emoji that was pressed -- also where the member has reacted with another', () => {
    expect(chatReactionToSend(message(1), THUMB)).toBe(THUMB)
    expect(chatReactionToSend(message(1, { reactions: [mine(HEART)] }), THUMB)).toBe(THUMB)
    // Somebody else's thumb is not the member's own: a press on it sets theirs.
    expect(chatReactionToSend(message(1, { reactions: [theirs(THUMB)] }), THUMB)).toBe(THUMB)
  })

  it('sends none where the emoji is the member’s own already: the same again takes it back', () => {
    expect(chatReactionToSend(message(1, { reactions: [mine(THUMB)] }), THUMB)).toBeNull()
    expect(
      chatReactionToSend(message(1, { reactions: [theirs(THUMB, 3), mine(HEART)] }), HEART),
    ).toBeNull()
  })
})

describe('offersChatReactions', () => {
  const HOME = '1a1a1a1a-1111-4111-8111-11111111aaaa'

  it('says yes for a person of this community, whatever the case it is written in', () => {
    expect(offersChatReactions({ communityUuid: HOME }, HOME)).toBe(true)
    expect(offersChatReactions({ communityUuid: HOME.toUpperCase() }, HOME)).toBe(true)
  })

  it('says yes where the person names no community: that is this one', () => {
    expect(offersChatReactions({ communityUuid: null }, HOME)).toBe(true)
    expect(offersChatReactions({}, HOME)).toBe(true)
  })

  // ⛔ Their server holds a copy, and a reaction has no way there yet.
  it('says no for a person of another community', () => {
    expect(
      offersChatReactions({ communityUuid: '22222222-2222-4222-8222-222222222222' }, HOME),
    ).toBe(false)
  })

  it('says yes where the member’s own community is not known: nothing says the person is of another', () => {
    expect(offersChatReactions({ communityUuid: HOME }, null)).toBe(true)
    expect(offersChatReactions({ communityUuid: HOME }, undefined)).toBe(true)
  })
})
