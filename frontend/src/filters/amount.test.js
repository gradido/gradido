import { describe, it, expect, vi } from 'vitest'
import { createFilters, parseAmount, withAtMostTwoDecimals } from './amount'

const i18nMock = {
  global: {
    n: vi.fn((n) => n.toString()),
  },
}

const { amount, GDD } = createFilters(i18nMock)

describe('amount filters', () => {
  describe('amount', () => {
    it('returns empty string when called with null', () => {
      expect(amount(null)).toBe('')
    })

    it('returns empty string when called with undefined', () => {
      expect(amount(undefined)).toBe('')
    })

    it('returns 0 when called with 0', () => {
      expect(amount(0)).toBe('0')
    })

    it('returns a leading proper minus sign when called with negative value', () => {
      i18nMock.global.n.mockReturnValueOnce('-1')
      expect(amount(-1)).toBe('− 1')
    })

    it('returns empty string when called with non-numeric string', () => {
      expect(amount('not a number')).toBe('')
    })
  })

  describe('GDD', () => {
    it('returns empty string when called with null', () => {
      expect(GDD(null)).toBe('')
    })

    it('returns empty string when called with undefined', () => {
      expect(GDD(undefined)).toBe('')
    })

    it('returns "+ 0 GDD" when called with 0', () => {
      i18nMock.global.n.mockReturnValueOnce('0')
      expect(GDD(0)).toBe('+ 0 GDD')
    })

    it('returns a leading proper minus sign when called with negative value', () => {
      i18nMock.global.n.mockReturnValueOnce('-1')
      expect(GDD(-1)).toBe('− 1 GDD')
    })

    it('returns a leading plus sign when called with positive value', () => {
      i18nMock.global.n.mockReturnValueOnce('1')
      expect(GDD(1)).toBe('+ 1 GDD')
    })

    it('returns empty string when called with not a number value', () => {
      expect(GDD('not a number')).toBe('')
    })
  })
})

