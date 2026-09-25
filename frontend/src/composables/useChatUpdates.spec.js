// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CHAT_POLL_BACKOFF_MAX_MS,
  CHAT_POLL_INTERVAL_MS,
  CHAT_POLL_ROUNDS_MAX,
  chatUnreadConversations,
  onChatMessages,
  pollChatNow,
  startChatUpdates,
  stopChatUpdates,
} from './useChatUpdates'
import { newChatMessagesSince } from '@/graphql/chat.graphql'

const { refreshContactsPanel } = vi.hoisted(() => ({ refreshContactsPanel: vi.fn() }))
vi.mock('@/composables/useContactsPanel', () => ({ refreshContactsPanel }))

/** A message as the server sends it, in conversation 3 unless said otherwise. */
const chatMessage = (id, extra = {}) => ({
  id,
  messageUuid: `uuid-${id}`,
  conversationId: 3,
  sender: { communityUuid: 'home-uuid', gradidoID: 'lena-id' },
  mine: false,
  subject: null,
  body: `message ${id}`,
  createdAt: '2026-09-25T10:00:00.000Z',
  deliveryState: null,
  notify: null,
  ...extra,
})

const update = ({ latestId = 10, unread = 0, messages = [], hasMore = false } = {}) => ({
  data: {
    newChatMessagesSince: { latestId, unreadConversations: unread, messages, hasMore },
  },
})

/**
 * The server as `apolloClient.query` shows it: a test lines up answers (or failures); each is
 * handed out when a question comes, and one without a lined-up answer says "nothing new" with
 * the last `latestId`. `hold()` keeps the next answer on its way until the test lets it go.
 */
const makeServer = () => {
  const answers = []
  let lastLatest = 10
  let gate = null
  const query = vi.fn(async () => {
    if (gate) await gate
    const next = answers.shift()
    if (next instanceof Error) throw next
    const answer = next ?? update({ latestId: lastLatest })
    lastLatest = answer.data.newChatMessagesSince.latestId
    return answer
  })
  return {
    client: { query },
    query,
    answer: (...next) => answers.push(...next),
    hold: () => {
      let release
      gate = new Promise((resolve) => {
        release = () => {
          gate = null
          resolve()
        }
      })
      return release
    },
    afterIds: () => query.mock.calls.map(([options]) => options.variables.afterId),
  }
}

