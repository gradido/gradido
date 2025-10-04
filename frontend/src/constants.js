export const GDD_PER_HOUR = 20
export const PAGE_SIZE = 25
// compound interest factor (decay reversed) for 14 days (hard coded backend link timeout)
// 365.2425 days per year (gregorian calendar year)
export const LINK_COMPOUND_INTEREST_FACTOR = Math.pow(2, 14 / 365.2425)