describe('parseAmount', () => {
  /**
   * ⛔ The table IS the specification of the two rules in the doc comment, and it is here
   * rather than in prose because this function decides what somebody gets charged.
   */
  describe('one separator', () => {
    it.each([
      ['6.30', 6.3],
      ['6,30', 6.3],
      ['6,3', 6.3],
      ['6.3', 6.3],
      ['0,05', 0.05],
    ])('reads %s as a decimal separator -> %s', (typed, expected) => {
      expect(parseAmount(typed)).toBe(expected)
    })

    /**
     * ⛔ Rule 2, and the reason it exists: at a desk keyboard there is no keypad, so a
     * grouping separator can be typed. GDD carries two decimals, so three digits behind a
     * separator cannot be decimals. Without this, `1.234` would be charged as one and a bit.
     */
    it.each([
      ['1.234', 1234],
      ['1,234', 1234],
      ['12.000', 12000],
    ])('reads %s as grouping, because three digits cannot be decimals -> %s', (typed, expected) => {
      expect(parseAmount(typed)).toBe(expected)
    })

    /**
     * ⛔ ...but only where grouping is possible at all. No language writes a group behind a
     * bare zero, so `0,123` cannot be "zero thousand one hundred and twenty-three" -- the
     * reading rule 2 would pick does not exist there. Read as grouping it turns twelve cents
     * into a hundred and twenty-three Gradido.
     */
    it.each([
      ['0.123', 0.123],
      ['0,123', 0.123],
      ['0,005', 0.005],
    ])('reads %s as decimals, nothing groups behind a bare zero -> %s', (typed, expected) => {
      expect(parseAmount(typed)).toBe(expected)
    })

    /** Four digits are not a group either, so the separator can only be a decimal one. */
    it('reads 1.2345 as decimals', () => {
      expect(parseAmount('1.2345')).toBe(1.2345)
    })
  })

  describe('several separators', () => {
    it.each([
      ['1.234,50', 1234.5],
      ['1,234.50', 1234.5],
      ['1.234.567,89', 1234567.89],
    ])('takes the last separator as the decimal one: %s -> %s', (typed, expected) => {
      expect(parseAmount(typed)).toBe(expected)
    })

    /**
     * ⛔ Unless there are no decimals at all. A number grouped from end to end is a whole
     * number, however many separators it carries -- asking only about the LAST separator
     * read `1.234.567` as 1234.567, a thousandth of what was typed, and the field then wrote
     * it back formatted so it looked settled.
     */
    it.each([
      ['1.234.567', 1234567],
      ['1,234,567', 1234567],
      ['10.000.000', 10000000],
    ])('reads %s as a grouped whole number -> %s', (typed, expected) => {
      expect(parseAmount(typed)).toBe(expected)
    })
  })

  describe('no separator at all', () => {
    it.each([
      ['1234', 1234],
      ['0', 0],
      ['-12', -12],
    ])('%s -> %s', (typed, expected) => {
      expect(parseAmount(typed)).toBe(expected)
    })
  })

  /**
   * NaN and not 0. "Nothing usable" and "zero" are different answers, and on a payment
   * screen a silent 0 is the worse of the two -- it would look like a finished amount.
   */
  describe('anything that is not a number', () => {
    it.each([[''], ['   '], ['abc'], ['12abc'], [null], [undefined], ['€ 5']])(
      'gives NaN for %s',
      (typed) => {
        expect(parseAmount(typed)).toBeNaN()
      },
    )
  })

  /**
   * What the card payment's amount field does while somebody types in it. The calculator's
   * keypad simply refuses a third decimal; a text field cannot refuse a keystroke, so it
   * corrects -- by the SAME rule the reader above reads by, or the field would fight entries
   * the reader would have got right.
   */
  describe('withAtMostTwoDecimals', () => {
    it.each([
      ['0,123', '0,12'],
      ['0.123', '0.12'],
      ['6,305', '6,30'],
      ['1.234,505', '1.234,50'],
      ['1.2345', '1.23'],
    ])('cuts a third decimal: %s -> %s', (typed, expected) => {
      expect(withAtMostTwoDecimals(typed)).toBe(expected)
    })

    /**
     * ⛔ STRICTER than the reader, and that is the point. `6,305` is a perfectly good grouped
     * number -- six thousand three hundred and five -- and it is also exactly what `6,30`
     * looks like with a slipped finger. Nothing can tell those apart afterwards, so the
     * field does not let the second one arise. The reader stays forgiving for what reaches
     * it already formatted.
     */
    it('refuses a third digit even where the reader would call it grouping', () => {
      expect(parseAmount('6,305')).toBe(6305)
      expect(withAtMostTwoDecimals('6,305')).toBe('6,30')
    })

    /** The price, weighed and accepted: a grouped whole number is typed without separators. */
    it('cuts a typed grouped whole number, so it is entered as plain digits', () => {
      expect(withAtMostTwoDecimals('1.234')).toBe('1.23')
    })

    /** What arrives already formatted carries two decimals and passes untouched. */
    it.each([['1.234,50'], ['6,3'], ['1234'], ['0,05']])('leaves %s alone', (typed) => {
      expect(withAtMostTwoDecimals(typed)).toBe(typed)
    })

    /** Half-typed and unusable entries go back untouched -- that is how a field gets filled. */
    it.each([[''], ['6,'], ['abc'], ['-']])('does not touch %s', (typed) => {
      expect(withAtMostTwoDecimals(typed)).toBe(typed)
    })
  })

  it('is stable across a round trip through the formatter', () => {
    // The payment field writes the read value back formatted; reading that again has to give
    // the same number, or the amount would drift every time the field is left.
    const german = new Intl.NumberFormat('de', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    for (const value of [6.3, 1234.5, 0.05, 1234567.89]) {
      expect(parseAmount(german.format(value))).toBe(value)
    }
  })
})
