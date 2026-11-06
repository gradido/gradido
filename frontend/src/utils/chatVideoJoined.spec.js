// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { chatVideoRoomOf, noteChatVideoJoined, videoJoinedAt } from './chatVideoJoined'
import { chatVideoInvitation } from './chatVideoCalendar'
import { chatVideoInviteBody, readChatVideoInvite } from './chatVideoInvite'
import { THANKS_NUDGE_HOLDS_MS } from './thanksNudge'

const MINUTE = 60 * 1000
const DAY = 24 * 60 * MINUTE
const AT = new Date('2026-11-06T09:00:00.000Z').getTime()
const KEY = 'chat-video-joined:me-id'

const kept = (key = KEY) => JSON.parse(window.localStorage.getItem(key) ?? 'null')

afterEach(() => {
  vi.restoreAllMocks()
  for (const key of Object.keys(window.localStorage)) {
    if (key.startsWith('chat-video-joined:')) window.localStorage.removeItem(key)
  }
})

describe('the invitations the member went into the room of', () => {
  it('are kept for the member, by the invitation, with the time of the click', () => {
    noteChatVideoJoined('me-id', 'uuid-1', AT)

    expect(kept()).toEqual({ 'uuid-1': AT })
    expect(videoJoinedAt('me-id', 'uuid-1', AT)).toBe(AT)
    expect(videoJoinedAt('me-id', 'uuid-2', AT)).toBeNull()
  })

  // Festlegung 1: a second click into the room does not move the time.
  it('keep the first click', () => {
    noteChatVideoJoined('me-id', 'uuid-1', AT)
    noteChatVideoJoined('me-id', 'uuid-1', AT + 40 * MINUTE)

    expect(kept()).toEqual({ 'uuid-1': AT })
    expect(videoJoinedAt('me-id', 'uuid-1', AT + 41 * MINUTE)).toBe(AT)
  })

  it('hold for seven days, to the millisecond', () => {
    noteChatVideoJoined('me-id', 'uuid-1', AT)

    expect(videoJoinedAt('me-id', 'uuid-1', AT + THANKS_NUDGE_HOLDS_MS)).toBe(AT)
    expect(videoJoinedAt('me-id', 'uuid-1', AT + THANKS_NUDGE_HOLDS_MS + 1)).toBeNull()
  })

  // Older clicks go as the next one is written, and a click older than the seven days is none:
  // the next one counts.
  it('let go of clicks older than seven days when the next is written', () => {
    noteChatVideoJoined('me-id', 'uuid-old', AT)
    noteChatVideoJoined('me-id', 'uuid-1', AT + DAY)
    const later = AT + 7 * DAY + MINUTE

    noteChatVideoJoined('me-id', 'uuid-2', later)
    expect(kept()).toEqual({ 'uuid-1': AT + DAY, 'uuid-2': later })

    noteChatVideoJoined('me-id', 'uuid-old', later)
    expect(videoJoinedAt('me-id', 'uuid-old', later)).toBe(later)
  })

  it('know nothing without the member, and without the invitation', () => {
    noteChatVideoJoined(null, 'uuid-1', AT)
    noteChatVideoJoined(undefined, 'uuid-1', AT)
    noteChatVideoJoined('', 'uuid-1', AT)
    noteChatVideoJoined('me-id', null, AT)
    noteChatVideoJoined('me-id', '', AT)

    expect(Object.keys(window.localStorage).filter((key) => key.startsWith('chat-video'))).toEqual(
      [],
    )
    expect(videoJoinedAt(null, 'uuid-1', AT)).toBeNull()
    expect(videoJoinedAt('me-id', null, AT)).toBeNull()
  })

  // One browser serves several members (chatVideoApp, useThanksNudges).
  it('are each member’s own on one device', () => {
    noteChatVideoJoined('anna-id', 'uuid-1', AT)
    noteChatVideoJoined('carla-id', 'uuid-1', AT + MINUTE)

    expect(videoJoinedAt('anna-id', 'uuid-1', AT + MINUTE)).toBe(AT)
    expect(videoJoinedAt('carla-id', 'uuid-1', AT + MINUTE)).toBe(AT + MINUTE)
    expect(videoJoinedAt('me-id', 'uuid-1', AT + MINUTE)).toBeNull()
  })

  // A uuid is written in lower case: the server compares them without regard to case.
  it('take the invitation without regard to case', () => {
    noteChatVideoJoined('me-id', 'UUID-A1', AT)

    expect(kept()).toEqual({ 'uuid-a1': AT })
    expect(videoJoinedAt('me-id', 'uuid-a1', AT)).toBe(AT)
    expect(videoJoinedAt('me-id', 'Uuid-A1', AT)).toBe(AT)
  })

  // ⛔ The room's address is the call's secret (Bernd, 06.11.2026): the device keeps the
  // invitation and the time, nothing else.
  it('keep no address, only invitations and times', () => {
    noteChatVideoJoined('me-id', 'uuid-1', AT)

    expect(Object.values(kept()).every((at) => typeof at === 'number')).toBe(true)
    expect(window.localStorage.getItem(KEY)).not.toMatch(/https?:|meet|#/)
  })

  it('take nothing from what stands there and is no list of theirs', () => {
    window.localStorage.setItem(KEY, '["uuid-1"]')
    expect(videoJoinedAt('me-id', '0', AT)).toBeNull()
    window.localStorage.setItem(KEY, '{"uuid-1":"yesterday"}')
    expect(videoJoinedAt('me-id', 'uuid-1', AT)).toBeNull()
    window.localStorage.setItem(KEY, 'no json')
    expect(videoJoinedAt('me-id', 'uuid-1', AT)).toBeNull()

    noteChatVideoJoined('me-id', 'uuid-1', AT)
    expect(kept()).toEqual({ 'uuid-1': AT })
  })

  // Storage switched off, or full: the page holds the click for as long as it stands.
  it('hold a click for as long as the page stands, where the device keeps nothing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    noteChatVideoJoined('nothing-kept-id', 'uuid-1', AT)
    noteChatVideoJoined('nothing-kept-id', 'uuid-1', AT + MINUTE)

    expect(videoJoinedAt('nothing-kept-id', 'uuid-1', AT + MINUTE)).toBe(AT)
    expect(videoJoinedAt('nothing-kept-id', 'uuid-2', AT + MINUTE)).toBeNull()
  })

  // What is drawn from a click follows it at once (the page's own copy is reactive): the thread's
  // line does not have to wait for its next minute.
  it('are followed at once by whatever reads them', () => {
    const shown = computed(() => videoJoinedAt('me-id', 'uuid-r', AT + MINUTE))
    expect(shown.value).toBeNull()

    noteChatVideoJoined('me-id', 'uuid-r', AT)

    expect(shown.value).toBe(AT)
  })
})

