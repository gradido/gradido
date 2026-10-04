// AI-GENERATED — not an architecture reference
import { useStore } from 'vuex'

/**
 * A one-shot handover from a link in the member's own list to the way a link is made
 * ("Duplizieren", ZE-030): the row hands over what it shows of its link, and the send form or
 * the page of the thank-you greeting opens with that in its fields. Nothing is made by it -- the
 * new link is made by the member, on the way every link is made.
 *
 * ⛔ In memory only, and read exactly once (the shape of useEntryDraft). What travels here is an
 * amount, a memo and the name of a third person, so it goes
 * - never into the address and never into the router's `state`: both stay in the browser's
 *   history, through a reload, a restored tab and a sign-out;
 * - never into the store, which is mirrored into the device's storage with every mutation;
 * - never into Apollo's cache.
 * A reload loses it, and the way opens empty then, as it always has.
 *
 * ⛔ It belongs to the member who handed it over. Signing out drops it (`clearLinkDraft`,
 * store.js): a sign-out does not reload the page, so this module lives on. And it is handed out
 * to that member only: the list stays on screen for a moment after a sign-out, while the sign-in
 * page is loaded, and what a tap in that moment hands over is nobody's -- the next member to sign
 * in on this browser finds the way empty.
 */
let held = null

/** Drops what is held, because the session it belonged to has ended. */
export function clearLinkDraft() {
  held = null
}

export function useLinkDraft() {
  const store = useStore()

  // Reads and clears in one go. What is held goes to the way it was meant for and to the member
  // it came from; anything else is left over from a visit that went elsewhere, and is let go.
  const take = (ofGreeting) => {
    const was = held
    held = null
    if (!was) return null
    const mine = Boolean(was.owner) && was.owner === store.state.gradidoID
    return mine && (was.link.greeting !== null) === ofGreeting ? was.link : null
  }

  return {
    /**
     * @param {{ id: number, amount: number, memo: string, greeting: { motif: string | null,
     *   line: string | null, recipientName: string | null, hasPicture: boolean } | null }} link
     *   what the row of the list shows of its link; `greeting` is null for a plain link
     * @returns {object} what was handed over, for `drop`
     */
    put(link) {
      held = { link, owner: store.state.gradidoID }
      return held
    },

    /** What a plain link handed over, for the send form -- or null. */
    takeLink: () => take(false),

    /** What a thank-you greeting handed over, for its page -- or null. */
    takeGreeting: () => take(true),

    /**
     * Takes back what `put` handed over, where the way it was meant for was never reached. Only
     * its own: a second tap may have handed over something newer in the meantime.
     */
    drop(handed) {
      if (held === handed) held = null
    },
  }
}
