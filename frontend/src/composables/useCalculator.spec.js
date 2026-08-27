// AI-GENERATED — not an architecture reference
import { describe, it, expect, afterEach, vi } from 'vitest'
import { ref } from 'vue'
import { dailyRateFor, evaluate, useCalculator } from './useCalculator'

/**
 * The arithmetic behind the calculator page.
 *
 * ⛔ These are the numbers somebody gets charged, so the cases here are the ones the accepted
 * PWA was checked against, not a fresh idea of what a calculator should do. Where a case
 * looks odd -- carrying on from a ROUNDED result, refusing a third decimal -- it is odd on
 * purpose and matches `gradido-calculator/index.html`.
 */

const setup = ({ percent = 100, factor = 1, locale = 'de' } = {}) =>
  useCalculator({ percent: ref(percent), factor: ref(factor), locale: ref(locale) })

const type = (calc, keys) => {
  for (const key of keys) {
    if (key === '.') {
      calc.appendSeparator()
    } else if ('+-*/'.includes(key)) {
      calc.appendOperator(key)
    } else {
      calc.appendDigit(Number(key))
    }
  }
}

describe('evaluate', () => {
  it.each([
    ['1 + 2', 3],
    ['10 - 4', 6],
    ['3 * 4', 12],
    ['9 / 3', 3],
    ['2 + 3 * 4', 14],
    ['4.5 + 3.2 + 2.8', 10.5],
    ['-5 + 8', 3],
  ])('%s = %s', (expression, expected) => {
    expect(evaluate(expression)).toBeCloseTo(expected, 10)
  })

  /**
   * ⛔ The character check alone was not the guard it was said to be. `Number.parseFloat`
   * takes the valid prefix and drops the rest, so a grouped number -- exactly what something
   * formatted for the display looks like -- came back as a plausible small number instead of
   * NaN. `1.234.567` evaluated to 1.234. The comma half always worked, because a comma fails
   * the character check; the full stop half did not, and that is the half a German display
   * carries.
   */
  it.each([['1.2.3'], ['1.234.567'], ['1.2.3 + 1'], ['1..2']])(
    'refuses %s rather than calculating its first few digits',
    (expression) => {
      expect(evaluate(expression)).toBeNaN()
    },
  )

  /** ⚠️ A trailing separator stays calculable, as in the PWA: `5.` is half typed, not broken. */
  it('still calculates a number with a trailing separator', () => {
    expect(evaluate('5.')).toBe(5)
  })

  it.each([[''], ['+'], ['1 +'], ['abc'], ['1,5'], [null]])(
    'gives NaN for %s rather than throwing',
    (expression) => {
      expect(evaluate(expression)).toBeNaN()
    },
  )

  /**
   * ⚠️ A `+` or `-` behind another operator is read as a SIGN, not as a second operator --
   * carried over from the PWA, where it is what makes `5 * -2` work. It is unreachable from
   * the keypad, which refuses two operators in a row, and it is pinned here so nobody
   * "fixes" it into a NaN and breaks negative operands with it.
   */
  it('reads a second plus or minus as a sign', () => {
    expect(evaluate('1 + + 2')).toBe(3)
    expect(evaluate('5 * -2')).toBe(-10)
  })

  /**
   * ⛔ A grouped or comma-decimal string must never be calculable by accident. The character
   * check is what stops it, and it is the same guard that makes the display safe to derive:
   * nothing that was formatted for the eye can find its way back into the arithmetic.
   */
  it('refuses a formatted number outright', () => {
    expect(evaluate('1.234,50')).toBeNaN()
    expect(evaluate('1,234.50')).toBeNaN()
  })
})

describe('dailyRateFor', () => {
  it('is the year decay counted in whole days, and the two directions are reciprocal', () => {
    const rate = dailyRateFor(new Date(2026, 0, 1))
    expect(rate.dankBarToGdd).toBeCloseTo(1, 10)
    expect(rate.gddToDankBar).toBeCloseTo(1, 10)

    const later = dailyRateFor(new Date(2026, 5, 15))
    expect(later.dankBarToGdd).toBeLessThan(1)
    expect(later.dankBarToGdd * later.gddToDankBar).toBeCloseTo(1, 10)
  })

  it('uses the PWA constant, not a rate of our own', () => {
    // 1 March 2026 is day 60; the PWA computes 0.998098 ** (day - 1).
    const rate = dailyRateFor(new Date(2026, 2, 1))
    expect(rate.dankBarToGdd).toBeCloseTo(0.998098 ** 59, 12)
  })
})

