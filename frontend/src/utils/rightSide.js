// AI-GENERATED — not an architecture reference

/**
 * Which panel the right-hand column carries on a given route -- and, from the same answer,
 * whether the column is there at all.
 *
 * ## Why this is a list of routes rather than a default
 *
 * Until now the switch read the other way round: three named sections got their own panel
 * and *everything else* got the booking list. So the last transactions stood beside the
 * calculator, the scanner, both code pages, the send form, the booking page itself and the
 * information page -- nowhere by decision, everywhere by default.
 *
 * Two reasons to turn it around (Bernd, 27.08.2026):
 *
 * - ⛔ **The codes are shown to somebody else.** `/my-gradido-card` and `/my-thank-you-card`
 *   exist to be held out across a counter, and `/scan` points a camera at another person's
 *   phone. Whoever is looking at the code was reading the last bookings next to it. That is
 *   not untidiness, it is somebody else's money history in a stranger's field of view.
 * - The rest is repetition: on `/transactions` the column repeated the page it stands
 *   beside, and on the till tools it had nothing to do with what the page is for.
 *
 * `/overview` is the one page the list belongs to, and there it stays.
 *
 * ## One answer, two questions
 *
 * The column is only drawn where there is something to draw. `RightSide` renders an empty
 * slot in a `BContainer` that still takes three of twelve columns -- with the menu opposite
 * that leaves the content half the screen for nothing, which is exactly the fault that was
 * fixed for the settings pages on 24.08.2026. So the layout asks `hasRightSide` before it
 * renders the column, and `RightSide` asks `rightSideSlot` for what goes in it. Both read
 * this file, so the two cannot drift apart -- the layout used to carry its own copy of the
 * condition (`!settingsChrome`), which was already one route list too many.
 */

// Keyed by the first path segment, which is how a section is addressed here:
// `/contributions/contribute` and `/matching/entries` are the same section as their root.
const SLOT_BY_SECTION = {
  overview: 'transactions',
  contributions: 'contributions',
  matching: 'matching',
}

/**
 * @param {string} path  the current route path
 * @returns {string} the name of the slot to render, `'empty'` where there is none
 *
 * ⚠️ Reads the first segment rather than stripping the rest, because a TRAILING SLASH is a
 * path a router really hands over: `/overview/` matches the `/overview` record. The pattern
 * this replaces (`^\/(.+?)(\/.+)?$`, carried over from RightSide) needed a character after
 * the slash, so it answered `overview/` and the section was missed. It could not show while
 * the booking list was the DEFAULT -- a missed section landed on the same panel anyway --
 * and the moment the list became the exception it would have cost the overview its column.
 * (coderabbit at PR #3811, verified against both patterns over every path in the spec.)
 */
export const rightSideSlot = (path) =>
  SLOT_BY_SECTION[String(path ?? '').match(/^\/([^/]+)/)?.[1]] ?? 'empty'

/**
 * @param {string} path  the current route path
 * @returns {boolean} whether the column has anything to show, and should be rendered at all
 */
export const hasRightSide = (path) => rightSideSlot(path) !== 'empty'
