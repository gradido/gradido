// AI-GENERATED — not an architecture reference
import { computed, nextTick, provide, ref, watch } from 'vue'
import {
  CHAT_SEARCH,
  CHAT_SEARCH_MAX_MESSAGES,
  chatSearchHolds,
  chatSearchNeedle,
} from '@/utils/chatSearch'

/**
 * How long a page asked for may take before the search stops asking for more: a page that does not
 * come would otherwise hold the search for ever. What came until then is searched -- and should
 * the page come later, it is searched with the rest.
 */
const PAGE_WAIT_MS = 15000

/**
 * How long a page that came may take to be on screen. Apollo writes the merged page after its
 * `fetchMore` returned (ChatThread), within a moment; a page that changed nothing -- a booking page
 * without a transfer between the two -- ends the loading after this, not after `PAGE_WAIT_MS`
 * (coderabbit, #4025).
 */
const LAND_WAIT_MS = 2000

const TIMED_OUT = Symbol('timedOut')
const within = (promise, ms) => {
  let timer = null
  return Promise.race([
    promise,
    new Promise((resolve) => {
      timer = setTimeout(() => resolve(TIMED_OUT), ms)
    }),
  ]).finally(() => clearTimeout(timer))
}

/**
 * The search in a thread (Bernd, 30.09.2026, E-057): the magnifier by the window's cross opens a
 * field; what is typed is searched on the device, in everything the thread holds, and the hits are
 * marked where they stand, the newest first -- ↑ and ↓ go from hit to hit.
 *
 * "Everything" (Bernd's choice): the older pages are loaded for it, up to about a thousand entries
 * (`CHAT_SEARCH_MAX_MESSAGES`) -- the messages and the transfers between the two together, so a
 * pair with few messages and many transfers is bounded as well (coderabbit, #4025). Past that the
 * oldest stay unsearched, and the window says so (`capped`). The words searched for never leave
 * the device.
 *
 * A hit is a message, not a place in it: "3 von 12" counts messages, and ↑ goes to the message
 * before. Every place of the needle in the messages on screen is marked, the words of the bubbles
 * read the needle provided here (chatSearchMarks).
 *
 * @param {object} thread
 * @param {import('vue').Ref<string>} thread.typed what the window's field holds; '' while closed
 * @param {import('vue').Ref<Array>} thread.timeline the thread's items, the oldest first
 * @param {import('vue').Ref<boolean>} thread.canLoadOlder whether older pages remain
 * @param {import('vue').Ref<number>} thread.loadedCount how many messages and transfers it holds
 * @param {import('vue').Ref<boolean>} thread.olderFailed whether the last older page failed
 * @param {import('vue').Ref<string>} thread.progress a mark that moves when an older page landed
 * @param {() => Promise<boolean>} thread.loadOlder asks for the next older page -- true once a
 *   page was asked for (or one already on its way came back), false where there was none to ask
 * @param {(key: string | number) => void} thread.show puts an item in the middle of the box
 */
export const useChatThreadSearch = ({
  typed,
  timeline,
  canLoadOlder,
  loadedCount,
  olderFailed,
  progress,
  loadOlder,
  show,
}) => {
  const needle = computed(() => chatSearchNeedle(typed.value))
  provide(CHAT_SEARCH, needle)

  const keyOf = (item) => item.key ?? item.id

  /** The keys of the items that hold the needle, the oldest first. */
  const hits = computed(() =>
    needle.value
      ? timeline.value.filter((item) => chatSearchHolds(item, needle.value)).map(keyOf)
      : [],
  )

  /** The hit the search stands on, by its key: it stays on its message while others arrive. */
  const currentKey = ref(null)
  const current = computed(() => hits.value.indexOf(currentKey.value))

  /** Older pages are on their way for the search. */
  const busy = ref(false)

  /** Pages remain, but the search read as many entries as it reads. */
  const capped = computed(
    () =>
      Boolean(needle.value) && canLoadOlder.value && loadedCount.value >= CHAT_SEARCH_MAX_MESSAGES,
  )

  /**
   * Whether the page asked for is on screen: `done` resolves true once the progress mark moved.
   * ⚠️ Watched from BEFORE the page is asked for: the thread's `fetchMore` returns before the merged
   * page is written (ChatThread), so waiting on the call alone would ask for the same page twice.
   * `arm` starts the wait once the request came back; `cancel` gives up at once.
   */
  const pageLanded = (before) => {
    let timer = null
    let settle = null
    let stop = null
    const done = new Promise((resolve) => {
      settle = resolve
    })
    const finish = (landed) => {
      stop?.()
      clearTimeout(timer)
      settle(landed)
    }
    stop = watch(progress, (now) => {
      if (now !== before) finish(true)
    })
    return {
      done,
      arm: (ms) => {
        if (progress.value !== before) finish(true)
        else timer = setTimeout(() => finish(false), ms)
      },
      cancel: () => finish(false),
    }
  }

  const loadEverything = async () => {
    while (canLoadOlder.value && loadedCount.value < CHAT_SEARCH_MAX_MESSAGES) {
      const landed = pageLanded(progress.value)
      const asked = await within(loadOlder(), PAGE_WAIT_MS)
      // Nothing to ask for, a page that does not come, or one that failed: what is there is
      // searched, now -- not after a wait for a page that will not change anything.
      if (asked !== true || olderFailed.value) {
        landed.cancel()
        break
      }
      landed.arm(LAND_WAIT_MS)
      if (!(await landed.done)) break
    }
  }

  let loading = null
  const everythingLoaded = () => {
    if (!loading) {
      busy.value = true
      loading = loadEverything().finally(() => {
        loading = null
        busy.value = false
      })
    }
    return loading
  }

  const goTo = async (key) => {
    currentKey.value = key
    if (key === null) return
    await nextTick()
    show(key)
  }

  // A new needle: first everything the search reads, then the newest hit. A needle typed on
  // meanwhile takes over -- the older one gives way once the pages are in.
  watch(needle, async (now) => {
    if (!now) {
      currentKey.value = null
      return
    }
    await everythingLoaded()
    if (needle.value !== now) return
    await goTo(hits.value.at(-1) ?? null)
  })

  /**
   * One hit on: -1 to the older, +1 to the newer. Nothing past the first or the last; from no hit
   * at all, the older goes to the newest.
   */
  const step = (direction) => {
    const count = hits.value.length
    if (!count || busy.value) return
    const from = current.value === -1 ? count : current.value
    const to = from + direction
    if (to < 0 || to >= count) return
    goTo(hits.value[to])
  }

  /** What the window's bar shows: how many, which, whether it is still loading, whether capped. */
  const result = computed(() => ({
    searching: Boolean(needle.value),
    count: hits.value.length,
    current: current.value + 1,
    busy: busy.value,
    capped: capped.value,
  }))

  return { needle, currentKey, result, step }
}