/**
 * ⛔ The click knows only its link, the thread reads the invitation's room: the two are compared
 * by `chatVideoRoomOf` -- if they ever differed, no line would come, and no other test would say
 * so. Both made by the wallet's own words, for a call now and for one planned.
 */
describe('the room a link leads into', () => {
  const i18n = {
    t: (key, values = {}) => [key, ...Object.values(values)].join(' '),
    d: (date) => date.toISOString(),
    locale: 'de',
  }
  const ROOM = 'https://meet.ffmuc.net/K7m2X9q4t8Wz'
  const calls = {
    now: { room: ROOM, topic: 'Lesekreis „Momo“', when: null, operator: 'Freifunk München' },
    planned: {
      room: ROOM,
      topic: 'Gartenrunde',
      when: { start: new Date(AT + DAY), end: new Date(AT + DAY + 60 * MINUTE) },
      operator: 'Freifunk München',
    },
    // E-060: its address carries the start it had first and the count of its changes.
    'changed in its time': {
      room: ROOM,
      topic: 'Gartenrunde',
      when: { start: new Date(AT + 2 * DAY), end: new Date(AT + 2 * DAY + 60 * MINUTE) },
      operator: 'Freifunk München',
      revision: { first: new Date(AT + DAY), sequence: 1 },
    },
  }

  it.each(Object.keys(calls))('is the invitation’s room, for a call %s', (kind) => {
    const { body } = chatVideoInviteBody(i18n, calls[kind])
    // The link as the thread finds it in the message (chatTextParts): what the bubble's link
    // carries, and what a click hands on.
    const link = chatVideoInvitation(body).url
    expect(link).toContain('#config.subject=')

    const read = readChatVideoInvite(i18n, body)
    expect(read).not.toBeNull()
    expect(chatVideoRoomOf(link)).toBe(chatVideoRoomOf(read.room))
    expect(chatVideoRoomOf(link)).toBe(chatVideoRoomOf(chatVideoInvitation(body).room))
    expect(chatVideoRoomOf(link)).toBe('https://meet.ffmuc.net/k7m2x9q4t8wz')
  })

  it('is every other address as it is, in lower case', () => {
    expect(chatVideoRoomOf('https://gradido.net/FAQ#konto')).toBe('https://gradido.net/faq#konto')
    expect(chatVideoRoomOf(undefined)).toBe('')
  })
})
