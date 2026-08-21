// AI-GENERATED — not an architecture reference

import { useStore } from 'vuex'
import { PARKED_AMOUNT_TTL_MS } from '@/composables/useParkedAmount'

/**
 * The calculator's basket, written down for the round trip to the scanner.
 *
 * ## Why it has to be written down at all
 *
 * "With thank-you card" parks the amount AND navigates to /scan — which unmounts the
 * calculator and its per-instance state. Coming back remounted an EMPTY page: display
 * gone, and with it the fiat sum the customer still owes, which lives nowhere else.
 * Bernd (21.08.2026): the WHOLE basket survives the round trip.
 *
 * ## The shape of its life
 *
 * - **sessionStorage, not localStorage.** The basket belongs to this tab's sale; a
 *   second till tab has its own, and closing the tab is closing the till.
 * - **Bound to the gradidoID**, like the parked amount: on a shared device the next
 *   person must not inherit somebody else's half-finished sale.
 * - **Taken once.** `takeBasket` removes the entry as it reads it — the basket is for
 *   the one way back, not a standing copy that could shadow later work.
 * - **Same ten-minute lease as the parked amount.** A basket older than that is not a
 *   round trip any more, it is yesterday's sale.
 *
 * Whether a taken basket is actually RESTORED is the calculator's decision, not this
 * module's: it also knows whether the parked entry was consumed meanwhile — in which
 * case the payment went through and the clean start is the right one.
 */

const KEY_PREFIX = 'calculator-basket:'

export const useCalculatorBasket = () => {
  const store = useStore()

  const storageKey = () => {
    const { gradidoID } = store.state
    return gradidoID ? `${KEY_PREFIX}${gradidoID}` : null
  }

  const saveBasket = (basket) => {
    const key = storageKey()
    if (!key) {
      return false
    }
    try {
      window.sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), basket }))
      return true
    } catch {
      // Storage refusing is the pre-existing behaviour (an empty calculator on the way
      // back) — it must not block the park-and-scan act itself.
      return false
    }
  }

  /** The saved basket if it is fresh, otherwise null. Removes the entry either way. */
  const takeBasket = () => {
    const key = storageKey()
    if (!key) {
      return null
    }
    try {
      const raw = window.sessionStorage.getItem(key)
      if (!raw) {
        return null
      }
      window.sessionStorage.removeItem(key)
      const stored = JSON.parse(raw)
      if (!stored || !Number.isFinite(stored.at) || !stored.basket) {
        return null
      }
      // Both directions, like the parked amount: a stamp ahead of the clock is a clock
      // that has been put back, and "fresh forever" is the wrong reading of that.
      const age = Date.now() - stored.at
      if (age < 0 || age > PARKED_AMOUNT_TTL_MS) {
        return null
      }
      return stored.basket
    } catch {
      return null
    }
  }

  return { saveBasket, takeBasket }
}
