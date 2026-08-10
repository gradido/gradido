// AI-GENERATED — not an architecture reference
import { ref } from 'vue'

/**
 * A one-shot handover between two pages of the matching: the map hands a typed
 * search to the entry form, which opens with it already filled in.
 *
 * Deliberately NOT a route parameter, and for the same reason the ad-hoc search
 * route takes a body rather than a query string: the words are the member's own,
 * and a search can be "a bicycle" as easily as "help with depression". A route
 * parameter would put that in the address bar and in the browser history, where it
 * outlives the moment it belonged to.
 *
 * Deliberately not stored either. It lives in memory, it is read exactly once, and
 * a reload loses it - which is right, because the offer to keep a search only makes
 * sense in the breath after making it.
 */
const draft = ref(null)

export function useEntryDraft() {
  return {
    /** @param {{summary: string, details: string, matchingType: string}} next */
    put(next) {
      draft.value = next
    },

    /** Reads and clears in one go, so the same offer cannot be taken up twice. */
    take() {
      const held = draft.value
      draft.value = null
      return held
    },
  }
}
