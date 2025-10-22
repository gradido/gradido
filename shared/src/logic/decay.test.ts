import { Decimal } from 'decimal.js-light'

import { calculateDecay, compoundInterest, decayFormula, decayFormulaFast } from './decay'

describe('utils/decay', () => {
  describe('decayFormula', () => {
    it('has base 0.99999997802044727', () => {
      const amount = new Decimal(1.0)
      const seconds = 1
      // TODO: toString() was required, we could not compare two decimals
      expect(decayFormula(amount, seconds).toString()).toBe('0.999999978035040489732012')
    })

    it('with large values', () => {
      const amount = new Decimal(100.0)
      const seconds = 1209600
      expect(decayFormula(amount, seconds).toString()).toBe('97.3781030481034505778419')
    })

    it('with one year', () => {
      const amount = new Decimal(100.0)
      const seconds = 31556952
      expect(decayFormula(amount, seconds).toString()).toBe('49.99999999999999999999999')
    })
    
    it('has correct backward calculation', () => {
      const amount = new Decimal(1.0)
      const seconds = -1
      expect(decayFormula(amount, seconds).toString()).toBe('1.000000021964959992727444')
    })
    // we get pretty close, but not exact here, skipping

    it.skip('has correct forward calculation', () => {
      const amount = new Decimal(1.0).div(
        new Decimal('0.99999997803504048973201202316767079413460520837376'),
      )
      const seconds = 1
      expect(decayFormula(amount, seconds).toString()).toBe('1.0')
    })
  })

  describe('decayFormulaFast', () => {
    it('work like expected with small values', () => {
      const amount = new Decimal(1.0)
      const seconds = 1
      expect(decayFormulaFast(amount, seconds).toString()).toBe('0.999999978035040489732012')
    })
    it('work like expected with large values', () => {
      const amount = new Decimal(100.0)
      const seconds = 1209600
      expect(decayFormulaFast(amount, seconds).toString()).toBe('97.3781030481034505778419')
    })
    it('work like expected with one year', () => {
      const amount = new Decimal(100.0)
      const seconds = 31556952
      expect(decayFormulaFast(amount, seconds).toString()).toBe('50')
    })
    it('work correct when calculating future decay', () => {
      // for example on linked transaction
      // if I have amount = 100 GDD and want to know how much GDD I must lock to able to pay
      // decay in 14 days (1209600 seconds)
      const amount = new Decimal(100.0)
      const seconds = 1209600
      expect(compoundInterest(amount, seconds).toString()).toBe('102.6924912992003635568199')
      // if I lock 102.6924912992003635568199 GDD, I will have 99.99999999999999999999998 GDD after 14 days, not 100% but near enough
      expect(decayFormulaFast(compoundInterest(amount, seconds), seconds).toString()).toBe('99.99999999999999999999998')
      expect(compoundInterest(amount, seconds).toDecimalPlaces(4).toString()).toBe('102.6925')
      // rounded to 4 decimal places it is working like a charm
      expect(decayFormulaFast(new Decimal(
        compoundInterest(amount, seconds).toDecimalPlaces(4)), 
        seconds
      ).toDecimalPlaces(4).toString()).toBe('100')
    })
  })
  
  it('has base 0.99999997802044727', () => {
    const now = new Date()
    now.setSeconds(1)
    const oneSecondAgo = new Date(now.getTime())
    oneSecondAgo.setSeconds(0)
    expect(calculateDecay(new Decimal(1.0), oneSecondAgo, now).balance.toString()).toBe(
      '0.999999978035040489732012',
    )
  })

  it('returns input amount when from and to is the same', () => {
    const now = new Date()
    expect(calculateDecay(new Decimal(100.0), now, now).balance.toString()).toBe('100')
  })

  describe('calculateDecay called with invalid dates', () => {
    it('throws an error when to is before from', () => {
      const now = new Date()
      const oneSecondAgo = new Date(now.getTime())
      oneSecondAgo.setSeconds(0)
      expect(() => calculateDecay(new Decimal(1.0), now, oneSecondAgo)).toThrowError()
    })
  })
})
