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
 * come would otherwise hold the search for ever. What came until then is searched.
 */
const PAGE_WAIT_MS = 15000

/**
 * The search in a thread (Bernd, 30.09.2026, E-057): the magnifier by the window's cross opens a
 * field; what is typed is searched on the device, in everything the thread holds, and the hits are
 * marked where they stand, the newest first -- ↑ and ↓ go from hit to hit.
 *
 * "Everything" (Bernd's choice): the older pages are loaded for it, up to about a thousand messages
 * (`CHAT_SEARCH_MAX_MESSAGES`), the transfers between the two with them. Past that the oldest stay
 * unsearched, and the window says so (`capped`). The words searched for never leave the device.
 *
 * A hit is a message, not a place in it: "3 von 12" counts messages, and ↑ goes to the message
 * before. Every place of the needle in the messages on screen is marked, the words of the bubbles
 * read the needle provided here (chatSearchMarks).
 *
 * @param {object} thread
 * @param {import('vue').Ref<string>} thread.typed what the window's field holds; '' while closed
 * @param {import('vue').Ref<Array>} thread.timeline the thread's items, the oldest first
 * @param {import('vue').Ref<boolean>} thread.canLoadOlder whether older pages remain
 * @param {import('vue').Ref<number>} thread.messageCount how many messages the thread holds
 * @param {import('vue').Ref<boolean>} thread.olderFailed whether the last older page failed
 * @param {import('vue').Ref<string>} thread.progress a mark that moves when an older page landed
 * @param {() => Promise<void>} thread.loadOlder asks for the next older page
 * @param {(key: string | number) => void} thread.show puts an item in the middle of the box
 */
export const useChatThreadSearch = ({
  typed,
  timeline,
  canLoadOlder,
  messageCount,
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

  /** Pages remain, but the search read as many messages as it reads. */
  const capped = computed(
    () =>
      Boolean(needle.value) && canLoadOlder.value && messageCount.value >= CHAT_SEARCH_MAX_MESSAGES,
  )

  /**
   * Resolves true once the progress mark moved -- the page asked for is on screen --, false after
   * `PAGE_WAIT_MS` without it. ⚠️ Watched from BEFORE the page is asked for: the thread's
   * `fetchMore` returns before the merged page is written (ChatThread), so waiting on the call
   * alone would ask for the same page twice.
   */
  const pageLanded = (before) =>
    new Promise((resolve) => {
      let timer = null
      const stop = watch(progress, (now) => {
        if (now === before) return
        stop()
        clearTimeout(timer)
        resolve(true)
      })
      timer = setTimeout(() => {
        stop()
        resolve(false)
      }, PAGE_WAIT_MS)
    })

  const loadEverything = async () => {
    while (canLoadOlder.value && messageCount.value < CHAT_SEARCH_MAX_MESSAGES) {
      const landed = pageLanded(progress.value)
      await loadOlder()
      if (olderFailed.value || !(await landed)) break
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
