// AI-GENERATED — not an architecture reference

/**
 * Where the find map remembers what a member set on it.
 *
 * ## The fault this exists to fix (Bernd, 10.09.2026)
 *
 * Fifteen settings -- the look, the radius, the filters, the sort, the lens, the mode, the
 * search centre and its place name, the last opened profile, the typed question, and the
 * two answers to the offer to keep a search -- all lived under one flat prefix,
 * `pref.gms.map.`, with no member in it. Nothing removed them at sign-out either.
 *
 * So they were the DEVICE's settings, not the member's. Bernd switched the keep-offer off
 * once and it stayed off for every account afterwards; his search for "fahrrad" turned up
 * for the next member; and measured on his own browser, a second account was carrying
 * `centerLabel = "Gersdorfstrasse, Suedstadt"` -- the STREET NAME of the account before it,
 * because the map sets its first search centre to the member's own position and resolves it
 * to a place name.
 *
 * ⭐ The house rule against exactly this was already written and already applied seven
 * times: the sign-out action clears the entry draft, other members' pictures, the
 * favourites, the contacts panel, the open picture, the first-login windows, and the parked
 * amount -- each with the same sentence, that the next person at this browser must not be
 * handed what the previous one was allowed to see. The map page simply was not on that list.
 *
 * ## Why keyed rather than cleared
 *
 * Bernd's decision: a member keeps their own map on their own device. Clearing at sign-out
 * would close the leak too, and cost every member their settings every time they sign out.
 * `useParkedAmount` is the pattern followed here -- one key per gradidoID -- and its own
 * comment draws the same line: money in the middle of a sale goes at sign-out, while what
 * the till IS stays. A radius and a look are what the map is; they stay.
 *
 * ⚠️ The consequence, and it is the price of that choice: what one member set stays in this
 * browser's storage after they sign out. It is unreachable for anybody else -- no other
 * member's prefix can name it -- but it is not gone. Clearing a signed-out member's own
 * prefix at sign-out would fix that too and is a separate decision.
 */

/**
 * The flat prefix everything used to live under, and still the root of the keyed ones.
 *
 * Kept as one constant because the sweep below and the prefix above must never drift apart:
 * the whole distinction between a legacy key and a keyed one is what follows this string.
 */
export const MAP_PREF_ROOT = 'pref.gms.map.'

/**
 * Where THIS member's map settings live: `pref.gms.map.<gradidoID>.`
 *
 * `null` without an id, and the caller must then read and write nothing. Falling back to
 * the bare root would be the bug again -- and it would be the bug at the worst moment,
 * when the store has not filled yet and the page cannot tell whose settings it is holding.
 */
export function mapPrefPrefix(gradidoID) {
  return gradidoID ? `${MAP_PREF_ROOT}${gradidoID}.` : null
}

/**
 * Remove every map setting written under the flat prefix, once, on sight.
 *
 * Removed rather than moved across to the member reading them now: nobody can say whose
 * they were, and handing them to whoever opens the map first is precisely the fault. The
 * price is that everyone loses the look and radius they had set before this; the map opens
 * on its defaults once and remembers again from there.
 *
 * A keyed key starts with the same root, so the two are told apart by what follows it: a
 * legacy name (`look`, `center`) carries no dot, a keyed one begins with the gradidoID and
 * therefore does (`76378cbb-...` + `.` + `look`). Measured: a gradidoID is a UUID, 36
 * characters, no dot in it.
 */
export function forgetLegacyMapPrefs() {
  try {
    const storage = window.localStorage
    if (!storage) return 0
    const legacy = []
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (!key?.startsWith(MAP_PREF_ROOT)) continue
      if (key.slice(MAP_PREF_ROOT.length).includes('.')) continue
      legacy.push(key)
    }
    // Collected first, removed after: removing inside the walk shifts every later index.
    for (const key of legacy) storage.removeItem(key)
    return legacy.length
  } catch {
    // Storage refusing to work must not take the map down with it -- the same answer
    // readPref and writePref give on the page.
    return 0
  }
}
