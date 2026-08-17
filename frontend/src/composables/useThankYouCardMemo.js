// AI-GENERATED — not an architecture reference
import { useStore } from 'vuex'

/**
 * The reference a till puts on card payments, remembered on the device.
 *
 * ## Why it lives here and not in the account
 *
 * It belongs to whoever TAKES card payments -- a cafe, a market stall -- and that person may
 * never own a card themselves, so there is no settings row of theirs to hang it on. Giving
 * it one would mean a fourth table for a convenience.
 *
 * A till is a device. The same phone or tablet stands on the same counter every day, and
 * that is exactly what a device can remember without anybody being asked to set anything up.
 * The wording is learned where it is used, which also means it is changed where it is used:
 * type over it and the next payment carries the new one. There is no page to go to.
 *
 * ⚠️ Same trade as the card's contact lines: this protects against being SEEN, not against
 * being SEARCHED FOR. Anybody at the same browser who knows where to look can read it. For a
 * shop name that is no secret worth guarding -- the point of binding it to the ID is that
 * the NEXT person to sign in on a shared device does not inherit it.
 */
const KEY_PREFIX = 'thank-you-card-memo:'

export const useThankYouCardMemo = () => {
  const store = useStore()

  /**
   * Without an ID there is no key, and no key means nothing is remembered.
   *
   * A shared fallback key would be worse than forgetting: `gradidoID` is null before the
   * login answer arrives and again after logging out, so the wallet really passes through
   * that state -- and one shared key would hand one shop's wording to the next person on the
   * same device. Not remembering is the safe direction.
   */
  const storageKey = () => {
    const { gradidoID } = store.state
    return gradidoID ? `${KEY_PREFIX}${gradidoID}` : null
  }

  const readRememberedMemo = () => {
    const key = storageKey()
    if (!key) {
      return ''
    }
    try {
      // ⚠️ Empty string rather than null on purpose: an empty field has to be produced
      // actively when the ID changes. "Remembered nothing" is not the same as "show
      // nothing", and on a shared device the difference is somebody else's shop name.
      return window.localStorage.getItem(key) ?? ''
    } catch {
      // A browser with storage switched off must not cost the payment. The field is simply
      // empty, which is a far smaller loss than a page that fails to load.
      return ''
    }
  }

  const writeRememberedMemo = (value) => {
    const key = storageKey()
    if (!key) {
      return
    }
    try {
      if (value) {
        window.localStorage.setItem(key, value)
      } else {
        window.localStorage.removeItem(key)
      }
    } catch {
      // as above: not being able to remember is no reason to fail
    }
  }

  return { readRememberedMemo, writeRememberedMemo }
}
