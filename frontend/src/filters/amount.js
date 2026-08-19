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
 * Reads an amount somebody typed, and does it the same way everywhere.
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
 * 1. **Several separators: the last one is the decimal separator.** Everything before it is
 *    grouping and drops out. `1.234,50` and `1,234.50` both give 1234.5.
 * 2. **One separator with more than two digits behind it was a grouping separator.**
 *    `1.234` gives 1234, while `6.30` gives 6.3.
 *
 * ⛔ Rule 2 is a decision, not an accident, and it rests on the currency: GDD carries two
 * decimals -- `numberFormats` in i18n.js fixes them and the calculator refuses a third. So
 * three digits behind a separator cannot be decimals. Do not "tidy" this away; without it,
 * `1.234` typed at a desk keyboard would be read as one and a bit.
 *
 * On a phone none of this comes up: the field carries `inputmode="decimal"`, so there is a
 * keypad and no grouping separator can be entered at all.
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
  if (cleaned === '' || !/^[-+]?[\d.,]+$/.test(cleaned)) {
    return NaN
  }

  const lastSeparator = Math.max(cleaned.lastIndexOf('.'), cleaned.lastIndexOf(','))
  if (lastSeparator === -1) {
    return Number(cleaned)
  }

  const separatorCount = (cleaned.match(/[.,]/g) || []).length
  const digitsBehind = cleaned.length - lastSeparator - 1
  if (separatorCount === 1 && digitsBehind > 2) {
    return Number(cleaned.replace(/[.,]/g, ''))
  }

  const whole = cleaned.slice(0, lastSeparator).replace(/[.,]/g, '')
  const decimals = cleaned.slice(lastSeparator + 1)
  return Number(`${whole}.${decimals}`)
}
