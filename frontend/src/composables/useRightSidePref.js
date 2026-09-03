// AI-GENERATED — not an architecture reference

import { computed, ref, toValue, watch } from 'vue'
import { useStore } from 'vuex'

/**
 * Which way the right-hand column stands, remembered on THIS DEVICE (KF-009).
 *
 * The switch is not a setting (E-020): it sits where it is used, above the column it
 * turns, and it is changed by looking at the two words and picking one. What has to
 * survive is only the picking -- so it lives in the browser, the way the calculator's
 * counter settings do.
 *
 * ⛔ Not in the vuex store: `createPersistedState` writes the WHOLE store to localStorage
 * on every mutation, and this changes with a click.
 *
 * Key: `right-side:<gradidoID>:<routeKey>` -- one answer per member per route, because
 * KF-009 gives each of the three routes its own factory setting and somebody who wants
 * bookings beside the overview and contacts beside the send form is expressing two
 * different wishes, not one.
 *
 * ⛔ No shared fallback key without a gradidoID. The id is null before the login answer
 * arrives and again after signing out, and one shared key would hand the next person on a
 * shared device the previous one's column.
 */

const KEY_PREFIX = 'right-side:'

const storageKey = (gradidoID, routeKey) =>
  gradidoID && routeKey ? `${KEY_PREFIX}${gradidoID}:${routeKey}` : null

const write = (key, value) => {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage switched off, or full. Not being able to remember is no reason to refuse to
    // turn the column for this visit.
  }
}

/**
 * @param {import('vue').MaybeRefOrGetter<string|null>} routeKey which route is open
 * @param {import('vue').MaybeRefOrGetter<string|null>} fallback its factory setting
 * @param {string[]} allowed the positions this switch has
 */
export const useRightSidePref = (routeKey, fallback, allowed) => {
  const store = useStore()

  /** What the device remembers for the key that is open right now. */
  const stored = ref(null)

  /**
   * A position picked while nobody was named yet, and the route it was picked on.
   *
   * ⛔ Without this the click was undone under the member's hand. The route guard admits on
   * the token while `gradidoID` arrives with the login answer; a switch flicked inside that
   * gap could not be written, and the watch below then ran `read()` the moment the id
   * landed, found nothing stored under the new key, and fell back to the route's default.
   */
  let pending = null

  const read = () => {
    const key = toValue(routeKey)
    const storage = storageKey(store.state.gradidoID, key)
    if (!storage) {
      // Nobody named: nothing can be read, and a choice made in this gap is all there is.
      stored.value = pending && pending.routeKey === key ? pending.value : null
      return
    }

    let value = null
    try {
      const raw = window.localStorage.getItem(storage)
      // ⛔ Checked against the list rather than merely being non-empty. This value comes
      // back from the device, and a stale or hand-edited one would name a slot the column
      // does not have -- which renders an empty quarter of the screen with nothing to say
      // why. An unknown answer is no answer, so the route's default takes over.
      if (raw && allowed.includes(raw)) {
        value = raw
      }
    } catch {
      // Storage switched off, or a file somebody else wrote. The default is a far smaller
      // loss than a column that fails to appear.
    }

    // ⛔ The click from the login gap wins over what the device remembers, and it is written
    // now under the key it was always meant for. Adopting it only where NOTHING was stored
    // -- which an earlier version did -- helped exactly the members who had never used the
    // switch on that route: everybody else still watched the column snap back under their
    // hand, which is the whole symptom this exists to remove. The stored value is older
    // than the gesture; the gesture is what the member just said.
    if (pending?.routeKey === key) {
      value = pending.value
      write(storage, value)
      pending = null
    }
    stored.value = value
  }

  /**
   * ⚠️ Re-read when EITHER changes, and not only at setup. The route changes under a layout
   * that outlives it, and `gradidoID` arrives with the login answer rather than with the
   * token the route guard checks.
   */
  watch([() => toValue(routeKey), () => store.state.gradidoID], read, { immediate: true })

  /** The position in force: what was picked here, else what the route brings. */
  const choice = computed(() => stored.value ?? toValue(fallback) ?? null)

  const choose = (value) => {
    if (!allowed.includes(value)) {
      return
    }
    stored.value = value
    const key = toValue(routeKey)
    const storage = storageKey(store.state.gradidoID, key)
    if (!storage) {
      // Held until somebody is named -- see `pending`. The column turns for this visit
      // either way: `stored` above is what the template reads.
      pending = { routeKey: key, value }
      return
    }
    write(storage, value)
  }

  return { choice, choose }
}
