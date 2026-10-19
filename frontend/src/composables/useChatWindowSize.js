// AI-GENERATED — not an architecture reference
import { ref, watch } from 'vue'
import { useWalletStore } from '@/store/useWalletStore'

/**
 * Whether the chat's windows stand large -- a contact's window and a group's alike (Bernd,
 * 12.10.2026): the window as it always was is narrow for a longer text, and a button beside the
 * magnifier switches to a large one and back (ChatWindowSizeToggle). Remembered for the member,
 * on this device.
 *
 * Not a setting (E-020): the switch sits on the window it turns, and what has to survive is only
 * the turning -- so it lives in the browser, as the column's switch does (useRightSidePref).
 *
 * ⛔ Key `chat-window-large:<gradidoID>`, never one shared key: one browser serves several
 * members, and the next one would find the previous one's window. Without the id (before the
 * login answer, after signing out) nothing is read and nothing written -- the windows stand as
 * they stood, and a switch pressed then holds until somebody is named.
 *
 * ⛔ Not in the store: store.js writes the whole store to localStorage on
 * every change (useRightSidePref).
 */
const KEY_PREFIX = 'chat-window-large:'

const storageKey = (gradidoID) => (gradidoID ? `${KEY_PREFIX}${gradidoID}` : null)

/**
 * @param {string | null | undefined} gradidoID the member signed in
 * @returns {boolean} whether the member left the chat's windows large on this device
 */
export const readChatWindowLarge = (gradidoID) => {
  const key = storageKey(gradidoID)
  if (!key) return false
  try {
    return window.localStorage.getItem(key) === '1'
  } catch {
    // Storage switched off: the usual window, and the switch still turns the windows on screen.
    return false
  }
}

/**
 * @param {string | null | undefined} gradidoID the member signed in
 * @param {boolean} large whether the windows stand large now
 */
export const rememberChatWindowLarge = (gradidoID, large) => {
  const key = storageKey(gradidoID)
  if (!key) return
  try {
    if (large) window.localStorage.setItem(key, '1')
    else window.localStorage.removeItem(key)
  } catch {
    // Storage switched off, or full: the window is what the switch says, only it is not
    // remembered.
  }
}

/**
 * One answer for every chat window of the page, not one per window: a group's window under a
 * contact's follows the switch pressed in the one over it, and a window opened from another list
 * of the same page stands as the last one was left.
 */
const large = ref(false)

/**
 * @returns {{ large: import('vue').Ref<boolean>, toggleLarge: () => void }} whether the chat's
 * windows stand large, and the switch
 */
export const useChatWindowSize = () => {
  const store = useWalletStore()

  // Read for whoever is signed in, with every chat window that is made, and anew when somebody
  // else is: the id arrives with the login answer, and signing out does not reload the page.
  //
  // ⛔ Not when the id goes. Signing out empties the store while the chat window is still on
  // screen -- the page leaves only once the cache is cleared and the sign-in page has loaded --,
  // and "nobody remembered anything" read as "the usual window" made a large one jump to the
  // narrow one on its way out. The next member's first chat window reads for them.
  watch(
    () => store.gradidoID,
    (gradidoID) => {
      if (gradidoID) large.value = readChatWindowLarge(gradidoID)
    },
    { immediate: true },
  )

  const toggleLarge = () => {
    large.value = !large.value
    rememberChatWindowLarge(store.gradidoID, large.value)
  }

  return { large, toggleLarge }
}
