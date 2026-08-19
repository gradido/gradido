import { describe, it, expect, vi } from 'vitest'
import { createFilters, parseAmount } from './amount'

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
  })

  describe('several separators', () => {
    it.each([
      ['1.234,50', 1234.5],
      ['1,234.50', 1234.5],
      ['1.234.567,89', 1234567.89],
    ])('takes the last separator as the decimal one: %s -> %s', (typed, expected) => {
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
