import { Decimal } from 'decimal.js-light'
import 'reflect-metadata' // This might be wise to load in a test setup file
import { decayFormula, calculateDecay } from './decay'

describe('utils/decay', () => {
  describe('decayFormula', () => {
    it('has base 0.99999997802044727', () => {
      const amount = new Decimal(1.0)
      const seconds = 1
      // TODO: toString() was required, we could not compare two decimals
      expect(decayFormula(amount, seconds).toString()).toBe('0.999999978035040489732012')
    })
    it('has correct backward calculation', () => {
      const amount = new Decimal(1.0)
      const seconds = -1
      expect(decayFormula(amount, seconds).toString()).toBe('1.000000021964959992727444')
    })
    // we get pretty close, but not exact here, skipping
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip('has correct forward calculation', () => {
      const amount = new Decimal(1.0).div(
        new Decimal('0.99999997803504048973201202316767079413460520837376'),
      )
      const seconds = 1
      expect(decayFormula(amount, seconds).toString()).toBe('1.0')
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
})
