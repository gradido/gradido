// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, inject, nextTick, ref } from 'vue'
import { useChatThreadSearch } from './useChatThreadSearch'
import { CHAT_SEARCH } from '@/utils/chatSearch'

// A small reading limit, so a test can reach it: the thread's is a thousand.
vi.mock('@/utils/chatSearch', async (original) => ({
  ...(await original()),
  CHAT_SEARCH_MAX_MESSAGES: 6,
}))

/**
 * A thread as the search sees it: its items, whether older pages remain, and a `loadOlder` that
 * puts the next older page in front -- after the call returned, as Apollo writes the merged page
 * (ChatThread), unless a test holds it or lets it fail.
 */
const makeThread = ({ items = [], older = [] } = {}) => {
  const timeline = ref(items)
  const pages = [...older]
  const olderFailed = ref(false)
  const thread = {
    timeline,
    pages,
    olderFailed,
    asked: 0,
    shown: [],
    hold: false,
    fail: false,
    canLoadOlder: computed(() => pages.length > 0 && !thread.exhausted.value),
    exhausted: ref(false),
    messageCount: computed(() => timeline.value.length),
    progress: computed(() => `${timeline.value.length}`),
    loadOlder: async () => {
      thread.asked += 1
      if (thread.fail) {
        olderFailed.value = true
        return
      }
      if (thread.hold) return
      const next = pages.shift()
      setTimeout(() => {
        timeline.value = [...next, ...timeline.value]
        if (!pages.length) thread.exhausted.value = true
      }, 0)
    },
    show: (key) => thread.shown.push(key),
  }
  return thread
}

const item = (id, body) => ({ id, subject: null, body })

let wrapper
let search
let heard
const host = (thread, typed) =>
  defineComponent({
    setup() {
      search = useChatThreadSearch({ typed, ...thread })
      return () => h(child)
    },
  })
// A bubble's words, as the thread's children read the needle: a functional component, which may
// inject as well.
const child = () => {
  heard = inject(CHAT_SEARCH, null)
  return h('i')
}

const settle = async () => {
  await vi.runAllTimersAsync()
  await flushPromises()
  await nextTick()
}

