// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CHAT_RETURN_MAX_AGE_MS,
  dropChatReturnNote,
  forgetChatReturn,
  holdChatText,
  noteChatReturn,
  takeChatReturn,
  takeHeldChatText,
} from './chatReturn'
import { MESSAGE_MAX_CHARS } from '@/validationSchemas'

const NOW = new Date('2026-09-27T16:30:00Z').getTime()
const ANNA = { gradidoID: 'anna-id', communityUuid: 'other-uuid' }
const stored = (me = 'me-id') => window.localStorage.getItem(`chat-return:${me}`)
const store = (value, me = 'me-id') => window.localStorage.setItem(`chat-return:${me}`, value)

describe('chatReturn', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    window.localStorage.clear()
    takeHeldChatText({ gradidoID: '' })
  })

  describe('noteChatReturn', () => {
    it('notes whom the thread is with, and when, under the key of the member signed in', () => {
      noteChatReturn('me-id', ANNA)
      expect(JSON.parse(stored())).toEqual({ ...ANNA, at: NOW })
    })

    it('writes a missing community as null: this community', () => {
      noteChatReturn('me-id', { gradidoID: 'anna-id' })
      expect(JSON.parse(stored()).communityUuid).toBeNull()
    })

    // Whatever else the caller holds stays out of the note.
    it('writes the pair and the time, and nothing else, where the field is empty', () => {
      noteChatReturn('me-id', { ...ANNA, text: 'not from the field', alias: 'Anna' })
      expect(Object.keys(JSON.parse(stored())).sort()).toEqual(['at', 'communityUuid', 'gradidoID'])
    })

    // ⭐ Bernd, 27.09.2026: a text written before the file is attached must not be lost.
    it('writes the words in the field not sent yet, as they stand', () => {
      noteChatReturn('me-id', ANNA, 'Hier ist die Datei:\n')
      expect(JSON.parse(stored())).toEqual({ ...ANNA, at: NOW, text: 'Hier ist die Datei:\n' })
    })

    it('writes no words for a field of spaces', () => {
      noteChatReturn('me-id', ANNA, '  \n ')
      expect(JSON.parse(stored())).not.toHaveProperty('text')
    })

    // The field stops at the server's limit; the note does too.
    it('writes no more than a message may hold', () => {
      noteChatReturn('me-id', ANNA, 'a'.repeat(MESSAGE_MAX_CHARS + 50))
      expect(JSON.parse(stored()).text).toHaveLength(MESSAGE_MAX_CHARS)
    })

    it('writes nothing without a member signed in, or without a partner', () => {
      noteChatReturn(null, ANNA)
      noteChatReturn(undefined, ANNA)
      noteChatReturn('me-id', null)
      noteChatReturn('me-id', { gradidoID: '' })
      expect(window.localStorage.length).toBe(0)
    })
  })

  describe('takeChatReturn', () => {
    it('gives the pair back, and lets the note go: a start comes back to it once', () => {
      noteChatReturn('me-id', ANNA)
      expect(takeChatReturn('me-id')).toEqual({ ...ANNA, text: '' })
      expect(stored()).toBeNull()
      expect(takeChatReturn('me-id')).toBeNull()
    })

    it('gives the words back with it', () => {
      noteChatReturn('me-id', ANNA, 'Hier ist die Datei:')
      expect(takeChatReturn('me-id')).toEqual({ ...ANNA, text: 'Hier ist die Datei:' })
    })

    it.each([
      ['words that are no text', 7, ''],
      ['a field of spaces', '   ', ''],
      [
        'more than a message may hold',
        'b'.repeat(MESSAGE_MAX_CHARS + 1),
        'b'.repeat(MESSAGE_MAX_CHARS),
      ],
    ])('reads %s as they may stand in a field', (_, text, words) => {
      store(JSON.stringify({ ...ANNA, at: NOW, text }))
      expect(takeChatReturn('me-id').text).toBe(words)
    })

    // One browser serves several members (chatVideoApp).
    it("does not take another member's note", () => {
      noteChatReturn('other-member', ANNA)
      expect(takeChatReturn('me-id')).toBeNull()
      expect(stored('other-member')).not.toBeNull()
    })

    it('takes a note up to an hour old, and lets an older one go', () => {
      store(JSON.stringify({ ...ANNA, at: NOW - CHAT_RETURN_MAX_AGE_MS }))
      expect(takeChatReturn('me-id')).toEqual({ ...ANNA, text: '' })

      store(JSON.stringify({ ...ANNA, at: NOW - CHAT_RETURN_MAX_AGE_MS - 1 }))
      expect(takeChatReturn('me-id')).toBeNull()
      expect(stored()).toBeNull()
    })

    it.each([
      ['no JSON', '{'],
      ['null', 'null'],
      ['a note without a person', JSON.stringify({ at: NOW })],
      ['a person that is no text', JSON.stringify({ gradidoID: 7, at: NOW })],
      ['an empty person', JSON.stringify({ gradidoID: '', at: NOW })],
      ['no time', JSON.stringify({ gradidoID: 'anna-id' })],
      ['a time that is no number', JSON.stringify({ gradidoID: 'anna-id', at: String(NOW) })],
    ])('takes nothing from %s, and lets it go', (_, value) => {
      store(value)
      expect(takeChatReturn('me-id')).toBeNull()
      expect(stored()).toBeNull()
    })

    it('reads an empty or missing community as this community', () => {
      store(JSON.stringify({ gradidoID: 'anna-id', communityUuid: '', at: NOW }))
      expect(takeChatReturn('me-id')).toEqual({
        gradidoID: 'anna-id',
        communityUuid: null,
        text: '',
      })
      store(JSON.stringify({ gradidoID: 'anna-id', at: NOW }))
      expect(takeChatReturn('me-id')).toEqual({
        gradidoID: 'anna-id',
        communityUuid: null,
        text: '',
      })
    })

    it('takes nothing without a member signed in', () => {
      noteChatReturn('me-id', ANNA)
      expect(takeChatReturn(null)).toBeNull()
      expect(stored()).not.toBeNull()
    })
  })

  /**
   * The start hands the words to the field of the conversation it opens -- in memory, never
   * through the address (the browser keeps that in its history).
   */
  describe('holdChatText and takeHeldChatText', () => {
    it('hand the words to the thread with that person, once', () => {
      holdChatText({ ...ANNA, text: 'Hier ist die Datei:' })
      expect(takeHeldChatText({ gradidoID: 'ANNA-ID' })).toBe('Hier ist die Datei:')
      expect(takeHeldChatText(ANNA)).toBe('')
    })

    // They belong to the first thread after the start, and only if it is theirs.
    it('give another person nothing, and stop waiting', () => {
      holdChatText({ ...ANNA, text: 'Hier ist die Datei:' })
      expect(takeHeldChatText({ gradidoID: 'carla-id' })).toBe('')
      expect(takeHeldChatText(ANNA)).toBe('')
    })

    it('hold nothing for a note without words', () => {
      holdChatText({ ...ANNA, text: '' })
      expect(takeHeldChatText(ANNA)).toBe('')
      holdChatText(null)
      expect(takeHeldChatText(ANNA)).toBe('')
    })
  })

  /**
   * A group's thread (P5): the note names the group by its uuid, and the words go back to that
   * group's field -- never to the thread with a person, nor the other way round.
   */
  describe('in a group', () => {
    const CAFE = { groupUuid: 'cafe-uuid' }

    it('notes the group by its uuid, and nothing of a person', () => {
      noteChatReturn('me-id', { ...CAFE, gradidoID: 'anna-id' }, 'Bis Samstag')
      expect(JSON.parse(stored())).toEqual({ groupUuid: 'cafe-uuid', at: NOW, text: 'Bis Samstag' })
    })

    it('gives the group back, with the words, and lets the note go', () => {
      noteChatReturn('me-id', CAFE, 'Bis Samstag')
      expect(takeChatReturn('me-id')).toEqual({ groupUuid: 'cafe-uuid', text: 'Bis Samstag' })
      expect(stored()).toBeNull()
    })

    it('lets an hour-old note of a group go, as one of a person', () => {
      noteChatReturn('me-id', CAFE)
      vi.setSystemTime(NOW + CHAT_RETURN_MAX_AGE_MS + 1)
      expect(takeChatReturn('me-id')).toBeNull()
    })

    it('hands the words to that group, without regard to case, once', () => {
      holdChatText({ ...CAFE, text: 'Bis Samstag' })
      expect(takeHeldChatText({ groupUuid: 'CAFE-UUID' })).toBe('Bis Samstag')
      expect(takeHeldChatText(CAFE)).toBe('')
    })

    it('gives another group, and a person, nothing', () => {
      holdChatText({ ...CAFE, text: 'Bis Samstag' })
      expect(takeHeldChatText({ groupUuid: 'garten-uuid' })).toBe('')
      holdChatText({ ...CAFE, text: 'Bis Samstag' })
      expect(takeHeldChatText(ANNA)).toBe('')
    })

    // The other way round: a person's words never land in a group's field.
    it("gives a group nothing of a person's words", () => {
      holdChatText({ ...ANNA, text: 'Hier ist die Datei:' })
      expect(takeHeldChatText({ ...CAFE, gradidoID: 'anna-id' })).toBe('')
    })
  })

  // The page came back into sight, or the thread closed: the note goes. Words a start holds stay
  // for the thread that has not taken them yet -- one whose first page failed (coderabbit, #3999).
  describe('dropChatReturnNote', () => {
    it('lets the note go, and keeps words held in memory', () => {
      noteChatReturn('me-id', ANNA, 'Hier ist die Datei:')
      holdChatText({ ...ANNA, text: 'Hier ist die Datei:' })
      dropChatReturnNote('me-id')

      expect(stored()).toBeNull()
      expect(takeHeldChatText(ANNA)).toBe('Hier ist die Datei:')
    })

    it("lets no other member's note go, and nothing without a member", () => {
      noteChatReturn('other-member', ANNA)
      dropChatReturnNote('me-id')
      dropChatReturnNote(null)
      expect(stored('other-member')).not.toBeNull()
    })
  })

  describe('forgetChatReturn', () => {
    // Signing out: the next member on this browser must not find the words in a field.
    it('lets words held in memory go too', () => {
      holdChatText({ ...ANNA, text: 'Hier ist die Datei:' })
      forgetChatReturn('me-id')
      expect(takeHeldChatText(ANNA)).toBe('')
    })

    it("lets the member's own note go, and no other", () => {
      noteChatReturn('me-id', ANNA)
      noteChatReturn('other-member', ANNA)
      forgetChatReturn('me-id')
      expect(stored()).toBeNull()
      expect(stored('other-member')).not.toBeNull()
      forgetChatReturn(null)
      expect(stored('other-member')).not.toBeNull()
    })
  })

  // Storage switched off (a private window, or site data blocked): the wallet goes on as before.
  it('goes on where the storage refuses', () => {
    const refuse = () => {
      throw new Error('SecurityError')
    }
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(refuse)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(refuse)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(refuse)

    expect(() => noteChatReturn('me-id', ANNA)).not.toThrow()
    expect(() => forgetChatReturn('me-id')).not.toThrow()
    expect(takeChatReturn('me-id')).toBeNull()
  })
})
