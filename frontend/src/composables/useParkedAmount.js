// AI-GENERATED — not an architecture reference

import { useStore } from 'vuex'

/**
 * The amount the calculator hands to a card payment.
 *
 * ## Why it has to be parked at all
 *
 * The wallet has its own scanner now, but the amount still has to go over storage: on the
 * OLD way (the phone's own camera) scanning leaves the wallet and opens `/dk/CODE` afresh,
 * and nothing survives that jump except what was written down. The old way stays fully
 * supported — it is the net when the camera says no — so the calculator writes the amount
 * here either way, and the payment screen finds it waiting.
 *
 * ## Three properties, and each of them prevents a specific wrong charge
 *
 * - **Bound to the gradidoID**, like the memo. On a shared till the next person must not
 *   inherit somebody else's amount -- and this one is money, not a shop name.
 * - **It expires.** Somebody who calculated at eleven and scans a card at four is starting a
 *   new sale, and the old total turning up in the field would be a charge nobody looked at.
 * - **It is given up when the sale ends** -- paid, or refused for good. NOT when it is read:
 *   the payment screen reads it on arrival and clears it once the payment has gone through,
 *   because consuming on arrival would lose the amount to an accidental reload with a
 *   customer waiting. See `readParked` and `clearParked` below.
 *
 * ⛔ The amount is stored RAW -- `1234.5`, dot notation, no grouping. A stored `1.234,50`
 * would be a different number depending on the interface language, and the language can
 * change between parking and redeeming. Formatting is for the eye, never for storage.
 */

const KEY_PREFIX = 'calculator-parked-amount:'

/**
 * Everything, for logging out.
 *
 * ⛔ The settings beside this one are NOT cleared, and that is the difference between them:
 * a percentage is what the till is, and it is meant to still be there tomorrow morning --
 * the same reasoning `useThankYouCardMemo` gives for keeping the reference. A parked amount
 * is money in the middle of a sale, and it has no business on a device somebody has walked
 * away from. It expires within ten minutes anyway; this makes it go at once.
 *
 * ⚠️ Never `localStorage.clear()`: the wallet and the admin share an origin.
 */
export const forgetParkedAmount = (gradidoID) => {
  if (!gradidoID) {
    return
  }
  try {
    window.localStorage.removeItem(`${KEY_PREFIX}${gradidoID}`)
  } catch {
    // storage refusing to work must not take the rest of the logout with it
  }
}

/** Ten minutes: long enough to walk through the camera app, short enough to be one sale. */
export const PARKED_AMOUNT_TTL_MS = 10 * 60 * 1000

export const useParkedAmount = () => {
  const store = useStore()

  const storageKey = () => {
    const { gradidoID } = store.state
    return gradidoID ? `${KEY_PREFIX}${gradidoID}` : null
  }

  /**
   * @param {number} amount the Gradido to be handed over
   * @param {{fiat?: number, currency?: string}} [rest] what is still owed in the local
   *   currency, and the sign it is written with. Optional and separate on purpose: the
   *   amount is what the payment page NEEDS, the rest is what the receipt owes the
   *   customer afterwards -- and a till that splits nothing has none of it.
   */
  const park = (amount, rest = {}) => {
    const key = storageKey()
    if (!key || !Number.isFinite(amount) || amount <= 0) {
      return false
    }
    const entry = { amount, at: Date.now() }
    // Only a real remainder travels. Zero is the 100 % Gradido sale, and a receipt line
    // saying "0,00 € to be settled separately" would invent a debt that does not exist.
    if (Number.isFinite(rest.fiat) && rest.fiat > 0 && typeof rest.currency === 'string') {
      entry.fiat = rest.fiat
      entry.currency = rest.currency
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(entry))
      return true
    } catch {
      return false
    }
  }

  /** The stored entry if it is still fresh, otherwise null. Does not consume it. */
  const readEntry = () => {
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
      /**
       * ⚠️ Both directions. A stamp that lies AHEAD of the clock is not fresh, it is a clock
       * that has been put back -- and `now - at` would then be negative, which is below the
       * limit forever. Ten minutes would quietly become however far the clock moved.
       */
      const age = Date.now() - stored.at
      if (age < 0 || age > PARKED_AMOUNT_TTL_MS) {
        return null
      }
      return stored
    } catch {
      return null
    }
  }

  /** The parked amount if it is still fresh, otherwise null. Does not consume it. */
  const readParked = () => readEntry()?.amount ?? null

  /**
   * What is still owed in the local currency, if anything -- read through the SAME lease as
   * the amount, so a remainder can never outlive the sale it belongs to.
   *
   * @returns {{fiat: number, currency: string}|null}
   */
  const readParkedRest = () => {
    const entry = readEntry()
    if (!entry || !Number.isFinite(entry.fiat) || entry.fiat <= 0 || !entry.currency) {
      return null
    }
    return { fiat: entry.fiat, currency: entry.currency }
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
   * Whether there is an entry at all, fresh or not.
   *
   * ★ The calculator needs the difference and `readParked` cannot give it: an entry that is
   * GONE means somebody consumed it -- the sale is over and the calculator has to start
   * clean. An entry that is merely stale means the clock ran out while the basket on screen
   * is still the current one, and wiping that would take a till's work away from it.
   */
  const hasParkedEntry = () => {
    const key = storageKey()
    if (!key) {
      return false
    }
    try {
      return window.localStorage.getItem(key) !== null
    } catch {
      return false
    }
  }

  /**
   * ⚠️ No read-and-clear in one go, deliberately. The payment screen reads on arrival and
   * clears only once a payment has gone through -- consuming on arrival would lose the
   * amount to an accidental reload, with a customer waiting at the counter.
   */
  return { park, readParked, readParkedRest, clearParked, hasParkedEntry, parkedKey: storageKey }
}
