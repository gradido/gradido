// AI-GENERATED — not an architecture reference
import { reactive } from 'vue'
import { useWalletStore } from '@/store/useWalletStore'

/**
 * Which thank-you suggestions (W2, utils/thanksNudge) the member has answered on THIS device --
 * "Danke sagen" or "Nicht jetzt" under a video call of their own (`call`, by the message's uuid),
 * "Jemandem danken" or "Nicht jetzt" in a thank-you received (`pass-on`, by the booking's id).
 * Once answered, the line does not come back for that occasion. And which thank-yous received the
 * member put aside in the tile on the overview with "Später" (W3, `arrival`, by the booking's id):
 * the tile shows them no more, while the row in the booking list stays as it is.
 *
 * ⛔ Not a setting (E-020), and nothing kept at the account: a device of its own asks once more,
 * as the tile "Zeig es Deinen Freunden" does (useShowFriendsSeen). That is the price of keeping
 * it out of the server, and it costs a member one tap.
 *
 * ⛔ Not in the store: store.js writes the WHOLE store to localStorage on every change.
 *
 * Key: `thanks-nudge:<gradidoID>:<kind>:<id>`, value `'1'` -- ⛔ never a key without the member,
 * or the next person on a shared device would find the previous one's answers.
 *
 * Signing out takes nothing off the device, as for the other answers a member keeps there under
 * their key (the map's look, the right column, the tile): a session runs out after ten minutes
 * without a request, and "Nicht jetzt" undone by every such sign-out would bring the line back
 * again and again -- the pressing it is meant to spare. Nothing is held at module scope either,
 * so there is nothing for the sign-out to forget: what an instance marked is keyed by the member
 * it marked it for, and goes with the component.
 */
const KEY_PREFIX = 'thanks-nudge:'

/**
 * The occasions: one's own video call, a thank-you received -- and a thank-you received put aside
 * in the tile on the overview.
 */
const KINDS = ['call', 'pass-on', 'arrival']

/**
 * The key of an occasion, or null where nobody is signed in or the occasion has no name yet (a
 * message the server has not filed). A uuid is written in lower case: the server compares them
 * without regard to case.
 */
const storageKey = (gradidoID, kind, id) => {
  if (!KINDS.includes(kind)) throw new Error(`useThanksNudges: no occasion "${kind}"`)
  if (!gradidoID || id === null || id === undefined || id === '') return null
  return `${KEY_PREFIX}${gradidoID}:${kind}:${String(id).toLowerCase()}`
}

export const useThanksNudges = () => {
  const store = useWalletStore()

  /**
   * What this instance marked: the line goes at once, also where the device keeps nothing
   * (storage switched off, or full). Read by `isSeen`, so whatever is drawn from it follows.
   */
  const marked = reactive(new Set())

  /**
   * Whether the member answered the occasion on this device. Where nobody is signed in -- a
   * sign-out clears the store while the page still stands -- or the occasion has no name yet,
   * there is nothing to suggest: true. Where the device cannot be read, not answered: the line
   * stands, the harmless end of the mistake.
   *
   * @param {'call' | 'pass-on' | 'arrival'} kind
   * @param {string | number} id the message's uuid, or the booking's id
   */
  const isSeen = (kind, id) => {
    const key = storageKey(store.gradidoID, kind, id)
    if (!key) return true
    if (marked.has(key)) return true
    try {
      return window.localStorage.getItem(key) === '1'
    } catch {
      return false
    }
  }

  /** The member answered the occasion: on this device, under their key. */
  const markSeen = (kind, id) => {
    const key = storageKey(store.gradidoID, kind, id)
    if (!key) return
    marked.add(key)
    try {
      window.localStorage.setItem(key, '1')
    } catch {
      // Storage refused: the mark above holds for as long as the component stands.
    }
  }

  return { isSeen, markSeen }
}
