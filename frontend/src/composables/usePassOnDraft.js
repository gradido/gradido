// AI-GENERATED — not an architecture reference
import { useWalletStore } from '@/store/useWalletStore'

/**
 * How long a thank-you handed over waits for the send form: ten minutes. Taken later, it is let
 * go -- a handover left lying must not turn a later, different transfer into one that passes this
 * thank-you on.
 */
export const PASS_ON_DRAFT_HOLDS_MS = 10 * 60 * 1000

/**
 * A one-shot handover from "Jemandem danken" -- the line under a thank-you received in the
 * booking list, and the tile "Dein Dank ist da." -- to the send form: which received thank-you the
 * transfer the member is about to make passes on (the trail, `passOnOf` of sendCoins). The page
 * of the send form takes it once, when it is made; nothing of it is shown anywhere.
 *
 * ⛔ In memory only, and read exactly once (the shape of useLinkDraft). What travels here says
 * which thank-you a member passes on, so it goes
 * - never into the address: `?art` is a command, not a state (TransactionForm), and an address
 *   stays in the browser's history, through a reload, a restored tab and a sign-out -- opened
 *   again, it would pass the same thank-you on once more;
 * - never into the store, which is mirrored into the device's storage with every mutation;
 * - never into Apollo's cache.
 * A reload loses it, and the transfer goes out without a trail then.
 *
 * ⛔ It belongs to the member who handed it over, and only for a while: signing out drops it
 * (`clearPassOnDraft`, store), it is handed out to that member only, and only for
 * PASS_ON_DRAFT_HOLDS_MS.
 */
let held = null

/** Drops what is held, because the session it belonged to has ended. */
export function clearPassOnDraft() {
  held = null
}

export function usePassOnDraft() {
  const store = useWalletStore()

  return {
    /**
     * @param {number} transactionId the member's own RECEIVE booking of the thank-you passed on
     * @returns {object} what was handed over, for `drop`
     */
    put(transactionId) {
      held = { transactionId, owner: store.gradidoID, at: Date.now() }
      return held
    },

    /**
     * The thank-you handed over, for the page of the send form -- or null. Reads and clears in
     * one go: what is held goes to the member it came from while it is fresh, and anything else
     * is let go.
     */
    take() {
      const was = held
      held = null
      if (!was) return null
      const mine = Boolean(was.owner) && was.owner === store.gradidoID
      const fresh = Date.now() - was.at <= PASS_ON_DRAFT_HOLDS_MS
      return mine && fresh ? was.transactionId : null
    },

    /**
     * Takes back what `put` handed over, where the send form was never reached. Only its own: a
     * second tap may have handed over something newer in the meantime.
     */
    drop(handed) {
      if (held === handed) held = null
    },
  }
}