let hidden = false
const setHidden = (value) => {
  hidden = value
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useChatUpdates', () => {
  let server

  beforeEach(() => {
    vi.useFakeTimers()
    hidden = false
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
    refreshContactsPanel.mockClear()
    server = makeServer()
  })

  afterEach(() => {
    stopChatUpdates()
    delete document.hidden
    vi.useRealTimers()
  })

  describe('the question', () => {
    it('asks first without a marker -- the answer only says where one stands', async () => {
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)

      expect(server.query).toHaveBeenCalledTimes(1)
      const [options] = server.query.mock.calls[0]
      expect(options.query).toBe(newChatMessagesSince)
      expect(options.variables).toEqual({ afterId: null, limit: 50 })
    })

    // Nothing reads these answers back, and every marker would leave its own entry.
    it('keeps nothing in the Apollo cache', async () => {
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      expect(server.query.mock.calls[0][0].fetchPolicy).toBe('no-cache')
    })

    // ⛔ The beat is not the member doing something: its answers must not move the idle logout.
    it('leaves the session clock alone', async () => {
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      expect(server.query.mock.calls[0][0].context).toEqual({ renewSession: false })
    })
  })

  describe('the beat', () => {
    // The threshold from below first (skill null-w): a timer of 0 would pass the second half.
    it('asks again after fifteen seconds, not before, with the marker', async () => {
      server.answer(update({ latestId: 42 }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)

      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS - 1)
      expect(server.query).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(1)
      expect(server.query).toHaveBeenCalledTimes(2)
      expect(server.afterIds()).toEqual([null, 42])
    })

    it('goes on from the latestId of every answer', async () => {
      server.answer(
        update({ latestId: 42 }),
        update({ latestId: 45, messages: [chatMessage(43), chatMessage(45)] }),
        update({ latestId: 45 }),
      )
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(2 * CHAT_POLL_INTERVAL_MS)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)

      expect(server.afterIds()).toEqual([null, 42, 45, 45])
    })

    it('shows how many conversations hold something unread, as the last answer said', async () => {
      server.answer(update({ unread: 3 }), update({ unread: 1 }))
      expect(chatUnreadConversations.value).toBe(0)

      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      expect(chatUnreadConversations.value).toBe(3)

      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(chatUnreadConversations.value).toBe(1)
    })

    // Read-only outside the module: nobody else writes the figure the menu shows.
    it('does not let anybody else set the figure', async () => {
      server.answer(update({ unread: 2 }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      chatUnreadConversations.value = 7

      expect(chatUnreadConversations.value).toBe(2)
      warn.mockRestore()
    })

    it('starts once, however often it is started', async () => {
      startChatUpdates(server.client)
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      expect(server.query).toHaveBeenCalledTimes(1)
    })
  })

  describe('more than one answer holds', () => {
    const full = (latestId) =>
      update({ latestId, hasMore: true, messages: [chatMessage(latestId)] })

    it('asks again at once while the server says there is more', async () => {
      server.answer(update({ latestId: 10 }), full(60), update({ latestId: 70 }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)

      // The second right after the first, no beat in between.
      expect(server.afterIds()).toEqual([null, 10, 60])
    })

    /**
     * E-017: rather fall back on the list than fetch everything at once. Five answers in a row
     * at most; then the list is asked again, and the rest follows from where the last answer
     * stopped -- with the beat, not at once.
     */
    it('stops after five in a row, asks the list again, and goes on with the beat', async () => {
      server.answer(update({ latestId: 10 }), full(60), full(110), full(160), full(210), full(260))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)

      expect(CHAT_POLL_ROUNDS_MAX).toBe(5)
      expect(server.afterIds()).toEqual([null, 10, 60, 110, 160, 210])
      expect(refreshContactsPanel).toHaveBeenCalledTimes(1)

      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS - 1)
      expect(server.query).toHaveBeenCalledTimes(6)
      await vi.advanceTimersByTimeAsync(1)
      expect(server.afterIds().at(-1)).toBe(260)
    })
  })

  describe('out of sight', () => {
    it('asks nothing while the page is hidden, and at once when it comes back', async () => {
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      expect(server.query).toHaveBeenCalledTimes(1)

      setHidden(true)
      await vi.advanceTimersByTimeAsync(10 * CHAT_POLL_INTERVAL_MS)
      expect(server.query).toHaveBeenCalledTimes(1)

      setHidden(false)
      await vi.advanceTimersByTimeAsync(0)
      expect(server.query).toHaveBeenCalledTimes(2)

      // …and then the beat again.
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(server.query).toHaveBeenCalledTimes(3)
    })

    it('does not start asking in a tab that opens in the background', async () => {
      hidden = true
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(5 * CHAT_POLL_INTERVAL_MS)
      expect(server.query).not.toHaveBeenCalled()

      setHidden(false)
      await vi.advanceTimersByTimeAsync(0)
      expect(server.afterIds()).toEqual([null])
    })

    it('plans nothing after an answer that lands while the page is hidden', async () => {
      const release = server.hold()
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      setHidden(true)
      release()
      await vi.advanceTimersByTimeAsync(0)

      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('when a question fails', () => {
    it('doubles the pause up to two minutes, and the next answer brings the beat back', async () => {
      server.answer(
        update({ latestId: 10 }),
        new Error('down'),
        new Error('down'),
        new Error('down'),
        new Error('down'),
      )
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS) // 2nd: fails
      expect(server.query).toHaveBeenCalledTimes(2)

      // 30 s, then 60 s, then 120 s, then still 120 s -- each measured from below first.
      for (const pause of [30000, 60000, 120000, 120000]) {
        const before = server.query.mock.calls.length
        await vi.advanceTimersByTimeAsync(pause - 1)
        expect(server.query).toHaveBeenCalledTimes(before)
        await vi.advanceTimersByTimeAsync(1)
        expect(server.query).toHaveBeenCalledTimes(before + 1)
      }
      expect(CHAT_POLL_BACKOFF_MAX_MS).toBe(120000)

      // The last one answered: fifteen seconds again.
      const before = server.query.mock.calls.length
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(server.query).toHaveBeenCalledTimes(before + 1)
    })

    it('keeps the marker and the figure of the last answer through a failure', async () => {
      server.answer(update({ latestId: 42, unread: 2 }), new Error('down'))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(server.query).toHaveBeenCalledTimes(2)
      expect(chatUnreadConversations.value).toBe(2)

      await vi.advanceTimersByTimeAsync(2 * CHAT_POLL_INTERVAL_MS)
      expect(server.afterIds()).toEqual([null, 42, 42])
    })
  })

  describe('asking now', () => {
    it('asks at once, out of turn, and the beat starts over from there', async () => {
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(5000)

      await pollChatNow()
      expect(server.query).toHaveBeenCalledTimes(2)

      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS - 1)
      expect(server.query).toHaveBeenCalledTimes(2)
      await vi.advanceTimersByTimeAsync(1)
      expect(server.query).toHaveBeenCalledTimes(3)
    })

    /**
     * ⛔ Never two at once -- and "ask now" while an answer is on its way is not swallowed: that
     * answer left before the reason to ask again (a message just marked read), so one more
     * question follows right after it.
     */
    it('never has two questions on their way, and asks once more after the one that was', async () => {
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      const release = server.hold()
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(server.query).toHaveBeenCalledTimes(2)

      pollChatNow()
      pollChatNow()
      await vi.advanceTimersByTimeAsync(0)
      expect(server.query).toHaveBeenCalledTimes(2)

      release()
      await vi.advanceTimersByTimeAsync(0)
      expect(server.query).toHaveBeenCalledTimes(3)
    })

    it('asks nothing while the page is hidden', async () => {
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      hidden = true

      await pollChatNow()
      expect(server.query).toHaveBeenCalledTimes(1)
    })

    it('asks nothing before the beat started', async () => {
      await pollChatNow()
      expect(server.query).not.toHaveBeenCalled()
    })
  })

  describe('the messages that arrive', () => {
    it('hands them to whoever listens, in the order of the answer', async () => {
      const listener = vi.fn()
      const stop = onChatMessages(listener)
      server.answer(
        update({ latestId: 10 }),
        update({ latestId: 12, messages: [chatMessage(11), chatMessage(12, { mine: true })] }),
      )
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      expect(listener).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener.mock.calls[0][0].map((m) => m.id)).toEqual([11, 12])
      stop()
    })

    it('hands nothing on once the listener has stopped listening', async () => {
      const listener = vi.fn()
      const stop = onChatMessages(listener)
      server.answer(update({ latestId: 10 }), update({ latestId: 11, messages: [chatMessage(11)] }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      stop()

      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(listener).not.toHaveBeenCalled()
    })

    // One thread's failure must not stop the beat -- the menu mark and the other threads go on.
    it('goes on when one listener fails', async () => {
      const failing = vi.fn(() => {
        throw new Error('broken')
      })
      const listener = vi.fn()
      const stops = [onChatMessages(failing), onChatMessages(listener)]
      server.answer(
        update({ latestId: 10 }),
        update({ latestId: 11, unread: 1, messages: [chatMessage(11)] }),
      )
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)

      expect(listener).toHaveBeenCalledTimes(1)
      expect(chatUnreadConversations.value).toBe(1)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(server.query).toHaveBeenCalledTimes(3)
      stops.forEach((stop) => stop())
    })

    // E-023: the list's order and numbers are the server's -- asked again, not kept in step here.
    it('asks the contact list again when messages arrived, and only then', async () => {
      server.answer(update({ latestId: 10 }), update({ latestId: 10 }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(refreshContactsPanel).not.toHaveBeenCalled()

      server.answer(update({ latestId: 11, messages: [chatMessage(11)] }))
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(refreshContactsPanel).toHaveBeenCalledTimes(1)
      expect(refreshContactsPanel).toHaveBeenCalledWith(server.client)
    })
  })

  describe('stopping', () => {
    it('leaves no timer and no listener on the page, and forgets the figure', async () => {
      server.answer(update({ latestId: 42, unread: 4 }))
      const removed = vi.spyOn(document, 'removeEventListener')
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      expect(chatUnreadConversations.value).toBe(4)
      expect(vi.getTimerCount()).toBe(1)

      stopChatUpdates()

      expect(vi.getTimerCount()).toBe(0)
      expect(chatUnreadConversations.value).toBe(0)
      expect(removed).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
      // Coming back into sight after the stop asks nothing.
      setHidden(true)
      setHidden(false)
      await vi.advanceTimersByTimeAsync(2 * CHAT_POLL_INTERVAL_MS)
      expect(server.query).toHaveBeenCalledTimes(1)
      removed.mockRestore()
    })

    // An answer that lands after the member signed out belongs to them, not to whoever is next.
    it('drops an answer that lands after the stop', async () => {
      const listener = vi.fn()
      const stop = onChatMessages(listener)
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      const release = server.hold()
      server.answer(update({ latestId: 11, unread: 5, messages: [chatMessage(11)] }))
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)

      stopChatUpdates()
      release()
      await vi.advanceTimersByTimeAsync(0)

      expect(chatUnreadConversations.value).toBe(0)
      expect(listener).not.toHaveBeenCalled()
      expect(refreshContactsPanel).not.toHaveBeenCalled()
      expect(vi.getTimerCount()).toBe(0)
      stop()
    })

    it('starts afresh after a stop: without a marker, for the next member', async () => {
      server.answer(update({ latestId: 42 }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      stopChatUpdates()

      const next = makeServer()
      startChatUpdates(next.client)
      await vi.advanceTimersByTimeAsync(0)
      expect(next.afterIds()).toEqual([null])
    })
  })

  /**
   * ⛔ The beat's state lives in this module and nowhere else: the Vuex store is written to
   * localStorage in full, so a marker or a message put there would outlive the session. And the
   * beat is a constant of the chat, not CONFIG.AUTO_POLL_INTERVAL (0 on the servers). Only the
   * source can say both -- read with the comments taken out, because the comments name the very
   * words (skill null-af2).
   */
  describe('the source', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'useChatUpdates.js'),
      'utf8',
    )
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

    it('beats every fifteen seconds, by its own constant', () => {
      expect(code.match(/export const CHAT_POLL_INTERVAL_MS = 15000\b/g)).toHaveLength(1)
      expect(CHAT_POLL_INTERVAL_MS).toBe(15000)
      expect(code).not.toMatch(/AUTO_POLL_INTERVAL/)
    })

    it('touches neither the store nor any storage of the browser', () => {
      expect(code).not.toMatch(/\$store|useStore|@\/store|store\/store|\bstore\s*\./)
      expect(code).not.toMatch(/localStorage|sessionStorage|indexedDB/)
      // Gegenprobe on the stripping: the comments do name both, and are gone from `code`.
      expect(source).toMatch(/localStorage/)
      expect(source).toMatch(/store/)
    })
  })
})
