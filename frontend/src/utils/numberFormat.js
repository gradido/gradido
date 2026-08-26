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
 * One set of tools per language, built once and kept.
 *
 * ⚠️ Building an `Intl.NumberFormat` is the expensive part of Intl -- formatting with a
 * built one is cheap. The display is redrawn on every key press and formats every number in
 * the expression, so a basket of five items used to build ten formatters per digit pressed,
 * on the kind of phone that stands at a market stall. Now it builds one per language, ever.
 *
 * ⚠️ Read from Intl rather than kept in a table of our own. A table would be a second source
 * of truth next to `numberFormats` in i18n.js, and the two would drift the first time a
 * language is added -- Turkish is already missing from that one.
 *
 * ★ The separator and the grouping are built TOGETHER, from the same resolved language. That
 * is what makes the fallback safe: if one fell back to English while the other did not, the
 * result would be an English separator on a number grouped some other way -- a shape no
 * language has.
 */
const toolsByLocale = new Map()

const buildTools = (locale) => ({
  groups: new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
  decimalSeparator:
    new Intl.NumberFormat(locale, { minimumFractionDigits: 1 })
      .formatToParts(1.1)
      .find((part) => part.type === 'decimal')?.value ?? '.',
})

/**
 * The language the tools are actually built from -- English wherever the asked-for one is
 * not one this runtime knows.
 *
 * ⚠️ Asked of Intl explicitly, NOT caught from the constructor. `Intl.NumberFormat` only
 * throws on a MALFORMED tag; a well-formed one it does not know -- "xx-nonsense" -- it
 * accepts and quietly resolves to the locale of the machine it runs on. A try/catch would
 * therefore give somebody with an unknown language the separators of whatever the browser
 * or the build agent happens to be set to, which is a different answer on every machine,
 * instead of the English fallback the wallet uses everywhere else.
 */
const resolveLocale = (tag) => {
  try {
    return Intl.NumberFormat.supportedLocalesOf(tag).length > 0 ? tag : DEFAULT_LOCALE
  } catch {
    // A malformed tag -- the one case the constructor would have thrown on.
    return DEFAULT_LOCALE
  }
}

const toolsFor = (locale) => {
  const tag = locale || DEFAULT_LOCALE
  let tools = toolsByLocale.get(tag)
  if (!tools) {
    tools = buildTools(resolveLocale(tag))
    toolsByLocale.set(tag, tools)
  }
  return tools
}

/**
 * The character this language puts between the whole part and the decimals -- the one the
 * calculator's separator key has to carry. German gets a comma, English a full stop.
 */
export const decimalSeparatorFor = (locale) => toolsFor(locale).decimalSeparator

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

  const tools = toolsFor(locale)
  const sign = negative ? '-' : ''
  const head = tools.groups.format(Number(whole || '0'))
  if (decimals === null) {
    return sign + head
  }
  return sign + head + tools.decimalSeparator + decimals
}
