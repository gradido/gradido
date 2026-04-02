import { decayFormula } from 'shared'
import { Decimal } from 'decimal.js'

export function testGradidoUnit(name: string, getUnit: (amount: number | string) => any) {
  describe(name, () => {
    describe('create', () => {
      it('create from string', () => {
        const amount = getUnit('100.0103')
        expect(amount.toString()).toBe('100.0103')
      })
      it('create from number', () => {
        const amount = getUnit(100.0204)
        expect(amount.toString()).toBe('100.0204')
      })
    })
    describe('test negate and negated', () => {
      it('negate', () => {
        const amount = getUnit(100.7204)
        const result = amount.negate()
        expect(result.toString()).toBe(amount.toString())
        expect(result).toBe(amount)
        expect(amount.toString()).toBe('-100.7204')
      })
      it('negated', () => {
        const amount = getUnit(100.1204)
        const negated = amount.negated()
        expect(negated.toString()).toBe('-100.1204')
        expect(amount.toString()).toBe('100.1204')
      })
    })
    describe('test add and sub', () => {
    it('add', () => {
      const amount = getUnit(100.1204)
      const amount2 = getUnit(50.8271)
      const result = amount.add(amount2)
      expect(result.toString()).toBe(amount.toString())
      expect(result).toBe(amount)
      expect(result).not.toBe(amount2)
      expect(amount.toString()).toBe('150.9475')
    })
    it('plus', () => {
      const amount = getUnit(100.1204)
      const amount2 = getUnit(50.8271)
      const result = amount.plus(amount2)
      expect(result).not.toBe(amount)
      expect(result).not.toBe(amount2)
      expect(result.toString()).toBe('150.9475')
      expect(amount.toString()).toBe('100.1204')
    })
    it('sub (subtract)', () => {
      const amount = getUnit(100.1204)
      const amount2 = getUnit(50.8271)
      const result = amount.sub(amount2)
      expect(result.toString()).toBe('49.2933')
      expect(result).toBe(amount)
      expect(result).not.toBe(amount2)
      expect(result.toString()).toBe(amount.toString())
      expect(result.toString()).not.toBe(amount2.toString())
    })
    it('minus', () => {
      const amount = getUnit(100.1204)
      const amount2 = getUnit(50.8271)
      const result = amount.minus(amount2)
      expect(result.toString()).toBe('49.2933')
      expect(amount.toString()).toBe('100.1204')
    })
    })
    describe('compare', () => {
      it('equal', () => {
        const amount = getUnit(100.1204)
        const amount2 = getUnit(100.1204)
        expect(amount.equal(amount2)).toBe(true)
        expect(amount.eq(amount2)).toBe(true)
      })
      it('not equal', () => {
        const amount = getUnit(100.1204)
        const amount2 = getUnit(100.1205)
        expect(amount.notEqual(amount2)).toBe(true)
        expect(amount.ne(amount2)).toBe(true)
      })
      it('less than', () => {
        const amount = getUnit(100.1204)
        const amount2 = getUnit(100.1205)
        expect(amount.lessThan(amount2)).toBe(true)
        expect(amount.lt(amount2)).toBe(true)
      })
      it('less than or equal', () => {
        const amount = getUnit(100.1204)
        const amount2 = getUnit(100.1205)
        expect(amount.lessOrEqual(amount2)).toBe(true)
        expect(amount.lte(amount2)).toBe(true)
      })
      it('greater than', () => {
        const amount = getUnit(100.1205)
        const amount2 = getUnit(100.1204)
        expect(amount.greaterThan(amount2)).toBe(true)
        expect(amount.gt(amount2)).toBe(true)
      })
      it('greater than or equal', () => {
        const amount = getUnit(100.1205)
        const amount2 = getUnit(100.1204)
        expect(amount.greaterOrEqual(amount2)).toBe(true)
        expect(amount.gte(amount2)).toBe(true)
      })
    })
    describe('decay', () => {
      it('decay 10 seconds', () => {
        const amount = getUnit(1001.2041)
        const decay = amount.decay(10)
        expect(decayFormula(new Decimal(amount.toString()), 10).toString()).toBe('1001.2035800860124515')
        expect(decay.toString()).toBe('1001.2038')
        expect(amount.toString()).toBe('1001.2038')
      })
      it('decayed 10 seconds', () => {
        const amount = getUnit(1001.2041)
        const decayed = amount.decayed(10)
        expect(decayed.toString()).toBe('1001.2038')
        expect(amount.toString()).toBe('1001.2041')
      })
      describe('performance', () => {
        it('mutate object 1 million times', () => {
          const amount = getUnit(1001.2041)
          const start = Date.now()
          for (let i = 0; i < 1000000; i++) {
            amount.decay(10)
          }
          const end = Date.now()
          console.log('mutate object', end - start, 'ms')
          expect(amount.toString()).toBe('770.9831')
        })
        it('create new object 1 million times', () => {
          const amount = getUnit(1001.2041)
          const start = Date.now()
          for (let i = 0; i < 1000000; i++) {
            amount.decayed(10)
          }
          const end = Date.now()
          console.log('create new object', end - start, 'ms')
          expect(amount.toString()).toBe('1001.2041')
        })
        it('decay with old formula 10 thousand times', () => {
          const amount = new Decimal(1001.2041)
          const start = Date.now()
          for (let i = 0; i < 10000; i++) {
            decayFormula(amount, 10)
          }
          const end = Date.now()
          console.log('decay with old formula', end - start, 'ms')
          expect(amount.toString()).toBe('1001.2041')
        })
      })
    })
  })
}
