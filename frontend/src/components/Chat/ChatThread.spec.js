// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import ChatThread from './ChatThread.vue'
import ChatComposeBar from './ChatComposeBar.vue'
import {
  chatMessagesWithMemberQuery,
  markChatConversationRead,
  newChatMessagesSince,
  sendChatMessage,
} from '@/graphql/chat.graphql'

/**
 * The chat's beat as the thread sees it: whoever listens, and "ask now". A test hands messages
 * to the listeners the way the beat does -- all conversations at once, one array per answer.
 */
const beat = vi.hoisted(() => ({ listeners: new Set(), pollNow: vi.fn(async () => {}) }))
vi.mock('@/composables/useChatUpdates', () => ({
  onChatMessages: (listener) => {
    beat.listeners.add(listener)
    return () => beat.listeners.delete(listener)
  },
  pollChatNow: (...args) => beat.pollNow(...args),
}))
const beatBrings = async (...chatMessages) => {
  for (const listener of [...beat.listeners]) listener(chatMessages)
  await flushPromises()
}

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
    d: (date, format) => `${format}(${date.toISOString()})`,
  }),
}))

/**
 * The server as useQuery shows it, one per mounted thread.
 *
 * ⛔ The stand-in does what the original does BESIDES answering (skill null-q3). Apollo's
 * `fetchMore` asks with the merged variables, hands the answer to `updateQuery` and WRITES the
 * merged page into `result` -- the thread reads the page from there, not from what the call
 * returns. And vue-apollo sets `loading` for a `fetchMore` and never clears it where the
 * fetch fails; the stand-in does the same, so the thread's claim not to rely on `loading` is
 * put to the test.
 */
let server
// Like the original `mutate`, it answers with a promise -- the thread lets a failure go
// through `.catch`, which needs one to hang on. The options (the session clock) are handed on
// only where there are any.
const markRead = vi.fn(async () => ({ data: { markChatConversationRead: true } }))

/**
 * What the server answers to `sendChatMessage`: a test sets the copy it comes back with, or
 * makes it throw. Called with the variables, so a test can say what was asked.
 */
const serverSends = vi.fn()

/**
 * The cache as `update` sees it, as far as the thread uses it.
 *
 * ⛔ The stand-in does what Apollo's cache does besides answering (skill null-q3): it writes
 * what the function returns into the answer of the query it names -- and only where query AND
 * variables are the ones the thread asked with, as the real cache keys its entries by them. A
 * function that returns nothing writes nothing.
 */
const cache = {
  updateQuery: ({ query, variables }, change) => {
    if (query !== chatMessagesWithMemberQuery) return null
    if (JSON.stringify(variables) !== JSON.stringify(server.variables)) return null
    const next = change(server.result.value)
    if (next) server.result.value = next
    return next ?? null
  },
}

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue')
  return {
    useQuery: (document, variables, options) => {
      const result = ref(undefined)
      const loading = ref(true)
      const error = ref(null)
      const fetchMore = vi.fn(async ({ variables: more, updateQuery }) => {
        loading.value = true
        // A test that needs the page to be on its way holds it here until it lets go.
        if (server.gate) await server.gate
        const answer = server.olderPages.shift()
        if (answer instanceof Error) throw answer
        result.value = updateQuery(result.value, {
          fetchMoreResult: { chatMessagesWithMember: answer },
          variables: { ...variables, ...more },
        })
        loading.value = false
        return { data: { chatMessagesWithMember: answer } }
      })
      const refetch = vi.fn(async () => {
        error.value = null
        loading.value = true
        loading.value = false
        return { data: result.value }
      })
      server = { document, variables, options, result, loading, error, fetchMore, refetch }
      server.olderPages = []
      return { result, loading, error, fetchMore, refetch }
    },
    /**
     * `mutate`, `loading` and `error`, as the original has them. The send mutation hands its
     * answer to `update` with the cache above before it settles, as Apollo does; it throws where
     * the server answered with an error, as vue-apollo does without an error handler.
     */
    useMutation: (document) => {
      const loading = ref(false)
      const error = ref(null)
      if (document !== sendChatMessage) {
        return {
          loading,
          error,
          mutate: (variables, options) =>
            options ? markRead(document, variables, options) : markRead(document, variables),
        }
      }
      const mutate = async (variables, options = {}) => {
        loading.value = true
        error.value = null
        try {
          const data = { sendChatMessage: await serverSends(variables) }
          options.update?.(cache, { data })
          return { data }
        } catch (failure) {
          error.value = failure
          throw failure
        } finally {
          loading.value = false
        }
      }
      return { loading, error, mutate }
    },
    // The same cache as `update` gets: an arrival goes into the thread the way one's own copy
    // does.
    useApolloClient: () => ({ client: { cache } }),
  }
})

const LENA = { communityUuid: 'home-uuid', gradidoID: 'lena-id' }

/** A message as the server sends it; `n` is its id, and its minute on the given day. */
const message = (n, { day = '2026-09-22', mine = n % 2 === 0 } = {}) => ({
  id: n,
  messageUuid: `uuid-${n}`,
  conversationId: 3,
  sender: mine ? { communityUuid: 'home-uuid', gradidoID: 'me-id' } : LENA,
  mine,
  subject: null,
  body: `message ${n}`,
  createdAt: `${day}T10:${String(n % 60).padStart(2, '0')}:00.000Z`,
  deliveryState: mine ? 'DELIVERED' : null,
  notify: mine ? 'NONE' : null,
  // No mail asked for, so nothing became of one (E-034); null on the other side's anyway.
  mailState: null,
})

const page = (ids, { hasMore = false, day, mutedByMe = false } = {}) => ({
  hasMore,
  mutedByMe,
  messages: ids.map((n) => message(n, { day })),
})

