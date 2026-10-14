// AI-GENERATED — not an architecture reference

/**
 * The event link of Event-Matching: `community-host/event?interest=…&details=…&remote=1&v=1`.
 * A host builds it for the people of a congress, a training or a course; whoever opens it is
 * offered one entry for the matching, an interest -- "I love ‹interest›".
 *
 * The parameters are a promise. A link that stands in a mail or on a slide has to work for good,
 * so none of the names below is ever renamed, and what is not known is passed over without a
 * word:
 *
 * - `interest`  what completes the sentence. Without it there is no event link.
 * - `details`   a line or two that explain it. May be missing.
 * - `remote`    `0` = only where the member lives. Everything else, a missing one included,
 *               means the entry is found from afar as well.
 * - `v`         the version of this promise. Only `1` is defined, so it is not read at all; a
 *               later version may add parameters and never changes the meaning of these.
 *
 * ⛔ All of it is somebody else's text. It is shown as text and never as markup, it is cut to
 * what an entry holds, and none of the four says where to go on to: the page's own buttons and
 * the links of the bar above it lead to the registration and the sign-in without the address's
 * query (`queryStaysBehind` on the route). The tap on the link is the yes: the entry is made
 * without a form, and stands in the member's list to be paused or deleted (KA-014).
 *
 * (One parameter of another kind works in this address as in that of every page of the same
 * layout: `project`, which the layout reads off the address itself. It names a project this
 * community has set up, and a sign-in then leads to that project's space -- the link's entry
 * is let go, as with every sign-in that has a place of its own to lead to.)
 */

/** As long as the sentence of an entry may be (the column, and the field of the form). */
export const EVENT_MATCHING_SUMMARY_MAX_CHARS = 160
/** As long as the details of an entry may be (MATCHING_ENTRY_DETAILS_MAX_CHARS in `shared`). */
export const EVENT_MATCHING_DETAILS_MAX_CHARS = 2000
/**
 * As long as the wallet keeps what a link offered somebody who was not signed in: an hour. It
 * is kept for the sign-in that follows the link -- the page's button, the form, perhaps a
 * password looked up -- and there is nobody yet whose it could be. Without an end it would be
 * made for whoever signs in on this browser next, weeks after the event.
 */
export const EVENT_MATCHING_ENTRY_KEPT_MS = 60 * 60 * 1000

// vue-router hands a parameter that stands twice over as a list, and one without a value
// (`?interest`) as null. The first one counts.
const first = (value) => (Array.isArray(value) ? value[0] : value)

// Cut to `max` places, as the field of the form counts them. Not through the middle of a
// character that takes two of them (an emoji): the half left over would be no character.
const cut = (text, max) => {
  if (text.length <= max) return text
  const last = text.charCodeAt(max - 1)
  const halfACharacter = last >= 0xd800 && last <= 0xdbff
  return text.slice(0, halfACharacter ? max - 1 : max).trimEnd()
}

/**
 * What an event link says, or null where the address is none.
 *
 * @param {Record<string, string | null | (string | null)[]>} query the query of the route
 * @returns {{ summary: string, details: string | null, remote: boolean } | null}
 */
export const readEventMatchingLink = (query) => {
  // One line: the sentence stands in a single-line field, and a line break in it would not
  // survive the form.
  const summary = cut(
    String(first(query?.interest) ?? '')
      .replace(/\s+/g, ' ')
      .trim(),
    EVENT_MATCHING_SUMMARY_MAX_CHARS,
  )
  if (!summary) return null
  const details = cut(String(first(query?.details) ?? '').trim(), EVENT_MATCHING_DETAILS_MAX_CHARS)
  return { summary, details: details || null, remote: first(query?.remote) !== '0' }
}

/**
 * The entry as the store keeps it for a visitor who is not signed in (`eventMatchingEntry`):
 * with the moment it was kept, by this device's clock.
 *
 * @param {{ summary: string, details: string | null, remote: boolean }} entry
 * @param {number} [now] milliseconds, this device's clock
 */
export const eventMatchingEntryToKeep = (entry, now = Date.now()) => ({ ...entry, keptAt: now })

/**
 * What the store has kept, where it still counts: kept less than an hour ago
 * (EVENT_MATCHING_ENTRY_KEPT_MS). Null for nothing, for an older one, and for one kept "after
 * now" -- a clock that was set back says nothing about its age.
 *
 * @param {{ summary: string, details: string | null, remote: boolean, keptAt: number } | null} kept
 * @param {number} [now] milliseconds, this device's clock
 * @returns {{ summary: string, details: string | null, remote: boolean } | null}
 */
export const keptEventMatchingEntry = (kept, now = Date.now()) => {
  if (!kept || typeof kept.keptAt !== 'number') return null
  const age = now - kept.keptAt
  if (age < 0 || age >= EVENT_MATCHING_ENTRY_KEPT_MS) return null
  return { summary: kept.summary, details: kept.details, remote: kept.remote }
}

/**
 * The entry of an event link as the entries page takes it (useEntryDraft): always an
 * interest -- an offer or a need is the member's own to add -- and `unlessThere`: the entries
 * page makes it at once, without the form, and says nothing where the member has it (KA-014).
 *
 * @param {{ summary: string, details: string | null, remote: boolean }} entry
 */
export const eventMatchingEntryDraft = (entry) => ({
  summary: entry.summary,
  details: entry.details ?? '',
  remote: entry.remote,
  matchingType: 'interesse',
  unlessThere: true,
})
