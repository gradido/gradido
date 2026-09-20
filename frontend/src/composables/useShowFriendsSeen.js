// AI-GENERATED — not an architecture reference

import { ref, watch } from 'vue'
import { useStore } from 'vuex'

/**
 * Whether this member has already opened the page for showing Gradido to somebody, on
 * THIS device.
 *
 * The tile is large until then and a quiet row afterwards (ZE-008 W5): large for as long
 * as it is news, and out of the way once the member has been there -- "without ever
 * asking twice". A mirror beats both, and that one comes from the data.
 *
 * ⛔ Not a setting (E-020) and nothing to click away: the member answers it by going to
 * the page, which is the only thing the tile asks of them.
 *
 * ⛔ Not in the vuex store: `createPersistedState` writes the WHOLE store to localStorage
 * on every mutation, the way `useRightSidePref` explains.
 *
 * Key: `show-friends-seen:<gradidoID>` -- ⛔ never a shared key without the id. It is null
 * before the login answer arrives and again after signing out, and one shared key would
 * hand the next person on a shared device the previous one's tile.
 *
 * On a new device the tile stands large once more. That is the price of keeping it out of
 * the account, and it costs a member one glance.
 */
const KEY_PREFIX = 'show-friends-seen:'

const storageKey = (gradidoID) => (gradidoID ? `${KEY_PREFIX}${gradidoID}` : null)

export const useShowFriendsSeen = () => {
  const store = useStore()
  const seen = ref(false)

  /**
   * A visit made while nobody was named yet.
   *
   * ⛔ Without it the visit was undone under the member's hand: the route guard admits on
   * the token while `gradidoID` arrives with the login answer, and a visit inside that gap
   * could not be written -- the watch below then ran `read()` the moment the id landed,
   * found nothing stored and set `seen` back to false. `useRightSidePref` carries the same
   * mechanism for the same reason, and there it was a measured symptom.
   *
   * ⚠️ Per instance, never at module scope: one shared flag would hand the next member on
   * this device a visit they never made.
   */
  let pendingVisit = false

  const read = () => {
    const key = storageKey(store.state.gradidoID)
    if (!key) {
      // Nobody named: nothing can be read, and a visit made in this gap is all there is.
      seen.value = pendingVisit
      return
    }
    try {
      if (pendingVisit) {
        // The visit is older than the name, and it is written now under the key it was
        // always meant for.
        window.localStorage.setItem(key, '1')
        pendingVisit = false
        seen.value = true
        return
      }
      seen.value = window.localStorage.getItem(key) === '1'
    } catch {
      // Storage switched off, or full. Not remembering means the tile stays large, which
      // is the harmless end of the mistake.
      seen.value = pendingVisit
    }
  }

  /**
   * ⚠️ Re-read when the id changes, not only at setup: it arrives with the login answer
   * rather than with the token the route guard checks, and it changes when somebody else
   * signs in on this device.
   */
  watch(() => store.state.gradidoID, read, { immediate: true })

  const markSeen = () => {
    const key = storageKey(store.state.gradidoID)
    seen.value = true
    if (!key) {
      pendingVisit = true
      return
    }
    try {
      window.localStorage.setItem(key, '1')
    } catch {
      // See above.
    }
  }

  return { seen, markSeen }
}
