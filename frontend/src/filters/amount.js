export const createFilters = (i18n) => {
  const formatAmount = (value) => {
    if (value === null || value === undefined) return ''
    try {
      const numValue = Number(value)
      if (isNaN(numValue)) return ''
      return i18n.global.n(numValue, 'decimal').replace('-', '− ')
    } catch (error) {
      return ''
    }
  }

  const formatGDD = (value) => {
    const formattedAmount = formatAmount(value)
    if (formattedAmount === '') return ''

    const numValue = Number(value)
    if (isNaN(numValue)) return formattedAmount + ' GDD'

    const prefix = numValue >= 0 ? '+ ' : numValue < 0 ? '' : ''
    return prefix + formattedAmount + ' GDD'
  }

  return { amount: formatAmount, GDD: formatGDD }
}

/**
 * The shape of a number that is grouped all the way through: a first group of one to three
 * digits, then nothing but groups of exactly three, and the SAME character between them.
 *
 * ⛔ This regex IS rule 2 below, stated positively, and stating it positively is what makes
 * it safe. Asking only "are there three digits behind the separator" gets two cases wrong:
 * `0,123` would read as grouping, though no language groups behind a bare zero, and
 * `1.234.567` would not, because there the three digits sit behind the LAST of several
 * separators. A number is grouped only if it looks grouped from end to end.
 */
const GROUPED_SHAPES = [/^[1-9]\d{0,2}(\.\d{3})+$/, /^[1-9]\d{0,2}(,\d{3})+$/]

/**
 * Splits an unsigned typed number into what is in front of the decimals and the decimals
 * themselves, `decimals: null` meaning there are none.
 *
 * The one place the two rules live. `parseAmount` and `withAtMostTwoDecimals` both go
 * through here, because a field that refuses what the reader accepts is worse than either.
 */
const splitTypedNumber = (digits) => {
  const lastSeparator = Math.max(digits.lastIndexOf('.'), digits.lastIndexOf(','))
  if (lastSeparator === -1 || GROUPED_SHAPES.some((shape) => shape.test(digits))) {
    return { whole: digits.replace(/[.,]/g, ''), decimals: null }
  }
  return {
    whole: digits.slice(0, lastSeparator).replace(/[.,]/g, ''),
    decimals: digits.slice(lastSeparator + 1),
  }
}

/** Everything a typed amount may consist of. Anything else is not a number and says so. */
const TYPED_NUMBER = /^[-+]?[\d.,]+$/

/**
 * Reads an amount somebody typed. Used by the card payment's amount field and by the
 * calculator's own reading of it -- those two, and deliberately those two: the rest of the
 * wallet still reads amounts its own way, and moving it over is its own delivery.
 *
 * ## Why this is deliberately NOT locale-aware, unlike `formatAmount` above
 *
 * Writing has to be local -- German reads 6,30 and English 6.30, and a till that prints the
 * wrong one looks broken. Reading is the opposite: it has to be forgiving, because the same
 * field is filled from a phone keypad, from a desk keyboard, and by the calculator page.
 * Asking the interface language what a typed character meant would make the SAME keystrokes
 * mean different amounts depending on a setting nobody touched -- on the number that gets
 * charged.
 *
 * Two rules make every realistic entry unambiguous without asking:
 *
 * 1. **The last separator is the decimal separator.** Everything before it is grouping and
 *    drops out. `1.234,50` and `1,234.50` both give 1234.5.
 * 2. **Unless the whole number is grouped from end to end**, in which case there are no
 *    decimals at all. `1.234` gives 1234 and `1.234.567` gives 1234567, while `6.30` gives
 *    6.3 and `0,123` gives 0.123.
 *
 * ⛔ Rule 2 is a decision, not an accident, and it rests on the currency: GDD carries two
 * decimals -- `numberFormats` in i18n.js fixes them, the calculator's keypad refuses a third,
 * and `withAtMostTwoDecimals` below refuses one in the payment field. So three digits behind
 * a decimal separator cannot happen, and a number that looks grouped is grouped. Do not
 * "tidy" this away; without it, `1.234` typed at a desk keyboard would be read as one and a
 * bit.
 *
 * On a phone none of this comes up for grouping: the field carries `inputmode="decimal"`, so
 * there is a keypad with a single separator key.
 *
 * @returns the number, or NaN for anything that is not one. NaN rather than 0 on purpose --
 *          "nothing usable" and "zero" are different answers, and a silent 0 on a payment
 *          screen is the worse of the two.
 */
export const parseAmount = (text) => {
  if (text === null || text === undefined) {
    return NaN
  }
  const cleaned = String(text).trim().replace(/\s/g, '')
  if (cleaned === '' || !TYPED_NUMBER.test(cleaned)) {
    return NaN
  }

  const negative = cleaned.startsWith('-')
  const { whole, decimals } = splitTypedNumber(cleaned.replace(/^[-+]/, ''))
  const value = decimals === null ? Number(whole) : Number(`${whole}.${decimals}`)
  return negative ? -value : value
}

/**
 * Cuts a typed amount back to two digits behind its last separator, which is what GDD has.
 *
 * ⛔ This is STRICTER than the reader above, and on purpose. The reader has to make sense of
 * whatever reaches it -- a prefilled `1.234,50`, a pasted figure -- so it accepts a number
 * that is grouped from end to end. A field somebody is typing into has to do the opposite
 * and let no ambiguity arise in the first place: `6,305` reads as six thousand three hundred
 * and five, and reads exactly the same when it was `6,30` with a slipped finger. There is no
 * telling those apart afterwards, so the third digit is refused as it is typed -- the same
 * rule the calculator's keypad enforces with the warning sound.
 *
 * ⚠️ The price, and it was weighed: a grouped whole number cannot be TYPED here any more.
 * `1.234` becomes `1.23` under the finger, visibly, and the amount is entered as `1234`.
 * That is one keystroke fewer and no ambiguity at all. What arrives already formatted --
 * the calculator's own handover -- carries two decimals and passes untouched.
 *
 * Anything that is not a number at all goes back untouched: half-typed entries are how a
 * field gets filled, and correcting them mid-word is how a field becomes impossible to
 * type in.
 */
export const withAtMostTwoDecimals = (text) => {
  const typed = String(text ?? '')
  const cleaned = typed.trim().replace(/\s/g, '')
  if (cleaned === '' || !TYPED_NUMBER.test(cleaned)) {
    return typed
  }

  const lastSeparator = Math.max(cleaned.lastIndexOf('.'), cleaned.lastIndexOf(','))
  if (lastSeparator === -1) {
    return typed
  }
  const behind = cleaned.slice(lastSeparator + 1)
  if (behind.length <= 2 || !typed.endsWith(behind)) {
    return typed
  }
  return typed.slice(0, typed.length - (behind.length - 2))
}
