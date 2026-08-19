// AI-GENERATED — not an architecture reference

import { useStore } from 'vuex'

/**
 * The amount the calculator hands to a card payment.
 *
 * ## Why it has to be parked at all
 *
 * Scanning a card means leaving the wallet: the phone's own camera reads the code and opens
 * `/dk/CODE` afresh. Nothing survives that jump except what was written down. So the
 * calculator writes the amount here, and the payment screen finds it waiting.
 *
 * ## Three properties, and each of them prevents a specific wrong charge
 *
 * - **Bound to the gradidoID**, like the memo. On a shared till the next person must not
 *   inherit somebody else's amount -- and this one is money, not a shop name.
 * - **It expires.** Somebody who calculated at eleven and scans a card at four is starting a
 *   new sale, and the old total turning up in the field would be a charge nobody looked at.
 * - **It is consumed when taken.** Otherwise the same amount greets the next card.
 *
 * ⛔ The amount is stored RAW -- `1234.5`, dot notation, no grouping. A stored `1.234,50`
 * would be a different number depending on the interface language, and the language can
 * change between parking and redeeming. Formatting is for the eye, never for storage.
 */

const KEY_PREFIX = 'calculator-parked-amount:'

/** Ten minutes: long enough to walk through the camera app, short enough to be one sale. */
export const PARKED_AMOUNT_TTL_MS = 10 * 60 * 1000

export const useParkedAmount = () => {
  const store = useStore()

  const storageKey = () => {
    const { gradidoID } = store.state
    return gradidoID ? `${KEY_PREFIX}${gradidoID}` : null
  }

  const park = (amount) => {
    const key = storageKey()
    if (!key || !Number.isFinite(amount) || amount <= 0) {
      return false
    }
    try {
      window.localStorage.setItem(key, JSON.stringify({ amount, at: Date.now() }))
      return true
    } catch {
      return false
    }
  }

  /** The parked amount if it is still fresh, otherwise null. Does not consume it. */
  const readParked = () => {
    const key = storageKey()
    if (!key) {
      return null
    }
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) {
        return null
      }
      const stored = JSON.parse(raw)
      if (!stored || !Number.isFinite(stored.amount) || !Number.isFinite(stored.at)) {
        return null
      }
      if (Date.now() - stored.at > PARKED_AMOUNT_TTL_MS) {
        return null
      }
      return stored.amount
    } catch {
      return null
    }
  }

  const clearParked = () => {
    const key = storageKey()
    if (!key) {
      return
    }
    try {
      window.localStorage.removeItem(key)
    } catch {
      // nothing to do; a stale entry expires on its own
    }
  }

  /**
   * ⚠️ No read-and-clear in one go, deliberately. The payment screen reads on arrival and
   * clears only once a payment has gone through -- consuming on arrival would lose the
   * amount to an accidental reload, with a customer waiting at the counter.
   */
  return { park, readParked, clearParked }
}