/**
 * One's own copy, as `sendChatMessage` answers: the highest id on this server. `mailState` as the
 * server fills it (E-034): MAILED, MUTED, or null where no mail was asked for.
 */
const ownCopy = (
  n,
  body,
  { deliveryState = 'DELIVERED', notify = 'NONE', mailState = null } = {},
) => ({
  ...message(n, { day: '2026-09-24', mine: true }),
  body,
  deliveryState,
  notify,
  mailState,
})

/**
 * A browser's layout, as far as the thread's scrolling needs one: every bubble 40 px high in
 * a box 200 px high, and `scrollTop` held within what can be scrolled. jsdom lays nothing out,
 * so without this every scroll height would be 0 and every position the same.
 *
 * Two switches for what the probe measured in a real browser: `hidden` is the window not
 * shown yet (`display: none`, so everything 0 high), `extra` a line the content gains late
 * (a font that arrives after the page).
 */
const ROW = 40
const BOX = 200
const layout = { hidden: false, extra: 0 }
const scrollTops = new WeakMap()
const isThreadBox = (element) => element.classList?.contains('chat-thread-scroll')

/**
 * ResizeObserver, which jsdom does not have: it notes what it is asked to watch, and a test
 * says when sizes changed -- the moment a browser would call back.
 */
const watchers = new Set()
class ResizeObserverStandIn {
  constructor(callback) {
    this.callback = callback
    this.watched = []
    watchers.add(this)
  }

  observe(element) {
    this.watched.push(element)
  }

  disconnect() {
    watchers.delete(this)
  }
}
const sizesChanged = () => {
  for (const watcher of watchers) watcher.callback([])
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStandIn)
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get() {
      if (!isThreadBox(this) || layout.hidden) return 0
      const bubbles = this.querySelectorAll('[data-test="chat-bubble"]').length
      return Math.max(BOX, bubbles * ROW + layout.extra)
    },
  })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get() {
      return isThreadBox(this) && !layout.hidden ? BOX : 0
    },
  })
  Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
    configurable: true,
    get() {
      return scrollTops.get(this) ?? 0
    },
    set(value) {
      const most = Math.max(0, this.scrollHeight - this.clientHeight)
      scrollTops.set(this, Math.min(Math.max(0, value), most))
    },
  })
})

afterAll(() => {
  vi.unstubAllGlobals()
  delete HTMLElement.prototype.scrollHeight
  delete HTMLElement.prototype.clientHeight
  delete HTMLElement.prototype.scrollTop
})

