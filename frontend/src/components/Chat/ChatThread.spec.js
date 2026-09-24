// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import ChatThread from './ChatThread.vue'
import { chatMessagesWithMemberQuery, markChatConversationRead } from '@/graphql/chat.graphql'

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
// through `.catch`, which needs one to hang on.
const markRead = vi.fn(async () => ({ data: { markChatConversationRead: true } }))

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
    useMutation: (document) => ({
      mutate: (variables) => markRead(document, variables),
    }),
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
})

const page = (ids, { hasMore = false, day } = {}) => ({
  hasMore,
  messages: ids.map((n) => message(n, { day })),
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
        stubs: { IMdiChatOutline: true, IMdiEmailOutline: true },
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
    layout.hidden = false
    layout.extra = 0
  })

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
     * A log a screen reader follows, named after the person, and focusable so a keyboard can
     * scroll it.
     */
    it('is a named log that a keyboard can reach', async () => {
      mountThread()
      await arrive(page([1, 2]))

      expect(log().attributes('role')).toBe('log')
      expect(log().attributes('aria-live')).toBe('polite')
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
      expect(wrapper.find('[data-test="chat-thread-older-failed"]').text()).toBe(
        'chatThread.notReachable',
      )
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
