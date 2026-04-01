
import { describe, expect, it } from 'bun:test'
// import { GradidoUnit } from '../'
//import { GradidoUnit } from '../src/zig/GradidoUnit.zig'
import { GradidoUnit } from '../lib/GradidoUnit.zigar'

describe('GradidoUnit', () => {
  describe('decayFormula', () => {
    it('with large values', () => {
      const amount = new GradidoUnit(100.0)
      const seconds = 1209600
      expect(amount.decay(seconds).toString()).toBe('97.3781')
    })

    it('with one year', () => {
      const amount = new GradidoUnit(100.0)
      const seconds = 31556952
      expect(amount.decay(seconds).toString()).toBe('50.0000')
    })
  })

  describe('compoundInterest', () => {
    it('work like expected with large values', () => {
      const amount = new GradidoUnit(100.0)
      const seconds = 1209600
      expect(amount.compoundInterest(seconds).toString()).toBe('97.3781030481034505778419')
    })
    it('work like expected with one year', () => {
      const amount = new GradidoUnit(100.0)
      const seconds = 31556952
      expect(amount.compoundInterest(seconds).toString()).toBe('50')
    })
    it('work correct when calculating future decay', () => {
      // for example on linked transaction
      // if I have amount = 100 GDD and want to know how much GDD I must lock to able to pay
      // decay in 14 days (1209600 seconds)
      const amount = new GradidoUnit(100.0)
      const seconds = 1209600
      expect(amount.compoundInterest(seconds).toString()).toBe('102.6924912992003635568199')
      // if I lock 102.6924912992003635568199 GDD, I will have 99.99999999999999999999998 GDD after 14 days, not 100% but near enough
      expect(amount.decay(seconds).toString()).toBe(
        '99.99999999999999999999998',
      )
      expect(amount.compoundInterest(seconds).toString()).toBe('102.6925')
      // rounded to 4 decimal places it is working like a charm
      expect(
        amount.compoundInterest(seconds).toString()
          .toString(),
      ).toBe('100')
    })
  })

  it('has base 0.99999997802044727', () => {
    const now = new Date()
    now.setSeconds(1)
    const oneSecondAgo = new Date(now.getTime())
    oneSecondAgo.setSeconds(0)
    expect(new GradidoUnit(1.0).decay(1).toString()).toBe(
      '0.999999978035040489732012',
    )
  })

  it('returns input amount when from and to is the same', () => {
    expect(new GradidoUnit(100.0).decay(0).toString()).toBe('100')
  })

  describe('calculateDecay called with invalid dates', () => {
    it('throws an error when to is before from', () => {
      const now = new Date()
      const oneSecondAgo = new Date(now.getTime())
      oneSecondAgo.setSeconds(0)
      expect(() => new GradidoUnit(1.0).decay(GradidoUnit.secondsBetween(now, oneSecondAgo))).toThrowError()
    })
  })
})