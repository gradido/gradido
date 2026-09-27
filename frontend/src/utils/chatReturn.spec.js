// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CHAT_RETURN_MAX_AGE_MS,
  forgetChatReturn,
  noteChatReturn,
  takeChatReturn,
} from './chatReturn'

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

    // ⛔ Whom, never what: whatever else the caller holds stays out of the note.
    it('writes the pair and the time, and nothing else', () => {
      noteChatReturn('me-id', { ...ANNA, text: 'Hier ist die Datei:', alias: 'Anna' })
      expect(Object.keys(JSON.parse(stored())).sort()).toEqual(['at', 'communityUuid', 'gradidoID'])
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
      expect(takeChatReturn('me-id')).toEqual(ANNA)
      expect(stored()).toBeNull()
      expect(takeChatReturn('me-id')).toBeNull()
    })

    // One browser serves several members (chatVideoApp).
    it("does not take another member's note", () => {
      noteChatReturn('other-member', ANNA)
      expect(takeChatReturn('me-id')).toBeNull()
      expect(stored('other-member')).not.toBeNull()
    })

    it('takes a note up to an hour old, and lets an older one go', () => {
      store(JSON.stringify({ ...ANNA, at: NOW - CHAT_RETURN_MAX_AGE_MS }))
      expect(takeChatReturn('me-id')).toEqual(ANNA)

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
      expect(takeChatReturn('me-id')).toEqual({ gradidoID: 'anna-id', communityUuid: null })
      store(JSON.stringify({ gradidoID: 'anna-id', at: NOW }))
      expect(takeChatReturn('me-id')).toEqual({ gradidoID: 'anna-id', communityUuid: null })
    })

    it('takes nothing without a member signed in', () => {
      noteChatReturn('me-id', ANNA)
      expect(takeChatReturn(null)).toBeNull()
      expect(stored()).not.toBeNull()
    })
  })

  describe('forgetChatReturn', () => {
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
