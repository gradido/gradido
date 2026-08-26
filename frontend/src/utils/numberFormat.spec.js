// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { decimalSeparatorFor, formatTypedNumber } from './numberFormat'

/**
 * How the calculator draws a number somebody is still typing.
 *
 * ⛔ This is not the same job as `$n(value, 'decimal')`, and the difference is the whole
 * reason the module exists: `$n` draws a FINISHED number and always gives it two decimals.
 * Somebody who has pressed `4` and then the separator key has to see "4," -- not "4,00",
 * which would put digits on the display that nobody entered.
 */
describe('decimalSeparatorFor', () => {
  it.each([
    ['de', ','],
    ['en', '.'],
    ['fr', ','],
    ['tr', ','],
  ])('gives %s the separator its keyboard writes: %s', (locale, expected) => {
    expect(decimalSeparatorFor(locale)).toBe(expected)
  })

  /** This is the character the one separator key on the keypad carries. */
  it('falls back to a full stop for a language tag that does not exist', () => {
    expect(decimalSeparatorFor('xx-nonsense')).toBe('.')
    expect(decimalSeparatorFor(undefined)).toBe('.')
  })

  /**
   * ⚠️ A DIFFERENT path through Intl from the one above, and the reason the fallback cannot
   * be a `try/catch` alone. "xx-nonsense" is a WELL-FORMED tag Intl merely does not know, so
   * it is accepted and quietly resolved; "en_US" -- the POSIX spelling that leaks out of a
   * `LANG` variable -- is not a language tag at all, and Intl throws on it. One underscore
   * in a config file must not take the keypad down, so both paths end at the same full stop.
   */
  it.each([['en_US'], ['e'], ['de--DE']])(
    'falls back to a full stop for the malformed tag %s',
    (locale) => {
      expect(decimalSeparatorFor(locale)).toBe('.')
    },
  )
})

describe('formatTypedNumber', () => {
  it.each([
    ['de', '1234.5', '1.234,5'],
    ['en', '1234.5', '1,234.5'],
    ['es', '1234.5', '1234,5'],
    ['tr', '1234.5', '1.234,5'],
  ])('draws %s the way that language groups: %s -> %s', (locale, raw, expected) => {
    expect(formatTypedNumber(raw, locale)).toBe(expected)
  })

  /**
   * ⛔ The decimals are appended exactly as typed and never rounded or padded. Half a number
   * has to look like half a number, or the display answers a keystroke that has not happened.
   */
  it.each([
    ['4.', '4,'],
    ['6.5', '6,5'],
    ['6.50', '6,50'],
    ['0.', '0,'],
  ])('leaves the typed decimals as they are: %s -> %s', (raw, expected) => {
    expect(formatTypedNumber(raw, 'de')).toBe(expected)
  })

  it('draws a whole number without a separator at all', () => {
    expect(formatTypedNumber('7', 'de')).toBe('7')
  })

  it('keeps a minus in front', () => {
    expect(formatTypedNumber('-1234.5', 'de')).toBe('-1.234,5')
  })

  it.each([[''], [null], [undefined]])('draws nothing for %s', (raw) => {
    expect(formatTypedNumber(raw, 'de')).toBe('')
  })

  /**
   * ★ The grouping and the separator have to fall back TOGETHER. If one went to English and
   * the other did not, the result would be an English full stop on a number grouped some
   * other way -- a shape no language has, on a page about money.
   */
  it('falls back to English for grouping and separator alike', () => {
    expect(formatTypedNumber('1234.5', 'xx-nonsense')).toBe('1,234.5')
  })

  /** ⚠️ And the same for a tag Intl rejects outright rather than resolving. */
  it('falls back to English for a malformed tag as well', () => {
    expect(formatTypedNumber('1234.5', 'en_US')).toBe('1,234.5')
  })

  /** Asked twice, answered the same: the formatter is built once per language and kept. */
  it('gives the same answer on a second call', () => {
    expect(formatTypedNumber('1234.5', 'de')).toBe(formatTypedNumber('1234.5', 'de'))
  })
})
