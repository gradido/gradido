// AI-GENERATED — not an architecture reference

/**
 * The separators a locale uses, and how to draw a number somebody is still typing.
 *
 * The wallet already formats every finished number through `$n(value, 'decimal')`, and that
 * stays the way to print one. What it cannot do is draw a HALF-typed number: `$n(4)` is
 * "4,00", but somebody who has pressed `4` and then the separator key has to see "4," --
 * with nothing behind it yet, and without two decimals appearing that they did not type.
 *
 * So the calculator draws the integer part through Intl (same engine as `$n`, therefore the
 * same grouping and the same separators) and appends the typed decimals literally.
 */

const DEFAULT_LOCALE = 'en'

/**
 * ⚠️ Read from Intl rather than kept in a table of our own. A table would be a second
 * source of truth next to `numberFormats` in i18n.js, and the two would drift the first
 * time a language is added -- Turkish is already missing from that one.
 */
const separatorsOf = (locale, value) => {
  try {
    const parts = new Intl.NumberFormat(locale, { minimumFractionDigits: 1 }).formatToParts(value)
    return parts
  } catch {
    // An unknown locale tag must not take the calculator down; English is the fallback the
    // wallet uses everywhere else too.
    return new Intl.NumberFormat(DEFAULT_LOCALE, { minimumFractionDigits: 1 }).formatToParts(value)
  }
}

/**
 * The character this locale puts between the whole part and the decimals -- the one the
 * calculator's separator key has to carry. German gets a comma, English a full stop.
 */
export const decimalSeparatorFor = (locale) => {
  const part = separatorsOf(locale, 1.1).find((p) => p.type === 'decimal')
  return part ? part.value : '.'
}

/**
 * Draws one number of the calculator's expression the way it should appear while it is
 * being typed.
 *
 * `raw` is always in dot notation without grouping -- that is the calculator's internal
 * form, and the only form arithmetic ever sees. What comes back is for the eye alone.
 *
 * ⚠️ The decimals are appended as they were typed, NOT rounded. "6.5" stays "6,5" and does
 * not become "6,50": the second decimal has not been pressed yet, and printing it would put
 * a digit on the screen that nobody entered.
 */
export const formatTypedNumber = (raw, locale) => {
  if (raw === '' || raw === undefined || raw === null) {
    return ''
  }
  // The calculator only ever passes strings; the coercion is for whoever calls this next.
  const text = String(raw)
  const negative = text.startsWith('-')
  const body = negative ? text.slice(1) : text
  const dot = body.indexOf('.')
  const whole = dot === -1 ? body : body.slice(0, dot)
  const decimals = dot === -1 ? null : body.slice(dot + 1)

  let head
  try {
    head = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(whole || '0'))
  } catch {
    // ⚠️ The same fallback the separator uses. Falling back to the ungrouped digits here
    // while `decimalSeparatorFor` falls back to English would put an English separator on a
    // number with no grouping -- a shape no locale has.
    head = new Intl.NumberFormat(DEFAULT_LOCALE, { maximumFractionDigits: 0 }).format(
      Number(whole || '0'),
    )
  }
  const sign = negative ? '-' : ''
  if (decimals === null) {
    return sign + head
  }
  return sign + head + decimalSeparatorFor(locale) + decimals
}
