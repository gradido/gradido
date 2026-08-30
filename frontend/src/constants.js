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
