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

  /**
   * The amount with its direction, and without the currency.
   *
   * Incoming money leads with a plus; outgoing already carries the minus that `formatAmount`
   * writes, so nothing is put in front of it.
   *
   * Its own formatter because the booking list beside the overview prints amounts in a
   * column three of twelve wide, where `-45,00 GDD` broke over two lines as soon as the
   * window narrowed. Every amount in that list is in GDD, so the unit was saying nothing and
   * costing the width that made it wrap. (Bernd, 27.08.2026)
   */
  const formatSignedAmount = (value) => {
    const formattedAmount = formatAmount(value)
    if (formattedAmount === '') return ''

    const numValue = Number(value)
    if (isNaN(numValue)) return formattedAmount

    return (numValue >= 0 ? '+ ' : '') + formattedAmount
  }

  const formatGDD = (value) => {
    const signed = formatSignedAmount(value)
    return signed === '' ? '' : signed + ' GDD'
  }

  return { amount: formatAmount, signedAmount: formatSignedAmount, GDD: formatGDD }
}

/**
 * The shapes a typed amount is allowed to have. Everything else is not a number here.
 *
 * ⛔ Stating the allowed shapes is the whole guard, and a character class is not enough.
 * `[\d.,]+` accepts `1.2.3`, and the reader then quietly made 12.3 out of it -- while the
 * hand-rolled reader this replaced returned NaN and left the payment button grey. A field
 * that turns a fat-fingered entry into a chargeable amount is worse than one that refuses it.
 *
 * ⚠️ The trailing `\d*` in the decimal shapes is deliberate: `6,` is a number half typed,
 * not a broken one, and refusing it mid-word would make the field impossible to type in.
 */
const HAS_A_DIGIT = /\d/
const PLAIN = /^\d+$/
const ONE_SEPARATOR = /^\d*[.,]\d*$/
const GROUPED = [/^[1-9]\d{0,2}(\.\d{3})+$/, /^[1-9]\d{0,2}(,\d{3})+$/]
const GROUPED_WITH_DECIMALS = [/^[1-9]\d{0,2}(\.\d{3})+,\d*$/, /^[1-9]\d{0,2}(,\d{3})+\.\d*$/]

/** The digits of a typed amount, without sign or whitespace, or null if it is not one. */
const digitsOf = (text) => {
  if (text === null || text === undefined) {
    return null
  }
  const cleaned = String(text).trim().replace(/\s/g, '')
  const digits = cleaned.replace(/^[-+]/, '')
  if (!HAS_A_DIGIT.test(digits)) {
    return null
  }
  const wellFormed =
    PLAIN.test(digits) ||
    ONE_SEPARATOR.test(digits) ||
    GROUPED.some((shape) => shape.test(digits)) ||
    GROUPED_WITH_DECIMALS.some((shape) => shape.test(digits))
  return wellFormed ? { digits, negative: cleaned.startsWith('-') } : null
}

/**
 * Splits an unsigned typed number into what is in front of the decimals and the decimals
 * themselves, `decimals: null` meaning there are none.
 *
 * ⛔ A number is grouped only if it looks grouped from END TO END. Asking merely "are there
 * three digits behind the separator" got two cases wrong: `0,123` read as grouping, though
 * no language groups behind a bare zero, and `1.234.567` did not, because there the three
 * digits sit behind the LAST of several separators.
 */
const splitTypedNumber = (digits) => {
  const lastSeparator = Math.max(digits.lastIndexOf('.'), digits.lastIndexOf(','))
  if (lastSeparator === -1 || GROUPED.some((shape) => shape.test(digits))) {
    return { whole: digits.replace(/[.,]/g, ''), decimals: null }
  }
  return {
    whole: digits.slice(0, lastSeparator).replace(/[.,]/g, ''),
    decimals: digits.slice(lastSeparator + 1),
  }
}

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
 * Forgiving is not the same as credulous. The shapes above say what a number may look like;
 * within those, two rules make every entry unambiguous without asking the language:
 *
 * 1. **The last separator is the decimal separator.** Everything before it is grouping and
 *    drops out. `1.234,50` and `1,234.50` both give 1234.5.
 * 2. **Unless the number is grouped from end to end**, in which case there are no decimals
 *    at all. `1.234` gives 1234 and `1.234.567` gives 1234567, while `6.30` gives 6.3 and
 *    `0,123` gives 0.123.
 *
 * ⛔ Rule 2 is a decision, not an accident, and it rests on the currency: GDD carries two
 * decimals -- `numberFormats` in i18n.js fixes them, the calculator's keypad refuses a third,
 * and `withAtMostTwoDecimals` below refuses one in the payment field. Do not "tidy" this
 * away; without it, `1.234` typed at a desk keyboard would be read as one and a bit.
 *
 * @returns the number, or NaN for anything that is not one. NaN rather than 0 on purpose --
 *          "nothing usable" and "zero" are different answers, and a silent 0 on a payment
 *          screen is the worse of the two.
 */
export const parseAmount = (text) => {
  const read = digitsOf(text)
  if (read === null) {
    return NaN
  }
  const { whole, decimals } = splitTypedNumber(read.digits)
  const value = decimals === null ? Number(whole) : Number(`${whole}.${decimals}`)
  return read.negative ? -value : value
}

/**
 * Cuts a typed amount back to two digits behind its last separator, which is what GDD has.
 *
 * ⛔ The ambiguity this exists for: `6,305` reads perfectly well as six thousand three
 * hundred and five, and it reads exactly the same when it was `6,30` with a slipped finger.
 * Nothing can tell those apart afterwards, so the field does not let the second one arise --
 * the third digit goes as it is typed, the same rule the calculator's keypad enforces with
 * the warning sound.
 *
 * ⚠️ A number with SEVERAL groups is left alone, because there the reading is not ambiguous:
 * `1.234.567` cannot be anything but a whole number, and mangling a pasted one into 1234.56
 * would be the fault this guards against, not the guard.
 *
 * ⚠️ The price, weighed and accepted: a grouped whole number with ONE separator cannot be
 * typed here. `1.234` becomes `1.23` under the finger, visibly, and the amount is entered as
 * `1234` -- one keystroke fewer and no ambiguity at all.
 *
 * Anything that is not a number goes back untouched, and so does the whitespace around it:
 * cutting the digits but keeping a trailing space used to leave the entry exactly as long as
 * it was, so the guard did nothing at all.
 */
export const withAtMostTwoDecimals = (text) => {
  const typed = String(text ?? '')
  const body = typed.trimEnd()
  const tail = typed.slice(body.length)
  const cleaned = body.trim().replace(/\s/g, '')
  if (!HAS_A_DIGIT.test(cleaned) || !/^[-+]?[\d.,]+$/.test(cleaned)) {
    return typed
  }

  const lastSeparator = Math.max(cleaned.lastIndexOf('.'), cleaned.lastIndexOf(','))
  if (lastSeparator === -1) {
    return typed
  }
  const behind = cleaned.slice(lastSeparator + 1)
  const separators = (cleaned.match(/[.,]/g) || []).length
  const unmistakablyGrouped = separators >= 2 && GROUPED.some((shape) => shape.test(cleaned))
  if (behind.length <= 2 || unmistakablyGrouped || !body.endsWith(behind)) {
    return typed
  }
  return body.slice(0, body.length - (behind.length - 2)) + tail
}
