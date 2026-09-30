// AI-GENERATED — not an architecture reference
import { nextTick, ref, watch } from 'vue'

/** What a thread says before it has searched: nothing searched, nothing found. */
export const NOTHING_FOUND = Object.freeze({
  searching: false,
  count: 0,
  current: 0,
  busy: false,
  capped: false,
})

/**
 * The search of a conversation's window (Bernd, 30.09.2026, E-057), for the contact window and a
 * group's window alike: whether the bar is open, what is typed in it, what the window's thread
 * found (its `search` event). The magnifier by the cross opens the bar and closes it again, and
 * the focus goes back to the magnifier then. Closed as well -- without moving the focus -- when
 * the window closes or comes to another conversation: the next one begins unsearched.
 *
 * @param {() => boolean} isOpen whether the window is open
 * @param {() => unknown} conversation what names the conversation the window shows
 */
export const useChatWindowSearch = (isOpen, conversation) => {
  const searchOpen = ref(false)
  const searchTyped = ref('')
  const searchFound = ref(NOTHING_FOUND)
  /** The magnifier, for the focus to go back to. */
  const searchToggle = ref(null)

  const closeSearch = ({ focus = true } = {}) => {
    searchOpen.value = false
    searchTyped.value = ''
    searchFound.value = NOTHING_FOUND
    if (focus) nextTick(() => searchToggle.value?.focus())
  }

  const toggleSearch = () => {
    if (searchOpen.value) {
      closeSearch()
      return
    }
    searchOpen.value = true
  }

  /** What the thread found (its `search` event). */
  const takeFound = (found) => {
    searchFound.value = found
  }

  watch(isOpen, (open) => {
    if (!open) closeSearch({ focus: false })
  })
  watch(conversation, () => closeSearch({ focus: false }))

  return {
    searchOpen,
    searchTyped,
    searchFound,
    searchToggle,
    toggleSearch,
    closeSearch,
    takeFound,
  }
}
