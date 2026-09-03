export const GDD_PER_HOUR = 20
export const PAGE_SIZE = 25

/**
 * The booking column beside the overview.
 *
 * `LAST_TRANSACTIONS_ROWS` is what the column shows; `LAST_TRANSACTIONS_PAGE_SIZE` is what
 * the layout has to ask for to fill it. The two are not the same number because the column
 * draws from the same list as the transactions page and then drops three kinds of row it
 * does not show: the two virtual ones the backend adds to page one (decay, open links) and
 * every creation. At a page size of eight the column would run short as soon as a member had
 * a creation among their newest bookings -- which is the normal case, not the exception.
 *
 * ⚠️ The headroom is an estimate, not a guarantee: a member with five creations in a row
 * still sees fewer than eight. Raise the fetch if the column looks sparse; it is a page of
 * bookings, not a promise of eight.
 */
export const LAST_TRANSACTIONS_ROWS = 8
export const LAST_TRANSACTIONS_PAGE_SIZE = 12
// compound interest factor (decay reversed) for 14 days (hard coded backend link timeout)
// 365.2425 days per year (gregorian calendar year)
export const LINK_COMPOUND_INTEREST_FACTOR = Math.pow(2, 14 / 365.2425)

/**
 * The contacts panel in the right-hand column (KF-009).
 *
 * `CONTACTS_PANEL_PAGE_SIZE` is what the panel asks the server for; `CONTACTS_PANEL_ROWS`
 * is how many of them stand in the recent list. They are not the same number for the reason
 * the booking column's pair is not: the favourites are lifted out of that page into the
 * row above, so the list below draws from what is left.
 *
 * ⚠️ The favourites row therefore shows the favourites AMONG this page -- a member whose
 * last exchange with somebody they marked is older than these twenty contacts does not see
 * them in the row. The tile at the end of the row leads to `/contacts`, where every
 * favourite stands on top, and that is the whole of the answer today: `contactList` can be
 * paged and searched but not filtered to favourites, so closing the gap properly is a
 * server-side filter, not another constant here.
 */
export const CONTACTS_PANEL_PAGE_SIZE = 20
export const CONTACTS_PANEL_ROWS = 5

/**
 * Where this wallet's layout changes from a phone to a desk, in pixels.
 *
 * ⛔ 1025, NOT Bootstrap's own 992. `assets/scss/custom/gradido-custom/_grid-breakpoint.scss`
 * overrides `$grid-breakpoints` with `lg: 1025px`, so every `d-none d-lg-block` and
 * `d-block d-lg-none` in the tree switches there. Writing 992 here put a 33-pixel band on
 * screen in which JavaScript said "desk" while the stylesheet still said "phone", and
 * NEITHER column rendered -- on an iPad in landscape, among others.
 *
 * ⚠️ This is a second declaration of one boundary, and it can only ever be a copy: the
 * number lives in SCSS, which the bundle compiles away. What keeps the two together is a
 * measurement, not care -- `useViewport.drift.spec.js` reads the COMPILED stylesheet the
 * app ships and fails if the `-lg-` utilities have moved away from this number.
 */
export const LG_BREAKPOINT_PX = 1025
