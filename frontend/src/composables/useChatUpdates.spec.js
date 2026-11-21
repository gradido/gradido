// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CHAT_POLL_BACKOFF_MAX_MS,
  CHAT_POLL_INTERVAL_MS,
  CHAT_POLL_ROUNDS_MAX,
  CHAT_READ_WATCH_MAX,
  chatUnreadConversations,
  onChatMessages,
  onChatMessagesEdited,
  onChatMessagesReacted,
  pollChatNow,
  startChatUpdates,
  stopChatUpdates,
  watchChatRead,
} from './useChatUpdates'
import { newChatMessagesSince } from '@/graphql/chat.graphql'
import {
  supportTicketsActiveNow,
  supportTicketsInProgress,
  supportTicketsUnfinished,
} from '@/composables/useSupportTicketsMenu'
import { contributionsInProgress } from '@/composables/useContributionsInProgress'
import {
  moderationCreationsWaiting,
  moderationSupportTicketsWaiting,
} from '@/composables/useModerationWaiting'

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
  mailState: null,
  ...extra,
})

const update = ({
  latestId = 10,
  unread = 0,
  messages = [],
  hasMore = false,
  edited = [],
  editedCursor = '1759309220000-0',
  reacted = [],
  reactedCursor = '1759309220000-0',
  unreadTransfers = 0,
  latestUnreadTransferId = null,
  readUpTo,
} = {}) => ({
  data: {
    newChatMessagesSince: {
      latestId,
      unreadConversations: unread,
      messages,
      hasMore,
      edited,
      editedCursor,
      reacted,
      reactedCursor,
      unreadTransfers,
      latestUnreadTransferId,
      // Only where a test names it: an answer without it is one of the cases.
      ...(readUpTo === undefined ? {} : { readUpTo }),
    },
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
    editedCursors: () => query.mock.calls.map(([options]) => options.variables.editedCursor),
    reactedCursors: () => query.mock.calls.map(([options]) => options.variables.reactedCursor),
    readBys: () => query.mock.calls.map(([options]) => options.variables.readBy),
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
      expect(options.variables).toEqual({
        afterId: null,
        limit: 50,
        editedCursor: null,
        reactedCursor: null,
        readBy: null,
      })
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
    it('asks the contact list again when messages arrived, not while nothing moved', async () => {
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

  /**
   * The dots in the contact list follow the server's numbers, and a number can move without
   * a message arriving: a conversation was read -- here, or on another device. Then the list
   * is asked again, as for an arrival; the wallet does not take a dot away on its own.
   */
  describe('the contact list when something was read', () => {
    it('asks the list again when the figure moved without a message', async () => {
      server.answer(update({ latestId: 10, unread: 2 }), update({ latestId: 10, unread: 2 }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(refreshContactsPanel).not.toHaveBeenCalled()

      server.answer(update({ latestId: 10, unread: 1 }))
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(chatUnreadConversations.value).toBe(1)
      expect(refreshContactsPanel).toHaveBeenCalledTimes(1)
      expect(refreshContactsPanel).toHaveBeenCalledWith(server.client)
    })

    // What the thread does after its read pointer went out: ask now, and the smaller figure
    // brings the list along -- the dot at the person goes within a second, not with the next
    // message.
    it('asks the list after a question out of turn brought the smaller figure', async () => {
      server.answer(update({ latestId: 10, unread: 1 }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)

      server.answer(update({ latestId: 10, unread: 0 }))
      await pollChatNow()
      expect(chatUnreadConversations.value).toBe(0)
      expect(refreshContactsPanel).toHaveBeenCalledTimes(1)
    })

    // The first answer only says where one stands, and the list was loaded a moment ago --
    // with the layout, or with the next member after a logout.
    it('does not ask the list for a first answer, however high its figure', async () => {
      server.answer(update({ latestId: 10, unread: 3 }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      expect(chatUnreadConversations.value).toBe(3)
      expect(refreshContactsPanel).not.toHaveBeenCalled()

      stopChatUpdates()
      server.answer(update({ latestId: 10, unread: 5 }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      expect(chatUnreadConversations.value).toBe(5)
      expect(refreshContactsPanel).not.toHaveBeenCalled()
    })
  })

  /**
   * Chat E-086: a transfer the member received counts as unread until it was seen. Its dot and
   * the line under the name are the list's, asked again when one arrives or is seen -- also where
   * the number of people stays as it was: somebody whose message waits sent a transfer as well.
   */
  describe('the contact list when a transfer arrived or was seen', () => {
    it('asks the list again when a transfer arrived, the number of people the same', async () => {
      server.answer(update({ unread: 1 }), update({ unread: 1 }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(refreshContactsPanel).not.toHaveBeenCalled()

      server.answer(update({ unread: 1, unreadTransfers: 1, latestUnreadTransferId: 501 }))
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(refreshContactsPanel).toHaveBeenCalledTimes(1)
      expect(refreshContactsPanel).toHaveBeenCalledWith(server.client)
    })

    it('asks the list again when a transfer was seen', async () => {
      server.answer(update({ unreadTransfers: 2, latestUnreadTransferId: 501 }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)

      // The older one of the two seen: the newest stays, the count moves.
      server.answer(update({ unreadTransfers: 1, latestUnreadTransferId: 501 }))
      await pollChatNow()
      expect(refreshContactsPanel).toHaveBeenCalledTimes(1)
    })

    it('does not ask the list while the transfers stay as they were, nor for a first answer', async () => {
      server.answer(
        update({ unreadTransfers: 2, latestUnreadTransferId: 501 }),
        update({ unreadTransfers: 2, latestUnreadTransferId: 501 }),
      )
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)

      expect(refreshContactsPanel).not.toHaveBeenCalled()
    })

    // A beat that starts anew says where one stands first: the next member's first answer brings
    // no list along, whatever the one before had.
    it('forgets the transfers of the beat before', async () => {
      server.answer(update({ unreadTransfers: 2, latestUnreadTransferId: 501 }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      stopChatUpdates()

      server.answer(update({ unreadTransfers: 0, latestUnreadTransferId: null }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      expect(refreshContactsPanel).not.toHaveBeenCalled()
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
   * The messages whose text was changed (E-060): asked for with the cursor the last answer handed
   * on, and handed to whoever listens for changes -- a channel of its own beside the arrivals.
   */
  describe('the messages that were changed', () => {
    it('hands back the cursor the last answer handed on, as it came', async () => {
      server.answer(
        update({ editedCursor: '1759309220000-0' }),
        update({ editedCursor: '1759309235000-0' }),
        // Over the cap: the server goes on exactly after the last one it handed out.
        update({ editedCursor: '1759309233123-4711' }),
      )
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)

      expect(server.editedCursors()).toEqual([
        null,
        '1759309220000-0',
        '1759309235000-0',
        '1759309233123-4711',
      ])
    })

    it('hands the changed messages to whoever listens for changes, and not as arrivals', async () => {
      const arrived = vi.fn()
      const changed = vi.fn()
      onChatMessages(arrived)
      const stop = onChatMessagesEdited(changed)
      const edited = [
        chatMessage(4, { body: 'changed', editedAt: '2026-10-01T09:00:00.000Z' }),
        chatMessage(7, {
          conversationId: 9,
          body: 'changed too',
          editedAt: '2026-10-01T09:00:01.000Z',
        }),
      ]
      server.answer(update(), update({ edited }))

      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)

      expect(changed).toHaveBeenCalledTimes(1)
      expect(changed).toHaveBeenCalledWith(edited)
      expect(arrived).not.toHaveBeenCalled()
      // A change moves no order and no dot, but the changed message may be the latest of its
      // conversation, whose words stand under a name on "Kontakte & Chat" (E-083): the lists are
      // asked again, once for the round.
      expect(refreshContactsPanel).toHaveBeenCalledTimes(1)

      stop()
      server.answer(update({ edited }))
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(changed).toHaveBeenCalledTimes(1)
    })

    // ⚠️ The server hands a change on again for some seconds (CHAT_EDITS_SETTLE_MS on the server):
    // the lists are asked again once per change, not once per answer that repeats it.
    it('asks the lists again once for a change the server repeats, and again for a newer one', async () => {
      const once = [chatMessage(4, { body: 'changed', editedAt: '2026-10-01T09:00:00.000Z' })]
      const twice = [chatMessage(4, { body: 'again', editedAt: '2026-10-01T09:05:00.000Z' })]
      server.answer(
        update(),
        update({ edited: once }),
        update({ edited: once }),
        update({ edited: twice }),
      )

      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(refreshContactsPanel).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(refreshContactsPanel).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(refreshContactsPanel).toHaveBeenCalledTimes(2)
    })

    it('hands on arrivals and changes of the same answer, each to its own listeners', async () => {
      const arrived = vi.fn()
      const changed = vi.fn()
      onChatMessages(arrived)
      onChatMessagesEdited(changed)
      server.answer(
        update(),
        update({
          latestId: 12,
          messages: [chatMessage(12)],
          edited: [chatMessage(4, { body: 'changed' })],
        }),
      )

      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)

      expect(arrived.mock.calls).toEqual([[[chatMessage(12)]]])
      expect(changed.mock.calls).toEqual([[[chatMessage(4, { body: 'changed' })]]])
    })

    it('goes on with the others where one listener fails', async () => {
      const failing = vi.fn(() => {
        throw new Error('a thread that broke')
      })
      const changed = vi.fn()
      onChatMessagesEdited(failing)
      onChatMessagesEdited(changed)
      server.answer(update(), update({ edited: [chatMessage(4)] }), update({ unread: 2 }))

      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(changed).toHaveBeenCalledTimes(1)
      // And the beat goes on.
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(chatUnreadConversations.value).toBe(2)
    })

    // A failed question names no cursor: the next one asks from where the last answer said.
    it('keeps its cursor over a question that failed', async () => {
      server.answer(update({ editedCursor: '1759309220000-0' }), new Error('offline'))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      await vi.advanceTimersByTimeAsync(2 * CHAT_POLL_INTERVAL_MS)

      expect(server.editedCursors()).toEqual([null, '1759309220000-0', '1759309220000-0'])
    })

    // Nothing of one member's chat reaches the next one on this device.
    it('forgets its cursor when it stops', async () => {
      server.answer(update({ editedCursor: '1759309220000-0' }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      stopChatUpdates()

      const next = makeServer()
      startChatUpdates(next.client)
      await vi.advanceTimersByTimeAsync(0)
      expect(next.editedCursors()).toEqual([null])
    })
  })

  /**
   * The messages whose reactions were changed (Bernd, 11.10.2026): asked for with a cursor of
   * their own, and handed to whoever listens for them -- a third channel beside the arrivals and
   * the changed texts.
   */
  describe('the messages whose reactions changed', () => {
    const reactedTo = (id, emoji = '👍') =>
      chatMessage(id, {
        reactedAt: '2026-10-11T06:30:00.000Z',
        reactions: [{ emoji, count: 1, mine: false }],
      })

    it('hands back the cursor the last answer handed on, as it came -- its own, beside the other', async () => {
      server.answer(
        update({ editedCursor: '1759309220000-0', reactedCursor: '1759309221000-0' }),
        update({ editedCursor: '1759309235000-0', reactedCursor: '1759309233123-4711' }),
      )
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)

      expect(server.reactedCursors()).toEqual([null, '1759309221000-0', '1759309233123-4711'])
      // Each of the two goes its own way.
      expect(server.editedCursors()).toEqual([null, '1759309220000-0', '1759309235000-0'])
    })

    it('hands them to whoever listens for reactions, and to nobody else', async () => {
      const arrived = vi.fn()
      const changed = vi.fn()
      const reactions = vi.fn()
      onChatMessages(arrived)
      onChatMessagesEdited(changed)
      const stop = onChatMessagesReacted(reactions)
      const reacted = [reactedTo(4), reactedTo(7, '❤️')]
      server.answer(update(), update({ reacted }))

      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)

      expect(reactions).toHaveBeenCalledTimes(1)
      expect(reactions).toHaveBeenCalledWith(reacted)
      expect(arrived).not.toHaveBeenCalled()
      expect(changed).not.toHaveBeenCalled()
      // A reaction moves no order, no dot and no number: the contact list is not asked again.
      expect(refreshContactsPanel).not.toHaveBeenCalled()

      stop()
      server.answer(update({ reacted }))
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(reactions).toHaveBeenCalledTimes(1)
    })

    it('hands on all three kinds of one answer, each to its own listeners', async () => {
      const arrived = vi.fn()
      const changed = vi.fn()
      const reactions = vi.fn()
      onChatMessages(arrived)
      onChatMessagesEdited(changed)
      onChatMessagesReacted(reactions)
      server.answer(
        update(),
        update({
          latestId: 12,
          messages: [chatMessage(12)],
          edited: [chatMessage(4, { body: 'changed' })],
          reacted: [reactedTo(5)],
        }),
      )

      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)

      expect(arrived.mock.calls).toEqual([[[chatMessage(12)]]])
      expect(changed.mock.calls).toEqual([[[chatMessage(4, { body: 'changed' })]]])
      expect(reactions.mock.calls).toEqual([[[reactedTo(5)]]])
    })

    it('goes on with the others where one listener fails', async () => {
      const failing = vi.fn(() => {
        throw new Error('a thread that broke')
      })
      const reactions = vi.fn()
      onChatMessagesReacted(failing)
      onChatMessagesReacted(reactions)
      server.answer(update(), update({ reacted: [reactedTo(4)] }), update({ unread: 2 }))

      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(reactions).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(chatUnreadConversations.value).toBe(2)
    })

    it('keeps its cursor over a question that failed, and forgets it when the beat stops', async () => {
      server.answer(update({ reactedCursor: '1759309221000-0' }), new Error('offline'))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      await vi.advanceTimersByTimeAsync(2 * CHAT_POLL_INTERVAL_MS)
      expect(server.reactedCursors()).toEqual([null, '1759309221000-0', '1759309221000-0'])

      stopChatUpdates()
      const next = makeServer()
      startChatUpdates(next.client)
      await vi.advanceTimersByTimeAsync(0)
      expect(next.reactedCursors()).toEqual([null])
    })

    // A server from before the reactions names no cursor for them: none is made up, and the
    // rest of the beat goes on.
    it('asks without a cursor as long as no answer names one', async () => {
      const bare = update({ unread: 1 })
      delete bare.data.newChatMessagesSince.reacted
      delete bare.data.newChatMessagesSince.reactedCursor
      server.answer(bare, update({ unread: 3 }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)

      expect(server.reactedCursors()).toEqual([null, null])
      expect(chatUnreadConversations.value).toBe(3)
    })
  })

  /**
   * The support's field rides in the chat's question (Support-Anfragen K5): no question and no
   * timer of its own. What it brings goes on to useSupportTicketsMenu as it came; it is nothing
   * to the chat, and the chat is nothing to it.
   */
  describe('the support beside it (K5)', () => {
    const withSupport = (answer, supportTicketsMenu) => ({
      data: { ...answer.data, supportTicketsMenu },
    })
    const menu = () => ({
      active: supportTicketsActiveNow.value,
      inProgress: supportTicketsInProgress.value,
      unfinished: supportTicketsUnfinished.value,
    })
    const NOTHING = { active: null, inProgress: 0, unfinished: 0 }

    // The SECOND root field: the answers of the chat are read by the first one.
    it("asks the support's field beside the chat's, second, with its three answers", () => {
      const [operation] = newChatMessagesSince.definitions
      const fields = operation.selectionSet.selections.map((field) => field.name.value)
      expect(fields).toEqual([
        'newChatMessagesSince',
        'supportTicketsMenu',
        'countContributionsInProgress',
        'moderationWaiting',
      ])
      expect(
        operation.selectionSet.selections[1].selectionSet.selections.map(
          (field) => field.name.value,
        ),
      ).toEqual(['active', 'inProgress', 'unfinished'])
    })

    it('hands what the field brings to the menu, with every answer', async () => {
      server.answer(
        withSupport(update(), { active: true, inProgress: 2, unfinished: 3 }),
        withSupport(update(), { active: false, inProgress: 0, unfinished: 1 }),
      )
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      expect(menu()).toEqual({ active: true, inProgress: 2, unfinished: 3 })

      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(menu()).toEqual({ active: false, inProgress: 0, unfinished: 1 })
    })

    // null: the server could not count; missing: a server from before K5. Neither takes back
    // what the menu shows, and neither stops the chat.
    it('keeps what was shown where the field comes null or not at all, and the chat goes on', async () => {
      server.answer(
        withSupport(update(), { active: true, inProgress: 2, unfinished: 3 }),
        withSupport(update({ unread: 4 }), null),
        update({ unread: 5 }),
      )
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(menu()).toEqual({ active: true, inProgress: 2, unfinished: 3 })
      expect(chatUnreadConversations.value).toBe(4)

      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(menu()).toEqual({ active: true, inProgress: 2, unfinished: 3 })
      expect(chatUnreadConversations.value).toBe(5)
    })

    it("starts from nothing, and forgets the member's numbers when the beat stops", async () => {
      expect(menu()).toEqual(NOTHING)
      server.answer(withSupport(update(), { active: false, inProgress: 2, unfinished: 3 }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      expect(menu()).toEqual({ active: false, inProgress: 2, unfinished: 3 })

      stopChatUpdates()
      expect(menu()).toEqual(NOTHING)
    })

    // ⛔ An answer still on its way at a sign-out was the member's before: the next one on this
    // device must not read their numbers.
    it('takes nothing from an answer that arrives after the beat stopped', async () => {
      const release = server.hold()
      server.answer(withSupport(update(), { active: true, inProgress: 2, unfinished: 3 }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      stopChatUpdates()
      release()
      await vi.advanceTimersByTimeAsync(0)
      expect(menu()).toEqual(NOTHING)
    })

    /**
     * The support's field has an authorization check of its own on the server. Where only that
     * check fails, the answer carries the chat's part and an error for the support's field: the
     * beat keeps the chat's part and goes on at its pace. The fake client throws as Apollo does
     * for an answer with errors, unless the question asked for them (`errorPolicy: 'all'`).
     */
    describe("an error in the support's field alone", () => {
      const withErrors = (answer, errors) => ({ ...answer, errors })
      const apolloLike = (answers) => {
        const query = vi.fn(async (options) => {
          const answer = answers.shift() ?? update()
          if (answer.errors && options.errorPolicy !== 'all') {
            throw new Error(answer.errors[0].message)
          }
          return answer
        })
        return { query }
      }
      const ERROR = [{ message: '401 Unauthorized', path: ['supportTicketsMenu'] }]

      it('asks with the errors handed back, not thrown', async () => {
        startChatUpdates(server.client)
        await vi.advanceTimersByTimeAsync(0)
        expect(server.query.mock.calls[0][0].errorPolicy).toBe('all')
      })

      it("keeps the chat's answer and its pace, and the support's numbers as they were", async () => {
        const client = apolloLike([
          withSupport(update({ latestId: 20 }), { active: true, inProgress: 2, unfinished: 2 }),
          withErrors(withSupport(update({ latestId: 22, unread: 4 }), null), ERROR),
        ])
        startChatUpdates(client)
        await vi.advanceTimersByTimeAsync(0)
        await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)

        expect(chatUnreadConversations.value).toBe(4)
        expect(menu()).toEqual({ active: true, inProgress: 2, unfinished: 2 })
        // no pause of an error: the next question comes after the usual fifteen seconds
        await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
        expect(client.query).toHaveBeenCalledTimes(3)
        expect(client.query.mock.calls[2][0].variables.afterId).toBe(22)
      })

      it("still counts it as a failed question where the chat's part is missing", async () => {
        const client = apolloLike([
          update({ latestId: 20 }),
          withErrors({ data: null }, [
            { message: 'database gone', path: ['newChatMessagesSince'] },
          ]),
        ])
        startChatUpdates(client)
        await vi.advanceTimersByTimeAsync(0)
        await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
        expect(client.query).toHaveBeenCalledTimes(2)

        // the pause of an error is longer than the usual fifteen seconds
        await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
        expect(client.query).toHaveBeenCalledTimes(2)
      })
    })

    it("asks it at once with pollChatNow, as the chat's", async () => {
      server.answer(update(), withSupport(update(), { active: true, inProgress: 1, unfinished: 1 }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      expect(menu()).toEqual(NOTHING)

      await pollChatNow()
      expect(server.query).toHaveBeenCalledTimes(2)
      expect(menu()).toEqual({ active: true, inProgress: 1, unfinished: 1 })
    })
  })

  /**
   * The mark at "Schöpfen" (Bernd, 16.11.2026): the member's contributions with a question back
   * ride in the same question, as the support's field does. What the field brings goes on to
   * useContributionsInProgress as it came; it is nothing to the chat, and the chat is nothing
   * to it.
   */
  describe('the contributions beside it', () => {
    const withCount = (answer, countContributionsInProgress) => ({
      data: { ...answer.data, countContributionsInProgress },
    })

    it('asks the count as the third root field, after the chat and the support', () => {
      const [operation] = newChatMessagesSince.definitions
      const third = operation.selectionSet.selections[2]
      expect(third.name.value).toBe('countContributionsInProgress')
      // a number, no fields of its own
      expect(third.selectionSet).toBeUndefined()
    })

    it('hands what the field brings to the mark, with every answer', async () => {
      server.answer(withCount(update(), 2), withCount(update(), 0))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      expect(contributionsInProgress.value).toBe(2)

      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(contributionsInProgress.value).toBe(0)
    })

    // null: the server could not count; missing: an answer without the field. Neither takes back
    // what the menu shows, and neither stops the chat.
    it('keeps what was shown where the field comes null or not at all, and the chat goes on', async () => {
      server.answer(
        withCount(update(), 2),
        withCount(update({ unread: 4 }), null),
        update({ unread: 5 }),
      )
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(contributionsInProgress.value).toBe(2)
      expect(chatUnreadConversations.value).toBe(4)

      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(contributionsInProgress.value).toBe(2)
      expect(chatUnreadConversations.value).toBe(5)
    })

    it("forgets the member's number when the beat stops", async () => {
      server.answer(withCount(update(), 3))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      expect(contributionsInProgress.value).toBe(3)

      stopChatUpdates()
      expect(contributionsInProgress.value).toBe(0)
    })

    // ⛔ An answer still on its way at a sign-out was the member's before.
    it('takes nothing from an answer that arrives after the beat stopped', async () => {
      const release = server.hold()
      server.answer(withCount(update(), 3))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      stopChatUpdates()
      release()
      await vi.advanceTimersByTimeAsync(0)
      expect(contributionsInProgress.value).toBe(0)
    })

    it("asks it at once with pollChatNow, as the chat's", async () => {
      server.answer(update(), withCount(update(), 1))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      expect(contributionsInProgress.value).toBe(0)

      await pollChatNow()
      expect(server.query).toHaveBeenCalledTimes(2)
      expect(contributionsInProgress.value).toBe(1)
    })
  })

  /**
   * ⛔ The beat's state lives in this module and nowhere else: the store is written to
   * localStorage in full, so a marker or a message put there would outlive the session. And the
   * beat is a constant of the chat, not CONFIG.AUTO_POLL_INTERVAL (0 on the servers). Only the
   * source can say both -- read with the comments taken out, because the comments name the very
   * words (skill null-af2).
   */
  /**
   * How far the other member of an open conversation of two has read (Chat E-093): the members the
   * watchers name go with the question, and each watcher is handed its own place of the answer --
   * the answer to the question that named it.
   */
  /**
   * The two numbers behind "Admin" ("Meine Gruppen", MG3): what waits for the moderation rides in
   * the same question, as the support's field does. What the field brings goes on to
   * useModerationWaiting as it came; it is nothing to the chat, and the chat is nothing to it.
   */
  describe('the moderation beside it (MG3)', () => {
    const withWaiting = (answer, moderationWaiting) => ({
      data: { ...answer.data, moderationWaiting },
    })
    const shown = () => [moderationCreationsWaiting.value, moderationSupportTicketsWaiting.value]

    it('asks the two numbers as the fourth root field, after the chat, the support and the contributions', () => {
      const [operation] = newChatMessagesSince.definitions
      const fourth = operation.selectionSet.selections[3]
      expect(fourth.name.value).toBe('moderationWaiting')
      expect(fourth.selectionSet.selections.map((field) => field.name.value)).toEqual([
        'creations',
        'supportTickets',
      ])
    })

    it('hands what the field brings to the menu, with every answer', async () => {
      server.answer(
        withWaiting(update(), { creations: 3, supportTickets: 2 }),
        withWaiting(update(), { creations: 1, supportTickets: null }),
      )
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      expect(shown()).toEqual([3, 2])

      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(shown()).toEqual([1, 0])
    })

    // null: nothing to moderate, or the server could not count; missing: an answer without the
    // field. Neither takes back what the menu shows, and neither stops the chat.
    it('keeps what was shown where the field comes null or not at all, and the chat goes on', async () => {
      server.answer(
        withWaiting(update(), { creations: 3, supportTickets: 2 }),
        withWaiting(update({ unread: 4 }), null),
        update({ unread: 5 }),
      )
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(shown()).toEqual([3, 2])
      expect(chatUnreadConversations.value).toBe(4)

      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(shown()).toEqual([3, 2])
      expect(chatUnreadConversations.value).toBe(5)
    })

    it("forgets the member's numbers when the beat stops", async () => {
      server.answer(withWaiting(update(), { creations: 3, supportTickets: 2 }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      expect(shown()).toEqual([3, 2])

      stopChatUpdates()
      expect(shown()).toEqual([0, 0])
    })

    // ⛔ An answer still on its way at a sign-out was the member's before, and the next member on
    // this browser must not see it.
    it('takes nothing from an answer that arrives after the beat stopped', async () => {
      const release = server.hold()
      server.answer(withWaiting(update(), { creations: 3, supportTickets: 2 }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      stopChatUpdates()
      release()
      await vi.advanceTimersByTimeAsync(0)
      expect(shown()).toEqual([0, 0])
    })
  })

  describe('how far the members watched have read', () => {
    const ANNA = { gradidoID: 'anna-id', communityUuid: 'home-uuid' }
    const BEN = { gradidoID: 'ben-id', communityUuid: null }
    const CARL = { gradidoID: 'carl-id', communityUuid: 'other-uuid' }
    let stops = []
    const watch = (ref, listener = vi.fn()) => {
      stops.push(watchChatRead(ref, listener))
      return listener
    }

    afterEach(() => {
      for (const stop of stops) stop()
      stops = []
    })

    it('names the pairs of the watchers in the order they came, and only the pair', async () => {
      watch({ ...ANNA, alias: 'anna', avatar: 'a picture' })
      watch(BEN)
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)

      expect(server.readBys()).toEqual([[ANNA, BEN]])
    })

    it('names nobody while nobody watches, and nobody once the last one went', async () => {
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)
      const stop = watchChatRead(ANNA, vi.fn())
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      stop()
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)

      expect(server.readBys()).toEqual([null, [ANNA], null])
    })

    it('hands each watcher its own place of the answer', async () => {
      const anna = watch(ANNA)
      const ben = watch(BEN)
      server.answer(update({ readUpTo: [7, null] }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)

      expect(anna.mock.calls).toEqual([[7]])
      expect(ben.mock.calls).toEqual([[null]])
    })

    it('hands nothing to a watcher that went while the answer was on its way, and the others their places', async () => {
      const anna = watch(ANNA)
      const ben = vi.fn()
      const stopBen = watchChatRead(BEN, ben)
      const carl = watch(CARL)
      const release = server.hold()
      server.answer(update({ readUpTo: [3, 4, 5] }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)

      stopBen()
      release()
      await vi.advanceTimersByTimeAsync(0)

      expect(anna.mock.calls).toEqual([[3]])
      expect(ben).not.toHaveBeenCalled()
      expect(carl.mock.calls).toEqual([[5]])
    })

    it('hands nothing of an answer to a watcher that came while it was on its way, and names it next', async () => {
      const anna = watch(ANNA)
      const release = server.hold()
      server.answer(update({ readUpTo: [3] }), update({ readUpTo: [3, 9] }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)

      const ben = watch(BEN)
      release()
      await vi.advanceTimersByTimeAsync(0)
      expect(anna.mock.calls).toEqual([[3]])
      expect(ben).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(server.readBys()[1]).toEqual([ANNA, BEN])
      expect(ben.mock.calls).toEqual([[9]])
    })

    it('names only the last ones that came, as many as the server takes', async () => {
      const first = watch({ gradidoID: 'first-id', communityUuid: 'home-uuid' })
      const later = Array.from({ length: CHAT_READ_WATCH_MAX }, (_, n) =>
        watch({ gradidoID: `later-${n}`, communityUuid: 'home-uuid' }),
      )
      server.answer(update({ readUpTo: later.map((_, n) => n + 1) }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)

      expect(server.readBys()[0].map((pair) => pair.gradidoID)).toEqual(
        later.map((_, n) => `later-${n}`),
      )
      expect(first).not.toHaveBeenCalled()
      expect(later.map((listener) => listener.mock.calls)).toEqual(later.map((_, n) => [[n + 1]]))
    })

    // An answer that lands after the member signed out belongs to them, not to whoever is next.
    it('hands an answer that lands after the stop to nobody', async () => {
      const anna = watch(ANNA)
      const release = server.hold()
      server.answer(update({ readUpTo: [3] }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)

      stopChatUpdates()
      release()
      await vi.advanceTimersByTimeAsync(0)

      expect(anna).not.toHaveBeenCalled()
    })

    it('lets a watcher that throws hold up neither the beat nor the others', async () => {
      watch(ANNA, () => {
        throw new Error('broken')
      })
      const ben = watch(BEN)
      server.answer(update({ readUpTo: [3, 4] }))
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)

      expect(ben.mock.calls).toEqual([[4]])
      await vi.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS)
      expect(server.query).toHaveBeenCalledTimes(2)
    })

    // A server from before the ticks answers without the field.
    it('hands null where the answer says nothing', async () => {
      const anna = watch(ANNA)
      server.answer(update())
      startChatUpdates(server.client)
      await vi.advanceTimersByTimeAsync(0)

      expect(anna.mock.calls).toEqual([[null]])
    })
  })

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

    // The server refuses a question naming more members than its CHAT_UPDATE_READ_BY_MAX: every beat
    // with more watchers would fail.
    it('names as many members as the server takes', () => {
      const server = readFileSync(
        join(
          dirname(fileURLToPath(import.meta.url)),
          '../../../backend/src/data/ChatConversation.logic.ts',
        ),
        'utf8',
      )
      const [, serverMax] = server.match(/export const CHAT_UPDATE_READ_BY_MAX = (\d+)\b/)
      expect(CHAT_READ_WATCH_MAX).toBe(Number(serverMax))
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