describe('useChatThreadSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  const start = async (thread, text = '') => {
    const typed = ref(text)
    wrapper = mount(host(thread, typed))
    await settle()
    return typed
  }

  it('finds the items that hold the needle and stands on the newest', async () => {
    const thread = makeThread({
      items: [item(1, 'Die Bank am Waldrand'), item(2, 'Hallo'), item(3, 'Eine BANK im Café')],
    })
    const typed = await start(thread)
    typed.value = 'bank'
    await settle()

    expect(search.result.value).toEqual({
      searching: true,
      count: 2,
      current: 2,
      busy: false,
      capped: false,
    })
    expect(search.currentKey.value).toBe(3)
    expect(thread.shown).toEqual([3])
  })

  // The words of the bubbles read the needle from here -- folded, '' while nothing is searched.
  it('provides the needle to the words of the bubbles', async () => {
    const typed = await start(makeThread({ items: [item(1, 'x')] }))
    expect(heard.value).toBe('')
    typed.value = ' Café '
    await settle()
    expect(heard.value).toBe('cafe')
  })

  it('searches nothing below two letters', async () => {
    const thread = makeThread({ items: [item(1, 'a b c')] })
    const typed = await start(thread)
    typed.value = 'a'
    await settle()
    expect(search.result.value.searching).toBe(false)
    expect(search.result.value.count).toBe(0)
    expect(thread.asked).toBe(0)
  })

  it('loads the older pages first, and searches them too', async () => {
    const thread = makeThread({
      items: [item(5, 'neu'), item(6, 'Bank')],
      older: [
        [item(3, 'Bank alt'), item(4, 'x')],
        [item(1, 'Bank ganz alt'), item(2, 'y')],
      ],
    })
    const typed = await start(thread)
    typed.value = 'bank'
    await settle()

    expect(thread.asked).toBe(2)
    expect(search.result.value.count).toBe(3)
    expect(search.currentKey.value).toBe(6)
  })

  // ⛔ Asked once per page: the page lands after the call returned (Apollo), and asking again
  // before it did would ask for the same page twice.
  it('asks for the next page only once the last one landed', async () => {
    const thread = makeThread({
      items: [item(5, 'x')],
      older: [[item(3, 'y')], [item(1, 'z')]],
    })
    const typed = await start(thread)
    typed.value = 'bank'
    await flushPromises()
    expect(thread.asked).toBe(1)
    await settle()
    expect(thread.asked).toBe(2)
  })

  it('reads no more messages than it reads, and says so', async () => {
    const thread = makeThread({
      items: [item(7, 'Bank'), item(8, 'x')],
      older: [[item(5, 'x'), item(6, 'x')], [item(3, 'x'), item(4, 'x')], [item(1, 'Bank')]],
    })
    const typed = await start(thread)
    typed.value = 'bank'
    await settle()

    expect(thread.asked).toBe(2)
    expect(search.result.value.count).toBe(1)
    expect(search.result.value.capped).toBe(true)
  })

  it('stops where an older page fails, and searches what it has', async () => {
    const thread = makeThread({ items: [item(3, 'Bank')], older: [[item(1, 'Bank')]] })
    thread.fail = true
    const typed = await start(thread)
    typed.value = 'bank'
    await settle()
    expect(thread.asked).toBe(1)
    expect(search.result.value).toMatchObject({ count: 1, busy: false })
  })

  // A page that never comes must not hold the search for ever.
  it('gives up on a page that does not come', async () => {
    const thread = makeThread({ items: [item(3, 'Bank')], older: [[item(1, 'Bank')]] })
    thread.hold = true
    const typed = await start(thread)
    typed.value = 'bank'
    await flushPromises()
    expect(search.result.value.busy).toBe(true)
    await vi.advanceTimersByTimeAsync(15000)
    await flushPromises()
    expect(search.result.value).toMatchObject({ busy: false, count: 1, current: 1 })
  })

  it('steps from hit to hit, and not past the first or the last', async () => {
    const thread = makeThread({
      items: [item(1, 'Bank'), item(2, 'x'), item(3, 'Bank'), item(4, 'Bank')],
    })
    const typed = await start(thread)
    typed.value = 'bank'
    await settle()
    expect(search.currentKey.value).toBe(4)

    search.step(-1)
    await settle()
    expect(search.currentKey.value).toBe(3)
    search.step(-1)
    await settle()
    expect(search.currentKey.value).toBe(1)
    search.step(-1)
    await settle()
    expect(search.currentKey.value).toBe(1)
    search.step(1)
    await settle()
    expect(search.currentKey.value).toBe(3)
    expect(thread.shown).toEqual([4, 3, 1, 3])
  })

  // While older pages come the hits are not all there: no step until they are.
  it('does not step while older pages come', async () => {
    const thread = makeThread({
      items: [item(3, 'Bank'), item(4, 'Bank')],
      older: [[item(1, 'x')]],
    })
    thread.hold = true
    const typed = await start(thread)
    typed.value = 'bank'
    await flushPromises()
    search.step(-1)
    await flushPromises()
    expect(search.currentKey.value).toBe(null)
  })

  // A hit stays on its message while others arrive after it.
  it('stays on its hit while a newer one arrives', async () => {
    const thread = makeThread({ items: [item(1, 'Bank'), item(2, 'Bank')] })
    const typed = await start(thread)
    typed.value = 'bank'
    await settle()
    search.step(-1)
    await settle()
    thread.timeline.value = [...thread.timeline.value, item(3, 'Bank')]
    await settle()
    expect(search.currentKey.value).toBe(1)
    expect(search.result.value).toMatchObject({ count: 3, current: 1 })
  })

  // Typed on while the pages came: the newest needle decides where the search stands.
  it('follows the newest needle once the pages are in', async () => {
    const thread = makeThread({
      items: [item(3, 'Bank'), item(4, 'Waldrand')],
      older: [[item(1, 'Waldrand alt'), item(2, 'Bank alt')]],
    })
    const typed = await start(thread)
    typed.value = 'bank'
    await flushPromises()
    typed.value = 'waldrand'
    await settle()
    expect(search.currentKey.value).toBe(4)
    expect(search.result.value.count).toBe(2)
    // Shown once: the older needle gives way instead of jumping the box there first.
    expect(thread.shown).toEqual([4])
  })

  it('lets everything go when the search is emptied', async () => {
    const thread = makeThread({ items: [item(1, 'Bank')] })
    const typed = await start(thread)
    typed.value = 'bank'
    await settle()
    typed.value = ''
    await settle()
    expect(search.currentKey.value).toBe(null)
    expect(search.result.value).toEqual({
      searching: false,
      count: 0,
      current: 0,
      busy: false,
      capped: false,
    })
  })

  it('finds a word in the subject too', async () => {
    const thread = makeThread({
      items: [{ id: 1, subject: 'Wichtig: der Termin', body: 'Hallo' }],
    })
    const typed = await start(thread)
    typed.value = 'termin'
    await settle()
    expect(search.result.value.count).toBe(1)
  })
})