describe('ChatThread', () => {
  let wrapper

  const mountThread = (member = LENA, options = {}) => {
    wrapper = mount(ChatThread, {
      props: { member, alias: 'Lena' },
      global: {
        stubs: { IMdiChatOutline: true, IMdiEmailOutline: true, IMdiSend: true },
      },
      ...options,
    })
    return wrapper
  }

  /** The first page lands, as the network delivers it: after the thread is on screen. */
  const arrive = async (answer) => {
    server.result.value = { chatMessagesWithMember: answer }
    server.loading.value = false
    await flushPromises()
  }

  const bubbleTexts = () =>
    wrapper.findAll('[data-test="chat-bubble"] .chat-message-text').map((b) => b.text())
  const log = () => wrapper.find('[data-test="chat-thread-log"]')
  const older = () => wrapper.find('[data-test="chat-thread-older"]')

  afterEach(() => {
    wrapper?.unmount()
    markRead.mockClear()
    serverSends.mockReset()
    beat.pollNow.mockClear()
    layout.hidden = false
    layout.extra = 0
    delete document.hidden
  })

  /** The page out of sight (a tab in the background) or back, as the browser says it. */
  const pageHidden = (value) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => value })
    document.dispatchEvent(new Event('visibilitychange'))
  }

  const bar = () => wrapper.findComponent(ChatComposeBar)
  const field = () => wrapper.find('[data-test="chat-compose-field"]')

  /** Types into the bar and presses its button, as a member does. */
  const write = async (text, { tick = false } = {}) => {
    await field().setValue(text)
    if (tick) await wrapper.find('[data-test="chat-compose-email"]').setValue(true)
    await wrapper.find('[data-test="chat-compose-send"]').trigger('click')
    await flushPromises()
  }

  describe('the question it asks', () => {
    // KF-004: the person is named by the pair; the page is the server's own default of 50.
    it('asks for the thread by the pair, fifty at a time', () => {
      mountThread()

      expect(server.document).toBe(chatMessagesWithMemberQuery)
      expect(server.variables).toEqual({
        ref: { gradidoID: 'lena-id', communityUuid: 'home-uuid' },
        limit: 50,
      })
    })

    // A member off a booking row may come without a community; the server reads null as its
    // own, so null is sent rather than nothing.
    it('sends a null community where the member carries none', () => {
      mountThread({ gradidoID: 'lena-id' })
      expect(server.variables.ref).toEqual({ gradidoID: 'lena-id', communityUuid: null })
    })

    it('asks the server fresh, not the cache', () => {
      mountThread()
      expect(server.options).toEqual({ fetchPolicy: 'network-only' })
    })
  })

  describe('before, without and instead of a thread', () => {
    it('shows only its empty box while the first page is on its way', () => {
      mountThread()

      expect(wrapper.find('[data-test="chat-thread-loading"]').exists()).toBe(true)
      expect(log().exists()).toBe(false)
      expect(wrapper.find('[data-test="chat-thread-empty"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="chat-thread-error"]').exists()).toBe(false)
      // Nothing to answer yet.
      expect(bar().exists()).toBe(false)
    })

    // Mockup view 2: nothing written yet between the two.
    it('says so quietly when nothing has been written yet', async () => {
      mountThread()
      await arrive(page([]))

      expect(wrapper.find('[data-test="chat-thread-empty"]').text()).toBe('chatThread.empty')
      expect(log().exists()).toBe(false)
    })

    it('says so quietly when the thread cannot be loaded', async () => {
      mountThread()
      server.error.value = new Error('Network error')
      server.loading.value = false
      await flushPromises()

      expect(wrapper.find('[data-test="chat-thread-error"]').text()).toBe('chatThread.notReachable')
      expect(log().exists()).toBe(false)
    })
  })

  describe('the thread', () => {
    // E-018: the order in which they arrived on this server -- nothing is sorted.
    it('lists the messages in the order they came, the oldest first', async () => {
      mountThread()
      await arrive(page([1, 2, 3, 4]))

      expect(bubbleTexts()).toEqual(['message 1', 'message 2', 'message 3', 'message 4'])
    })

    it('puts the date over every day it reaches into, the first one included', async () => {
      mountThread()
      await arrive({
        hasMore: false,
        messages: [
          message(1, { day: '2026-09-22' }),
          message(2, { day: '2026-09-22' }),
          message(3, { day: '2026-09-23' }),
        ],
      })

      const days = wrapper.findAll('[data-test="chat-thread-day"]')
      expect(days.map((day) => day.text())).toEqual([
        'short(2026-09-22T10:01:00.000Z)',
        'short(2026-09-23T10:03:00.000Z)',
      ])
      expect(days[0].find('time').attributes('datetime')).toBe('2026-09-22')
      // Each day holds its own messages, in a list of its own.
      const lists = wrapper.findAll('.chat-thread-list')
      expect(lists.map((list) => list.findAll('[data-test="chat-bubble"]').length)).toEqual([2, 1])
    })

    /**
     * A region named after the person, focusable so a keyboard can scroll it.
     *
     * ⛔ And NOT a live one. The only thing ever added to it in this step is an older page, at
     * the reader's own request -- a live region would read up to fifty chat messages aloud
     * after one press (coderabbit, #3970).
     */
    it('is a named region that a keyboard can reach, and reads nothing aloud', async () => {
      mountThread()
      await arrive(page([1, 2]))

      expect(log().attributes('role')).toBe('region')
      expect(log().attributes('aria-live')).toBeUndefined()
      expect(log().attributes('aria-label')).toBe('chatThread.label {"name":"Lena"}')
      expect(log().attributes('tabindex')).toBe('0')
    })

    it('opens at the newest message, at the bottom', async () => {
      mountThread()
      await arrive(page([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))

      const box = log().element
      expect(box.scrollHeight).toBe(400)
      expect(box.scrollTop).toBe(box.scrollHeight - box.clientHeight)
    })

    /**
     * ⛔ Measured in the probe: the page can land while the window is not shown yet
     * (`display: none`, zero high). The scroll to the bottom then does nothing, and the thread
     * opened at its OLDEST message in two runs of four. It follows the bottom once the box has
     * a size.
     */
    it('still opens at the newest when the window is shown after the page landed', async () => {
      layout.hidden = true
      mountThread()
      await arrive(page([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
      expect(log().element.scrollTop).toBe(0)

      layout.hidden = false
      sizesChanged()

      const box = log().element
      expect(box.scrollTop).toBe(200)
      expect(box.scrollTop).toBe(box.scrollHeight - box.clientHeight)
    })

    // A font that arrives after the page makes the content taller by a line; the bottom stays.
    it('stays at the newest when the content grows late', async () => {
      mountThread()
      await arrive(page([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
      layout.extra = 20
      sizesChanged()

      expect(log().element.scrollTop).toBe(220)
    })

    /**
     * ⛔ The browser reports the thread's own scroll a frame late -- measured in the probe,
     * after a font had made the content 20 px taller. Read against the new height, that report
     * looked like the reader scrolling away, and the thread stopped following on its own doing.
     */
    it('is not put off by the late report of its own scroll', async () => {
      mountThread()
      await arrive(page([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
      layout.extra = 20
      await log().trigger('scroll')
      sizesChanged()

      expect(log().element.scrollTop).toBe(220)
    })

    // …but not once the reader has gone elsewhere: a late change does not pull them down.
    it('does not pull the reader back down once they scrolled up', async () => {
      mountThread()
      await arrive(page([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
      const box = log().element
      box.scrollTop = 40
      await log().trigger('scroll')
      layout.extra = 20
      sizesChanged()

      expect(box.scrollTop).toBe(40)
    })

    it('watches the box and what it holds, and stops watching when the thread goes', async () => {
      mountThread()
      await arrive(page([1, 2]))

      expect(watchers.size).toBe(1)
      const [watcher] = watchers
      expect(watcher.watched).toEqual([log().element, wrapper.find('.chat-thread-content').element])
      wrapper.unmount()
      wrapper = null
      expect(watchers.size).toBe(0)
    })
  })

  describe('the read pointer', () => {
    // E-017: the marker is the row number, the highest one the first page brought.
    it('moves it once, to the highest id on screen', async () => {
      mountThread()
      await arrive(page([4, 5, 9]))

      expect(markRead).toHaveBeenCalledTimes(1)
      expect(markRead).toHaveBeenCalledWith(markChatConversationRead, {
        ref: { gradidoID: 'lena-id', communityUuid: 'home-uuid' },
        upToMessageId: 9,
      })
    })

    it('leaves it alone where there is nothing to have read', async () => {
      mountThread()
      await arrive(page([]))
      expect(markRead).not.toHaveBeenCalled()
    })

    // An older page lies below the pointer anyway; moving it again would be a second call
    // for nothing.
    it('does not move it again for an older page', async () => {
      mountThread()
      await arrive(page([11, 12], { hasMore: true }))
      server.olderPages.push(page([9, 10]))
      await older().trigger('click')
      await flushPromises()

      expect(bubbleTexts()).toEqual(['message 9', 'message 10', 'message 11', 'message 12'])
      expect(markRead).toHaveBeenCalledTimes(1)
      expect(markRead.mock.calls[0][1].upToMessageId).toBe(12)
    })

    // A marking that fails leaves the messages unread until the next opening -- nothing the
    // member waits on, and nothing that may escape as an unhandled rejection.
    it('lets a failed marking go without a word', async () => {
      markRead.mockRejectedValueOnce(new Error('nope'))
      mountThread()
      await arrive(page([1, 2]))

      expect(markRead).toHaveBeenCalledTimes(1)
      expect(log().exists()).toBe(true)
      // …and asks the beat nothing: the mark in the menu has nothing new to say.
      expect(beat.pollNow).not.toHaveBeenCalled()
    })

    // The mark in the menu is right within a second, not only with the next beat.
    it('asks the beat at once once the server has the pointer', async () => {
      mountThread()
      await arrive(page([4, 5, 9]))

      expect(beat.pollNow).toHaveBeenCalledTimes(1)
      expect(markRead.mock.invocationCallOrder[0]).toBeLessThan(
        beat.pollNow.mock.invocationCallOrder[0],
      )
    })

    /**
     * E-017: the pointer is the highest id SHOWN. A thread that opens in a tab in the background
     * (a link out of a mail, opened behind the mail) shows nothing to anybody yet -- the pointer
     * waits until the page is in sight, and then it is no doing of the member's: quiet.
     */
    it('waits for the page to come into sight before it moves the pointer', async () => {
      pageHidden(true)
      mountThread()
      await arrive(page([4, 5, 9]))
      expect(markRead).not.toHaveBeenCalled()

      pageHidden(false)
      await flushPromises()

      expect(markRead).toHaveBeenCalledTimes(1)
      expect(markRead).toHaveBeenCalledWith(
        markChatConversationRead,
        { ref: { gradidoID: 'lena-id', communityUuid: 'home-uuid' }, upToMessageId: 9 },
        { context: { renewSession: false } },
      )
      // Once: coming back into sight a second time finds nothing waiting.
      pageHidden(true)
      pageHidden(false)
      await flushPromises()
      expect(markRead).toHaveBeenCalledTimes(1)
    })
  })

  /**
   * P4: the other side's messages arrive at the bottom by themselves -- the chat's beat hands
   * over everything new, for all conversations at once, and the thread takes its own.
   */
  describe('messages that arrive by themselves', () => {
    const status = () => wrapper.find('[data-test="chat-thread-sent"]')

    it('hangs a message of its conversation under the thread and goes down to it', async () => {
      mountThread()
      await arrive(page([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))

      await beatBrings(message(11))

      expect(bubbleTexts().at(-1)).toBe('message 11')
      expect(bubbleTexts()).toHaveLength(11)
      const box = log().element
      expect(box.scrollTop).toBe(box.scrollHeight - box.clientHeight)
      // Into the page on screen, without asking the server again.
      expect(server.result.value.chatMessagesWithMember.messages.at(-1).id).toBe(11)
      expect(server.fetchMore).not.toHaveBeenCalled()
      expect(server.refetch).not.toHaveBeenCalled()
    })

    it('does not pull the reader down who scrolled up', async () => {
      mountThread()
      await arrive(page([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
      const box = log().element
      box.scrollTop = 40
      await log().trigger('scroll')

      await beatBrings(message(11))

      expect(bubbleTexts().at(-1)).toBe('message 11')
      expect(box.scrollTop).toBe(40)
    })

    it('leaves the messages of other conversations alone', async () => {
      mountThread()
      await arrive(page([1, 2, 3]))
      markRead.mockClear()

      await beatBrings({ ...message(11), conversationId: 4 })

      expect(bubbleTexts()).toEqual(['message 1', 'message 2', 'message 3'])
      expect(markRead).not.toHaveBeenCalled()
      expect(status().text()).toBe('')
    })

    // The beat brings one's own copy once more after sending, and the known limit of the
    // marker can bring any message twice.
    it('does not hang in a message it holds already', async () => {
      serverSends.mockResolvedValue(ownCopy(12, 'Bis gleich'))
      mountThread()
      await arrive(page([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]))
      await write('Bis gleich')
      expect(bubbleTexts()).toHaveLength(12)

      await beatBrings(message(11), ownCopy(12, 'Bis gleich'))

      expect(bubbleTexts()).toHaveLength(12)
      expect(server.result.value.chatMessagesWithMember.messages.map((m) => m.id)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
      ])
    })

    // E-018: the order in which they came to this server is the order of their ids -- a message
    // stored while one's own was on its way stands before it, not after.
    it('puts every message in the order of its id', async () => {
      serverSends.mockResolvedValue(ownCopy(20, 'Meine'))
      mountThread()
      await arrive(page([1, 3, 5]))
      await write('Meine')

      await beatBrings(message(19))

      expect(bubbleTexts().slice(-2)).toEqual(['message 19', 'Meine'])
    })

    /**
     * ⛔ Not below the oldest message on screen while there are older pages: hung in, it would
     * stand in front of a gap that "load older" could never fill -- it asks for what lies below
     * the smallest id. It is there when the older pages are loaded.
     */
    it('leaves what belongs to an older page to that page', async () => {
      mountThread()
      await arrive(page([11, 13], { hasMore: true }))

      await beatBrings(message(5), message(15))

      expect(bubbleTexts()).toEqual(['message 11', 'message 13', 'message 15'])
    })

    /**
     * E-017: the pointer is the highest id shown. The window is open (the thread exists only
     * while it is) and the page in sight: the pointer moves to the newest arrival, quietly --
     * the member did nothing -- and the beat is asked at once, so the mark in the menu is right.
     */
    it('moves the read pointer to the newest arrival, quietly, and asks the beat at once', async () => {
      mountThread()
      await arrive(page([1, 3]))
      markRead.mockClear()
      beat.pollNow.mockClear()

      await beatBrings(message(5), message(7))

      expect(markRead).toHaveBeenCalledTimes(1)
      expect(markRead).toHaveBeenCalledWith(
        markChatConversationRead,
        { ref: { gradidoID: 'lena-id', communityUuid: 'home-uuid' }, upToMessageId: 7 },
        { context: { renewSession: false } },
      )
      expect(beat.pollNow).toHaveBeenCalledTimes(1)
    })

    it('does not move the pointer while the page is out of sight, and does once it is back', async () => {
      mountThread()
      await arrive(page([1, 3]))
      markRead.mockClear()
      pageHidden(true)

      await beatBrings(message(5))

      // Shown in the thread -- but to nobody yet.
      expect(bubbleTexts().at(-1)).toBe('message 5')
      expect(markRead).not.toHaveBeenCalled()

      pageHidden(false)
      await flushPromises()
      expect(markRead).toHaveBeenCalledTimes(1)
      expect(markRead.mock.calls[0][1].upToMessageId).toBe(5)
    })

    it("says nothing and moves nothing for one's own copies that arrive", async () => {
      mountThread()
      await arrive(page([1, 3]))
      markRead.mockClear()

      await beatBrings(message(4, { mine: true }))

      expect(bubbleTexts().at(-1)).toBe('message 4')
      expect(markRead).not.toHaveBeenCalled()
      expect(status().text()).toBe('')
    })

    /**
     * ⛔ The status line, not a live log: whoever cannot see the bubble hears "new message from
     * Lena", once, and a press on "load older" still reads nothing aloud (LOG-031).
     */
    it('says "new message from" in the status line, and the region stays a quiet one', async () => {
      mountThread()
      await arrive(page([1, 3]))

      await beatBrings(message(5))

      expect(status().attributes('role')).toBe('status')
      expect(status().text()).toBe('chatThread.arrived {"name":"Lena"}')
      expect(log().attributes('role')).toBe('region')
      expect(log().attributes('aria-live')).toBeUndefined()
    })

    it('says it again for the next message from the same person', async () => {
      mountThread()
      await arrive(page([1, 3]))
      await beatBrings(message(5))
      const seen = []
      const watcher = new MutationObserver(() => seen.push(status().text()))
      watcher.observe(status().element, { childList: true, characterData: true, subtree: true })

      await beatBrings(message(7))
      watcher.disconnect()

      // Emptied first, then said: the same words twice would change nothing in the page.
      expect(seen).toContain('')
      expect(status().text()).toBe('chatThread.arrived {"name":"Lena"}')
    })

    // The first message makes the conversation: the sentence gives way to the box, and the
    // window hears of it (the bell appears).
    it("turns an empty thread into a thread with the other side's first message", async () => {
      mountThread()
      await arrive(page([]))

      await beatBrings(message(1))

      expect(bubbleTexts()).toEqual(['message 1'])
      expect(bar().props('first')).toBe(false)
      expect(wrapper.emitted('chatConversation').at(-1)).toEqual([
        { exists: true, mutedByMe: false },
      ])
    })

    /**
     * In an empty thread there is no conversation id to go by: the first message is known by
     * the pair of its writer, written as the window keys the thread -- a member off a booking
     * row names no community, and the sender does.
     */
    it('knows that first message by the pair the window keys the thread with', async () => {
      const member = { gradidoID: 'lena-id' }
      mountThread(member, { props: { member, alias: 'Lena', memberKey: 'home-uuid/lena-id' } })
      await arrive(page([]))

      await beatBrings({
        ...message(1),
        sender: { communityUuid: 'HOME-UUID', gradidoID: 'Lena-ID' },
      })

      expect(bubbleTexts()).toEqual(['message 1'])
    })

    it('takes no first message from somebody else', async () => {
      mountThread()
      await arrive(page([]))

      await beatBrings({
        ...message(1),
        sender: { communityUuid: 'home-uuid', gradidoID: 'tom-id' },
      })

      expect(bubbleTexts()).toEqual([])
      expect(wrapper.find('[data-test="chat-thread-empty"]').exists()).toBe(true)
    })

    it('keeps what arrives before the first page, and hangs it in once the page is there', async () => {
      mountThread()
      await beatBrings(message(11))

      await arrive(page([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))

      expect(bubbleTexts().at(-1)).toBe('message 11')
      expect(bubbleTexts()).toHaveLength(11)
    })

    /**
     * ⛔ Not while an older page is on its way: its landing puts the reader's place back, and a
     * message hung in between would take that place for its own -- the reader would be thrown
     * by the height of the older page. It waits, and comes after.
     */
    it('waits for an older page on its way, and the reader keeps their place', async () => {
      mountThread()
      await arrive(page([6, 7, 8, 9, 10, 11, 12, 13, 14, 15], { hasMore: true }))
      const box = log().element
      box.scrollTop = 0
      server.olderPages.push(page([1, 2, 3, 4, 5], { hasMore: true }))
      let letGo
      server.gate = new Promise((resolve) => {
        letGo = resolve
      })

      await older().trigger('click')
      await beatBrings(message(17))
      expect(bubbleTexts()).toHaveLength(10)

      server.gate = null
      letGo()
      await flushPromises()

      // As in 'keeps the reader where they were': 200 px down, where message 6 starts.
      expect(box.scrollTop).toBe(200)
      expect(bubbleTexts()).toHaveLength(16)
      expect(bubbleTexts().at(-1)).toBe('message 17')
    })

    it('takes nothing where the thread could not be loaded', async () => {
      mountThread()
      server.error.value = new Error('Network error')
      server.loading.value = false
      await flushPromises()

      await beatBrings(message(11))

      expect(wrapper.find('[data-test="chat-thread-error"]').exists()).toBe(true)
      expect(markRead).not.toHaveBeenCalled()
    })

    it('stops listening when it goes', async () => {
      mountThread()
      expect(beat.listeners.size).toBe(1)

      wrapper.unmount()
      wrapper = null

      expect(beat.listeners.size).toBe(0)
    })
  })

  describe('older messages', () => {
    it('offers them only while there are more', async () => {
      mountThread()
      await arrive(page([1, 2]))
      expect(older().exists()).toBe(false)
      wrapper.unmount()

      mountThread()
      await arrive(page([3, 4], { hasMore: true }))
      expect(older().text()).toBe('chatThread.loadOlder')
      expect(older().attributes('type')).toBe('button')
    })

    it('asks for the page before the smallest id on screen and puts it in front', async () => {
      mountThread()
      await arrive(page([11, 12, 13], { hasMore: true }))
      server.olderPages.push(page([8, 9, 10], { hasMore: true }))
      await older().trigger('click')
      await flushPromises()

      expect(server.fetchMore).toHaveBeenCalledTimes(1)
      expect(server.fetchMore.mock.calls[0][0].variables).toEqual({ before: 11 })
      expect(bubbleTexts()).toEqual([
        'message 8',
        'message 9',
        'message 10',
        'message 11',
        'message 12',
        'message 13',
      ])
      // The next press asks before the NEW smallest id.
      server.olderPages.push(page([7]))
      await older().trigger('click')
      await flushPromises()
      expect(server.fetchMore.mock.calls[1][0].variables).toEqual({ before: 8 })
      // …and the last page says there is no more, so the offer goes.
      expect(older().exists()).toBe(false)
    })

    /**
     * ⛔ The reader's place stays where it was: what was at the top of the box before is at
     * the top after, with the older messages above it. Without the correction the box would
     * stay at 0 -- showing the oldest of the new page, not what the reader was looking at.
     */
    it('keeps the reader where they were when older messages come in', async () => {
      mountThread()
      await arrive(page([6, 7, 8, 9, 10, 11, 12, 13, 14, 15], { hasMore: true }))
      const box = log().element
      box.scrollTop = 0 // scrolled all the way up, to the button
      server.olderPages.push(page([1, 2, 3, 4, 5], { hasMore: true }))

      await older().trigger('click')
      await flushPromises()

      // 15 bubbles now, 600 px; the first of the old page (message 6) starts at 200.
      expect(box.scrollHeight).toBe(600)
      expect(box.scrollTop).toBe(200)
    })

    /**
     * ⚠️ A failed page leaves the thread standing -- while vue-apollo's `loading` stays true,
     * as it does after a failed `fetchMore`. The offer stays, to be pressed again.
     */
    it('keeps the thread and says so when an older page cannot be loaded', async () => {
      mountThread()
      await arrive(page([5, 6], { hasMore: true }))
      server.olderPages.push(new Error('Network error'))

      await older().trigger('click')
      await flushPromises()

      expect(server.loading.value).toBe(true)
      expect(bubbleTexts()).toEqual(['message 5', 'message 6'])
      const failed = wrapper.find('[data-test="chat-thread-older-failed"]')
      expect(failed.text()).toBe('chatThread.notReachable')
      // Said aloud on its own: the region around it announces nothing.
      expect(failed.attributes('role')).toBe('alert')
      expect(older().attributes('aria-disabled')).toBe('false')
    })

    // A second press while a page is on its way asks nothing more.
    it('turns a second press away while a page is on its way', async () => {
      mountThread()
      await arrive(page([5, 6], { hasMore: true }))
      server.olderPages.push(page([3, 4], { hasMore: true }))
      let letGo
      server.gate = new Promise((resolve) => {
        letGo = resolve
      })

      await older().trigger('click')
      expect(older().attributes('aria-disabled')).toBe('true')
      await older().trigger('click')
      letGo()
      await flushPromises()

      expect(server.fetchMore).toHaveBeenCalledTimes(1)
      expect(older().attributes('aria-disabled')).toBe('false')
    })

    // The button goes once the first message is in. A keyboard that pressed it would be
    // nowhere; the focus goes to the thread instead.
    it('hands the focus to the thread when the last older page is in', async () => {
      mountThread(LENA, { attachTo: document.body })
      await arrive(page([5, 6], { hasMore: true }))
      server.olderPages.push(page([3, 4]))
      older().element.focus()
      expect(document.activeElement).toBe(older().element)

      await older().trigger('click')
      await flushPromises()

      expect(older().exists()).toBe(false)
      expect(document.activeElement).toBe(log().element)
    })
  })

  describe('the compose bar', () => {
    // Under a thread and under a thread that has nothing yet -- and there it is the first
    // message, which goes by mail in any case (E-024).
    it('stands under a thread, and under an empty one as the first message', async () => {
      mountThread()
      await arrive(page([1, 2]))
      expect(bar().exists()).toBe(true)
      expect(bar().props('first')).toBe(false)
      expect(bar().props('name')).toBe('Lena')
      wrapper.unmount()

      mountThread()
      await arrive(page([]))
      expect(bar().exists()).toBe(true)
      expect(bar().props('first')).toBe(true)
    })

    // Where the thread could not be loaded there is nothing to answer, and nothing to know
    // about whether this would be the first message.
    it('does not stand where the thread could not be loaded', async () => {
      mountThread()
      server.error.value = new Error('Network error')
      server.loading.value = false
      await flushPromises()

      expect(bar().exists()).toBe(false)
    })
  })

  describe('writing', () => {
    // KF-004: the person by the pair, as the thread asks; the text and the wish as the bar
    // hands them over.
    it('sends by the pair, with the text and the wish', async () => {
      serverSends.mockResolvedValue(ownCopy(99, 'Hallo Lena'))
      mountThread()
      await arrive(page([1, 2]))

      await write('Hallo Lena', { tick: true })

      expect(serverSends).toHaveBeenCalledWith({
        ref: { gradidoID: 'lena-id', communityUuid: 'home-uuid' },
        body: 'Hallo Lena',
        notify: 'EMAIL',
      })
    })

    it('sends a null community where the member carries none', async () => {
      serverSends.mockResolvedValue(ownCopy(99, 'Hallo'))
      mountThread({ gradidoID: 'lena-id' })
      await arrive(page([1, 2]))

      await write('Hallo')

      expect(serverSends.mock.calls[0][0].ref).toEqual({
        gradidoID: 'lena-id',
        communityUuid: null,
      })
    })

    /**
     * The answer is one's own copy, and it goes under the thread without asking the server
     * again: the page on screen gets it at the bottom -- the highest id, the order of arrival
     * (E-018) -- and the thread goes down to it.
     */
    it('hangs the own copy under the thread and goes down to it', async () => {
      serverSends.mockResolvedValue(ownCopy(99, 'Bis Samstag!'))
      mountThread()
      await arrive(page([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
      const box = log().element
      box.scrollTop = 0
      await log().trigger('scroll') // the reader had scrolled up

      await write('Bis Samstag!')

      expect(bubbleTexts().at(-1)).toBe('Bis Samstag!')
      expect(bubbleTexts()).toHaveLength(11)
      expect(server.result.value.chatMessagesWithMember.messages.at(-1).id).toBe(99)
      expect(box.scrollTop).toBe(box.scrollHeight - box.clientHeight)
      // Nothing asked a second time.
      expect(server.fetchMore).not.toHaveBeenCalled()
      expect(server.refetch).not.toHaveBeenCalled()
    })

    // The first message makes the conversation: the sentence gives way to the box.
    it('turns an empty thread into a thread with the first message', async () => {
      serverSends.mockResolvedValue(ownCopy(99, 'Hallo Lena', { notify: 'EMAIL' }))
      mountThread()
      await arrive(page([]))

      await write('Hallo Lena')

      expect(log().exists()).toBe(true)
      expect(bubbleTexts()).toEqual(['Hallo Lena'])
      expect(bar().props('first')).toBe(false)
      expect(wrapper.find('[data-test="chat-compose-email"]').exists()).toBe(true)
    })

    /**
     * ⛔ A delivery that failed across the border is no error (E-019): the copy comes back
     * FAILED and is a bubble with its word; the bar lets go of its text as for any message
     * that went out.
     */
    it('shows a copy that came back not delivered as a bubble with its word', async () => {
      serverSends.mockResolvedValue(ownCopy(99, 'Kommt sie an?', { deliveryState: 'FAILED' }))
      mountThread()
      await arrive(page([1, 2]))

      await write('Kommt sie an?')

      const last = wrapper.findAll('[data-test="chat-bubble"]').at(-1)
      expect(last.find('[data-test="chat-bubble-state"]').text()).toBe('chatThread.failed')
      expect(wrapper.find('[data-test="chat-compose-failed"]').exists()).toBe(false)
      expect(field().element.value).toBe('')
    })

    // Only an error from the server is an error: the text stays, a line says so, and the
    // thread gets nothing.
    it('keeps the text and adds nothing where the server says no', async () => {
      serverSends.mockRejectedValue(new Error('CHAT_MESSAGE_NOT_SENT: NOT_STORED'))
      mountThread()
      await arrive(page([1, 2]))

      await write('Geht nicht durch')

      expect(bubbleTexts()).toEqual(['message 1', 'message 2'])
      expect(field().element.value).toBe('Geht nicht durch')
      expect(wrapper.find('[data-test="chat-compose-failed"]').attributes('role')).toBe('alert')
      expect(wrapper.find('[data-test="chat-thread-sent"]').text()).toBe('')
    })

    // A second message waits for the first: the bar hears it is on its way.
    it('tells the bar while a message is on its way', async () => {
      let letGo
      serverSends.mockImplementation(
        () =>
          new Promise((resolve) => {
            letGo = () => resolve(ownCopy(99, 'Eins'))
          }),
      )
      mountThread()
      await arrive(page([1, 2]))

      await field().setValue('Eins')
      await wrapper.find('[data-test="chat-compose-send"]').trigger('click')
      expect(bar().props('sending')).toBe(true)
      letGo()
      await flushPromises()

      expect(bar().props('sending')).toBe(false)
      expect(serverSends).toHaveBeenCalledTimes(1)
    })

    /**
     * "Sent", for the ear: a status that is always in the page, so the word is announced when
     * it is put in. Where the copy came back not delivered it says what the bubble says.
     */
    it('says "sent" for a screen reader, and "not delivered" where it was not', async () => {
      serverSends.mockResolvedValueOnce(ownCopy(99, 'Eins'))
      serverSends.mockResolvedValueOnce(ownCopy(100, 'Zwei', { deliveryState: 'FAILED' }))
      mountThread()
      await arrive(page([1, 2]))
      const status = wrapper.find('[data-test="chat-thread-sent"]')
      expect(status.attributes('role')).toBe('status')
      expect(status.text()).toBe('')

      await write('Eins')
      expect(status.text()).toBe('chatThread.sent')

      await write('Zwei')
      expect(status.text()).toBe('chatThread.failed')
    })

    // ⛔ One's own messages never count as unread: sending moves no pointer -- not from an
    // empty thread, not from a thread whose pointer was moved on opening.
    it("does not move the read pointer for one's own message", async () => {
      serverSends.mockResolvedValue(ownCopy(99, 'Hallo'))
      mountThread()
      await arrive(page([]))
      await write('Hallo')
      expect(markRead).not.toHaveBeenCalled()
      wrapper.unmount()

      serverSends.mockResolvedValue(ownCopy(99, 'Hallo'))
      mountThread()
      await arrive(page([4, 5]))
      await write('Hallo')
      expect(markRead).toHaveBeenCalledTimes(1)
      expect(markRead.mock.calls[0][1].upToMessageId).toBe(5)
    })
  })

  describe('what it tells the window', () => {
    // E-017: one question on opening answers the thread and the bell.
    it('says whether there is a conversation and whether it is muted, once the page is in', async () => {
      mountThread()
      expect(wrapper.emitted('chatConversation')).toBeUndefined()

      await arrive(page([1, 2], { mutedByMe: true }))

      expect(wrapper.emitted('chatConversation')).toEqual([[{ exists: true, mutedByMe: true }]])
    })

    it('says there is none where nothing has been written, or the thread is out of reach', async () => {
      mountThread()
      await arrive(page([]))
      expect(wrapper.emitted('chatConversation')).toEqual([[{ exists: false, mutedByMe: false }]])
      wrapper.unmount()

      mountThread()
      server.error.value = new Error('Network error')
      server.loading.value = false
      await flushPromises()
      expect(wrapper.emitted('chatConversation')).toEqual([[{ exists: false, mutedByMe: false }]])
    })

    // The first message makes it exist -- and from then on the bell has something to mute.
    it('says so once the first message has made the conversation', async () => {
      serverSends.mockResolvedValue(ownCopy(99, 'Hallo'))
      mountThread()
      await arrive(page([]))

      await write('Hallo')

      expect(wrapper.emitted('chatConversation')).toEqual([
        [{ exists: false, mutedByMe: false }],
        [{ exists: true, mutedByMe: false }],
      ])
    })

    /**
     * ⛔ And nothing more after a message into a thread that exists: the window keeps the
     * bell itself once it knows, and the opening's `mutedByMe` told again after every message
     * would undo a bell the member has just switched.
     */
    it('does not repeat itself after a message into a thread that exists', async () => {
      serverSends.mockResolvedValue(ownCopy(99, 'Hallo'))
      mountThread()
      await arrive(page([1, 2]))

      await write('Hallo')

      expect(wrapper.emitted('chatConversation')).toHaveLength(1)
    })
  })

  /**
   * ⛔ The stand-ins above answer whatever is asked, so no test here could see a field missing
   * from the document (skill null-d). These two read the documents themselves: what the thread
   * reads off the page must be asked for, and the answer to a message sent must have the very
   * fields a message of the thread has -- it is hung into the same list and drawn by the same
   * bubble.
   */
  describe('the questions it sends', () => {
    const top = (document) =>
      document.definitions.find((definition) => definition.kind === 'OperationDefinition')
        .selectionSet.selections[0]
    const shape = (selectionSet) =>
      selectionSet.selections
        .map((field) =>
          field.selectionSet
            ? `${field.name.value}{${shape(field.selectionSet)}}`
            : field.name.value,
        )
        .join(' ')

    it('asks the page for what the thread and the bell read', () => {
      const fields = top(chatMessagesWithMemberQuery).selectionSet.selections.map(
        (field) => field.name.value,
      )
      expect(fields).toEqual(expect.arrayContaining(['hasMore', 'mutedByMe', 'messages']))
    })

    const messagesOf = (document) =>
      top(document).selectionSet.selections.find((field) => field.name.value === 'messages')

    it('asks the answer to a message for the fields of a message of the thread', () => {
      const messages = messagesOf(chatMessagesWithMemberQuery)
      expect(shape(top(sendChatMessage).selectionSet)).toBe(shape(messages.selectionSet))
      // Gegenprobe: the shape is not empty on either side.
      expect(shape(messages.selectionSet)).toContain('deliveryState')
    })

    /**
     * ⛔ What became of the mail (E-034) is asked in all three: the page, the answer to a message
     * sent, and the beat's messages. An arrival is hung into the same list as the page's messages
     * (`takeWaitingArrivals`), so a field the beat did not ask for would be missing from a message
     * in the thread -- one's own copy from a second device would lose its envelope.
     */
    it('asks all three for what became of the mail, in the one shape of a message', () => {
      const thread = shape(messagesOf(chatMessagesWithMemberQuery).selectionSet)
      expect(thread.split(' ')).toContain('mailState')
      expect(shape(top(sendChatMessage).selectionSet)).toBe(thread)
      expect(shape(messagesOf(newChatMessagesSince).selectionSet)).toBe(thread)
    })
  })

  const code = (file) =>
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), file), 'utf8')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')

  /**
   * ⛔ No fixed height: P2b's `height: min(45vh, 30rem)` left a thread of one message at the
   * bottom of an empty box (E-031). The thread is as high as its messages, up to a cap, and
   * loading is a small box of its own. Only the stylesheet can say so -- jsdom lays nothing out.
   */
  it('is as high as its messages, up to a cap, and loads in a small box', () => {
    const style = code('ChatThread.vue')
    const rule = (selector) => style.match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

    expect(rule('\\.chat-thread-box')).not.toMatch(/(^|[^-])height:/)
    expect(rule('\\.chat-thread-scroll')).toMatch(/max-height:\s*min\(45dvh,\s*30rem\)/)
    expect(rule('\\.chat-thread-loading')).toMatch(/height:\s*4rem/)
  })

  /**
   * ⛔ Every opening asks the server (`network-only`). Every spec replaces Apollo, so only the
   * source can say the option is there -- read with the comments taken out, because the
   * comment beside it names the same words and would keep this green after a deletion.
   */
  it('asks fresh on every opening -- network-only, in the code and not only in a comment', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'ChatThread.vue'),
      'utf8',
    )
    const code = source
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')

    expect(code.match(/fetchPolicy:\s*'network-only'/g)).toHaveLength(1)
    // Gegenprobe on the stripping: the words stand in a comment as well, and are fewer once
    // the comments are gone.
    expect(source.match(/network-only/g).length).toBeGreaterThan(code.match(/network-only/g).length)
  })
})
