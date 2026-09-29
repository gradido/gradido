// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  chatVideoServerLabel,
  isChatVideoServerGone,
  readChatVideoServer,
  rememberChatVideoServer,
} from './chatVideoServer'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

// V5 (Bernd, 27.09.2026): the server chosen counts at once and stays -- per member on this
// device, as the box "Start in the Jitsi app" does, never one key for everybody.
describe('the server a member chose', () => {
  it('is none where nothing is remembered', () => {
    expect(readChatVideoServer('me-id')).toBeNull()
  })

  it('is remembered for this member, under a key of their own', () => {
    rememberChatVideoServer('me-id', 7)

    expect(localStorage.getItem('chat-video-server:me-id')).toBe('7')
    expect(readChatVideoServer('me-id')).toBe(7)
  })

  it('is not another member’s: two members on one device keep a choice each', () => {
    rememberChatVideoServer('me-id', 7)
    rememberChatVideoServer('other-id', 2)

    expect(readChatVideoServer('me-id')).toBe(7)
    expect(readChatVideoServer('other-id')).toBe(2)
    expect(readChatVideoServer('third-id')).toBeNull()
  })

  it('is forgotten on "at random", and only this member’s', () => {
    rememberChatVideoServer('me-id', 7)
    rememberChatVideoServer('other-id', 2)

    rememberChatVideoServer('me-id', null)

    expect(localStorage.getItem('chat-video-server:me-id')).toBeNull()
    expect(readChatVideoServer('other-id')).toBe(2)
  })

  it('is neither read nor written without a member -- before the login answer, after signing out', () => {
    rememberChatVideoServer(null, 7)
    rememberChatVideoServer('', 7)

    expect(localStorage.length).toBe(0)
    localStorage.setItem('chat-video-server:', '7')
    expect(readChatVideoServer(null)).toBeNull()
    expect(readChatVideoServer('')).toBeNull()
  })

  it.each([['0'], ['-3'], ['1.5'], ['abc'], ['']])('is none for a stored %j', (stored) => {
    localStorage.setItem('chat-video-server:me-id', stored)

    expect(readChatVideoServer('me-id')).toBeNull()
  })

  it('is none where the storage throws, and a choice is not remembered then -- without a throw', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(readChatVideoServer('me-id')).toBeNull()
    expect(() => rememberChatVideoServer('me-id', 7)).not.toThrow()
  })
})

describe('a server in the choice', () => {
  it('reads as its host, then who runs it', () => {
    expect(chatVideoServerLabel({ host: 'meet.systemli.org', operator: 'Systemli' })).toBe(
      'meet.systemli.org – Systemli',
    )
  })

  it('reads as its host alone where the list names nobody', () => {
    expect(chatVideoServerLabel({ host: 'meet.example.org', operator: null })).toBe(
      'meet.example.org',
    )
  })
})

describe('the answer that the chosen server is not to be had', () => {
  it('is told from the others', () => {
    expect(isChatVideoServerGone(new Error('CHAT_VIDEO_SERVER_UNAVAILABLE'))).toBe(true)
    expect(isChatVideoServerGone(new Error('GraphQL error: CHAT_VIDEO_SERVER_UNAVAILABLE'))).toBe(
      true,
    )
    expect(isChatVideoServerGone(new Error('CHAT_VIDEO_NO_SERVER'))).toBe(false)
    expect(isChatVideoServerGone(undefined)).toBe(false)
  })
})