describe('useCalculator', () => {
  describe('typing', () => {
    it('draws what is typed in the language of the interface', () => {
      const calc = setup({ locale: 'de' })
      type(calc, ['1', '2', '3', '4', '.', '5'])
      expect(calc.display.value).toBe('1.234,5')
    })

    it('draws the same keystrokes the English way', () => {
      const calc = setup({ locale: 'en' })
      type(calc, ['1', '2', '3', '4', '.', '5'])
      expect(calc.display.value).toBe('1,234.5')
    })

    /**
     * ⚠️ Half-typed decimals are shown as typed, not padded. "6," must not become "6,00"
     * while somebody is still reaching for the next key.
     */
    it('does not invent decimals that were not pressed', () => {
      const calc = setup({ locale: 'de' })
      type(calc, ['6', '.'])
      expect(calc.display.value).toBe('6,')
      calc.appendDigit(5)
      expect(calc.display.value).toBe('6,5')
    })

    it('starts a decimal with a leading zero', () => {
      const calc = setup({ locale: 'de' })
      calc.appendSeparator()
      calc.appendDigit(5)
      expect(calc.display.value).toBe('0,5')
    })

    it('drops leading zeros from the whole part', () => {
      const calc = setup()
      type(calc, ['0', '5'])
      expect(calc.display.value).toBe('5')
    })

    it('shows operators the way the keys are labelled', () => {
      const calc = setup({ locale: 'en' })
      type(calc, ['6', '*', '7'])
      expect(calc.display.value).toBe('6 × 7')
    })
  })

  describe('what it refuses, and says so', () => {
    it('refuses a third decimal', () => {
      const calc = setup()
      type(calc, ['1', '.', '5', '0'])
      expect(calc.appendDigit(1)).toBe('warn')
      expect(calc.display.value).toBe('1,50')
    })

    it('refuses a second separator in the same number', () => {
      const calc = setup()
      type(calc, ['1', '.', '5'])
      expect(calc.appendSeparator()).toBe('warn')
    })

    it('refuses an operator before there is a number', () => {
      const calc = setup()
      expect(calc.appendOperator('+')).toBe('warn')
    })

    it('refuses two operators in a row', () => {
      const calc = setup()
      type(calc, ['5'])
      expect(calc.appendOperator('+')).toBe('function')
      expect(calc.appendOperator('*')).toBe('warn')
    })

    it('refuses an operator behind an unfinished decimal', () => {
      const calc = setup()
      type(calc, ['5', '.'])
      expect(calc.appendOperator('+')).toBe('warn')
    })

    it('refuses delete on an empty display', () => {
      expect(setup().deleteLast()).toBe('warn')
    })

    it('refuses to calculate nothing', () => {
      expect(setup().calculate()).toBe('warn')
    })
  })

  describe('delete and clear', () => {
    it('takes the whole operator back in one press', () => {
      const calc = setup({ locale: 'en' })
      type(calc, ['1', '2', '+'])
      calc.deleteLast()
      expect(calc.display.value).toBe('12')
    })

    it('clears the display and the sums together', () => {
      const calc = setup()
      type(calc, ['5'])
      calc.calculate()
      expect(calc.subResult.value).not.toBeNull()
      calc.allClear()
      expect(calc.display.value).toBe('')
      expect(calc.subResult.value).toBeNull()
    })
  })

  describe('the two sums', () => {
    it('splits a total by the Gradido share', () => {
      const calc = setup({ percent: 60, locale: 'en' })
      type(calc, ['1', '0', '.', '5'])
      expect(calc.calculate()).toBe('equals')
      expect(calc.subResult.value.kind).toBe('payment')
      expect(calc.subResult.value.fiat).toBeCloseTo(4.2, 10)
      expect(calc.subResult.value.gdd).toBeCloseTo(6.3, 10)
    })

    /**
     * The sanity check from the plan: a factor of 5 with 60 % on a 100 THB coffee means
     * 40 THB paid and 12 GDD thanked.
     */
    it('divides the Gradido side by the purchasing-power factor', () => {
      const calc = setup({ percent: 60, factor: 5 })
      type(calc, ['1', '0', '0'])
      calc.calculate()
      expect(calc.subResult.value.fiat).toBeCloseTo(40, 10)
      expect(calc.subResult.value.gdd).toBeCloseTo(12, 10)
    })

    it('shows no sums at all when the share is zero', () => {
      const calc = setup({ percent: 0 })
      type(calc, ['5'])
      calc.calculate()
      expect(calc.subResult.value).toBeNull()
      expect(calc.payableGdd.value).toBeNull()
    })

    it('offers nothing to a card until there is a result', () => {
      const calc = setup({ percent: 100 })
      type(calc, ['5'])
      expect(calc.payableGdd.value).toBeNull()
      calc.calculate()
      expect(calc.payableGdd.value).toBeCloseTo(5, 10)
    })

    /**
     * ⛔ The sums under the display go the moment the calculation moves on -- and the card
     * offer with them. This deliberately DIVERGES from the PWA, which leaves them standing
     * until AC: there they were information, here actions hang off them, and the previous
     * customer's sums under a new customer's digits are only ever misread. (Bernd,
     * 20.08.2026, revising the original behaviour.)
     */
    it('clears the sums and the card offer as soon as the calculation moves on', () => {
      const calc = setup({ percent: 100 })
      type(calc, ['5', '0'])
      calc.calculate()
      expect(calc.payableGdd.value).toBeCloseTo(50, 10)

      type(calc, ['7'])
      expect(calc.display.value).toBe('7')
      expect(calc.subResult.value).toBeNull()
      expect(calc.payableGdd.value).toBeNull()
    })

    /** Carrying on with an operator is the same thing: 50 = , + 2 0 is not 50 any more. */
    it.each([
      ['an operator and more digits', (calc) => calc.appendOperator('+') && type(calc, ['2'])],
      ['a deletion', (calc) => calc.deleteLast()],
      ['a separator', (calc) => calc.appendSeparator()],
    ])('clears them after %s too', (_name, carryOn) => {
      const calc = setup({ percent: 100 })
      type(calc, ['5', '0'])
      calc.calculate()
      expect(calc.payableGdd.value).toBeCloseTo(50, 10)

      carryOn(calc)
      expect(calc.subResult.value).toBeNull()
      expect(calc.payableGdd.value).toBeNull()
    })

    /** And pressing "=" again puts everything back, with the sum that is on screen now. */
    it('offers the new sum once it has been worked out', () => {
      const calc = setup({ percent: 100 })
      type(calc, ['5', '0'])
      calc.calculate()
      calc.appendOperator('+')
      type(calc, ['2', '0'])
      expect(calc.payableGdd.value).toBeNull()

      calc.calculate()
      expect(calc.payableGdd.value).toBeCloseTo(70, 10)
    })
  })

  describe('carrying on from a result', () => {
    it('starts a new number when a digit follows "="', () => {
      const calc = setup({ locale: 'en' })
      type(calc, ['5', '+', '5'])
      calc.calculate()
      calc.appendDigit(7)
      expect(calc.display.value).toBe('7')
    })

    it('keeps the result when an operator follows "="', () => {
      const calc = setup({ locale: 'en' })
      type(calc, ['5', '+', '5'])
      calc.calculate()
      calc.appendOperator('+')
      calc.appendDigit(2)
      expect(calc.display.value).toBe('10.00 + 2')
    })

    /**
     * ⚠️ Carrying on uses the ROUNDED result, exactly as the PWA does by writing its
     * formatted result into the display and reading it back. Somebody who sees 0.33 and adds
     * 1 must get 1.33, not 1.3333 -- the arithmetic has to match what is on the screen.
     */
    it('carries on from the number that was shown, not a longer hidden one', () => {
      const calc = setup({ percent: 100, locale: 'en' })
      type(calc, ['1', '/', '3'])
      calc.calculate()
      calc.appendOperator('+')
      calc.appendDigit(1)
      calc.calculate()
      expect(calc.subResult.value.gdd).toBeCloseTo(1.33, 10)
    })
  })

  describe('DankBar to Gradido', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    /**
     * ⛔ The clock is pinned, and not for tidiness. Asserting against the rate the composable
     * itself just produced would pass on 1 January whatever the code did: there `dayOfYear`
     * is 1, so the rate and its reciprocal are both exactly 1 and swapping them is invisible.
     * A day in the middle of the year tells them apart -- 0.6454 against 1.5494.
     */
    it('converts at the day rate and reports both sides', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 7, 19, 12))
      const calc = setup()
      type(calc, ['1', '0', '0'])
      expect(calc.dankBarToGdd()).toBe('function')
      expect(calc.subResult.value.kind).toBe('dankbar')
      expect(calc.subResult.value.dankBar).toBe(100)
      expect(calc.subResult.value.gdd).toBeCloseTo(64.5405, 4)
      expect(calc.subResult.value.rate.gddToDankBar).toBeCloseTo(1.5494, 4)
    })

    /**
     * ★ The rate is asked for when a sum is worked out, not when the page opens. A till
     * leaves this page standing at the counter all day; the PWA is an app that gets closed,
     * so the same "read it once" costs a great deal more here. Over New Year it is a factor
     * of two -- 0.5001 on 31 December against 1.0000 on 1 January.
     */
    it('uses the rate of the day the sum is worked out on, not of the day the page opened', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 11, 31, 23, 55))
      const calc = setup()
      type(calc, ['1', '0', '0'])
      calc.dankBarToGdd()
      expect(calc.subResult.value.gdd).toBeCloseTo(50.008, 3)

      vi.setSystemTime(new Date(2027, 0, 1, 0, 5))
      calc.allClear()
      type(calc, ['1', '0', '0'])
      calc.dankBarToGdd()
      expect(calc.subResult.value.gdd).toBeCloseTo(100, 6)
    })

    it('refuses an empty display', () => {
      expect(setup().dankBarToGdd()).toBe('warn')
    })

    /** A DankBar conversion is not a sale, so nothing may be handed to a card from it. */
    it('offers nothing to a card', () => {
      const calc = setup()
      type(calc, ['1', '0', '0'])
      calc.dankBarToGdd()
      expect(calc.payableGdd.value).toBeNull()
    })
  })
})
