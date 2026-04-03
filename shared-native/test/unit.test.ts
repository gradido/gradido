import { describe, expect, it } from 'bun:test'
import { GradidoUnit } from '../'

describe('GradidoUnit Native', () => {
  describe('create', () => {
    it('create from string', () => {
      const amount = new GradidoUnit('100.0103')
      expect(amount.toString()).toBe('100.0103')
      expect(amount.toString(2)).toBe('100.01')
      expect(amount.toString(0)).toBe('100')
      expect(amount.toNumber()).toBe(100.0103)
      expect(amount.toBigInt()).toBe(1000103n)
    })
    it('create from number', () => {
      const amount = new GradidoUnit(100.0204)
      expect(amount.toNumber()).toBe(100.0204)
      expect(amount.toString()).toBe('100.0204')
      expect(amount.toBigInt()).toBe(1000204n)
    })
    it('create from bigint', () => {
      const amount = new GradidoUnit(1000204n)
      expect(amount.toNumber()).toBe(100.0204)
      expect(amount.toString()).toBe('100.0204')
      expect(amount.toBigInt()).toBe(1000204n)
    })
  })
  describe('test negate and negated', () => {
    it('negate', () => {
      const amount = new GradidoUnit(100.7204)
      const result = amount.negate()
      expect(result.eq(amount)).toBeTrue()
      expect(result).toBe(amount)
      expect(amount.toString()).toBe('-100.7204')
      expect(amount.toNumber()).toBe(-100.7204)
    })
    it('negated', () => {
      const amount = new GradidoUnit(100.1204)
      const negated = amount.negated()
      expect(negated.ne(amount)).toBeTrue()
      expect(negated.toString()).toBe('-100.1204')
      expect(negated.toNumber()).toBe(-100.1204)
      expect(amount.toString()).toBe('100.1204')
      expect(amount.toNumber()).toBe(100.1204)
    })
  })
  describe('test round and rounded', () => {
    it('round default (2)', () => {
      const amount = new GradidoUnit(100.123456)
      const result = amount.round()
      expect(result.eq(amount)).toBeTrue()
      expect(result).toBe(amount)
      expect(amount.toString(2)).toBe('100.12')
      expect(amount.toNumber()).toBe(100.12)
    })
    it('rounded default (2)', () => {
      const amount = new GradidoUnit(100.123456)
      const rounded = amount.rounded()
      expect(rounded.ne(amount)).toBeTrue()
      expect(rounded.toString(2)).toBe('100.12')
      expect(rounded.toNumber()).toBe(100.12)
      expect(amount.toString()).toBe('100.1235')
      expect(amount.toNumber()).toBe(100.1235)
    })
    it('round 3', () => {
      const amount = new GradidoUnit(100.123456)
      expect(amount.toNumber()).toBe(100.1235)
      const result = amount.round(3)
      expect(result.eq(amount)).toBeTrue()
      expect(result).toBe(amount)
      expect(amount.toString(3)).toBe('100.124')
      expect(amount.toNumber()).toBe(100.124)
    })
    it('rounded 3', () => {
      const amount = new GradidoUnit(100.123456)
      const rounded = amount.rounded(3)
      expect(rounded.ne(amount)).toBeTrue()
      expect(rounded.toString(3)).toBe('100.124')
      expect(rounded.toNumber()).toBe(100.124)
      expect(amount.toString()).toBe('100.1235')
      expect(amount.toNumber()).toBe(100.1235)
    })
    it('round 5 (precision is capped by 4)', () => {
      const amount = new GradidoUnit(100.123456)
      const result = amount.round(5)
      expect(result.eq(amount)).toBeTrue()
      expect(result).toBe(amount)
      expect(amount.toString()).toBe('100.1235')
      expect(amount.toNumber()).toBe(100.1235)
    })
    it('rounded 5 (precision is capped by 4)', () => {
      const amount = new GradidoUnit(100.123456)
      const rounded = amount.rounded(5)
      expect(rounded.eq(amount)).toBeTrue()
      expect(rounded.toString()).toBe('100.1235')
      expect(rounded.toNumber()).toBe(100.1235)
      expect(amount.toString()).toBe('100.1235')
      expect(amount.toNumber()).toBe(100.1235)
    })
  })
  describe('test add and sub', () => {
    it('add', () => {
      const amount = new GradidoUnit(100.1204)
      const amount2 = new GradidoUnit(50.8271)
      const result = amount.add(amount2)
      expect(result.eq(amount)).toBeTrue()
      expect(result).toBe(amount)
      expect(result).not.toBe(amount2)
      expect(amount.toString()).toBe('150.9475')
      expect(amount.toNumber()).toBe(150.9475)
    })
    it('plus', () => {
      const amount = new GradidoUnit(100.1204)
      const amount2 = new GradidoUnit(50.8271)
      const result = amount.plus(amount2)
      expect(result).not.toBe(amount)
      expect(result).not.toBe(amount2)
      expect(result.toString()).toBe('150.9475')
      expect(result.toNumber()).toBe(150.9475)
      expect(amount.toString()).toBe('100.1204')
      expect(amount.toNumber()).toBe(100.1204)
    })
    it('sub (subtract)', () => {
      const amount = new GradidoUnit(100.1204)
      const amount2 = new GradidoUnit(50.8271)
      const result = amount.sub(amount2)
      expect(result.toString()).toBe('49.2933')
      expect(result.toNumber()).toBe(49.2933)
      expect(result).toBe(amount)
      expect(result).not.toBe(amount2)
      expect(result.eq(amount)).toBeTrue()
      expect(result.ne(amount2)).toBeTrue()
    })
    it('minus', () => {
      const amount = new GradidoUnit(100.1204)
      const amount2 = new GradidoUnit(50.8271)
      const result = amount.minus(amount2)
      expect(result.toString()).toBe('49.2933')
      expect(result.toNumber()).toBe(49.2933)
      expect(amount.toString()).toBe('100.1204')
      expect(amount.toNumber()).toBe(100.1204)
    })
  })
  describe('compare', () => {
    it('equal', () => {
      const amount = new GradidoUnit(100.1204)
      const amount2 = new GradidoUnit(100.1204)
      expect(amount.equal(amount2)).toBe(true)
      expect(amount.eq(amount2)).toBe(true)
    })
    it('equal with number', () => {
      const amount = new GradidoUnit(100.1204)
      expect(amount.equal(100.1204)).toBe(true)
      expect(amount.eq(100.1204)).toBe(true)
    })
    it('not equal', () => {
      const amount = new GradidoUnit(100.1204)
      const amount2 = new GradidoUnit(100.1205)
      expect(amount.notEqual(amount2)).toBe(true)
      expect(amount.ne(amount2)).toBe(true)
    })
    it('not equal with number', () => {
      const amount = new GradidoUnit(100.1204)
      expect(amount.notEqual(100.1205)).toBe(true)
      expect(amount.ne(100.1205)).toBe(true)
    })
    it('less than', () => {
      const amount = new GradidoUnit(100.1204)
      const amount2 = new GradidoUnit(100.1205)
      expect(amount.lessThan(amount2)).toBe(true)
      expect(amount.lt(amount2)).toBe(true)
    })
    it('less than with number', () => {
      const amount = new GradidoUnit(100.1204)
      expect(amount.lessThan(100.1205)).toBe(true)
      expect(amount.lt(100.1205)).toBe(true)
    })
    it('less than or equal', () => {
      const amount = new GradidoUnit(100.1204)
      const amount2 = new GradidoUnit(100.1205)
      expect(amount.lessOrEqual(amount2)).toBe(true)
      expect(amount.lte(amount2)).toBe(true)
    })
    it('less than or equal with number', () => {
      const amount = new GradidoUnit(100.1204)
      expect(amount.lessOrEqual(100.1205)).toBe(true)
      expect(amount.lte(100.1205)).toBe(true)
    })
    it('greater than', () => {
      const amount = new GradidoUnit(100.1205)
      const amount2 = new GradidoUnit(100.1204)
      expect(amount.greaterThan(amount2)).toBe(true)
      expect(amount.gt(amount2)).toBe(true)
    })
    it('greater than with number', () => {
      const amount = new GradidoUnit(100.1205)
      expect(amount.greaterThan(100.1204)).toBe(true)
      expect(amount.gt(100.1204)).toBe(true)
    })
    it('greater than or equal', () => {
      const amount = new GradidoUnit(100.1205)
      const amount2 = new GradidoUnit(100.1204)
      expect(amount.greaterOrEqual(amount2)).toBe(true)
      expect(amount.gte(amount2)).toBe(true)
    })
    it('greater than or equal with number', () => {
      const amount = new GradidoUnit(100.1205)
      expect(amount.greaterOrEqual(100.1204)).toBe(true)
      expect(amount.gte(100.1204)).toBe(true)
    })
  })
  describe('decay', () => {
    it('decay 0 seconds', () => {
      const amount = new GradidoUnit(1001.2041)
      const decay = amount.decay(0)
      expect(decay.eq(amount)).toBeTrue()
      expect(decay.toNumber()).toBe(1001.2041)
      expect(amount.toNumber()).toBe(1001.2041)
    })
    it('decay 10 seconds', () => {
      const amount = new GradidoUnit(1001.2041)
      const decay = amount.decay(10)
      expect(decay.eq(amount)).toBeTrue()
      expect(decay.toNumber()).toBe(1001.2038)
      expect(amount.toNumber()).toBe(1001.2038)
    })
    it('decayed 10 seconds', () => {
      const amount = new GradidoUnit(1001.2041)
      const decayed = amount.decayed(10)
      expect(decayed.eq(amount)).toBeFalse()
      expect(decayed.toNumber()).toBe(1001.2038)
      expect(amount.toNumber()).toBe(1001.2041)
    })
    describe('different gdd seconds pairs', () => {
      it('1 gdd, 1 second', () => {
        const amount = new GradidoUnit(1.0)
        amount.decay(1)
        expect(amount.toNumber()).toBe(0.9999)
      })
      it('100 gdd, 14 days', () => {
        const amount = new GradidoUnit(100.0)
        amount.decay(14 * 24 * 60 * 60)
        expect(amount.toNumber()).toBe(97.3781)
      })
      it('100 gdd, 1 year', () => {
        const amount = new GradidoUnit(100.0)
        amount.decay(31556952)
        expect(amount.toNumber()).toBe(50)
      })
    })
    describe('method chaining', () => {
      it('decay twice', () => {
        const amount = new GradidoUnit(100.0)
        amount.decay(14 * 24 * 60 * 60).decay(14 * 24 * 60 * 60)
        expect(amount.toNumber()).toBe(94.8249)
      })
      it('decay then add', () => {
        const amount = new GradidoUnit(100.0)
        amount.decay(14 * 24 * 60 * 60).add(new GradidoUnit(17.21))
        expect(amount.toNumber()).toBe(114.5881)
      })
      it('decayed then add', () => {
        const amount = new GradidoUnit(100.0)
        const decayed = amount.decayed(14 * 24 * 60 * 60).add(new GradidoUnit(17.21))
        expect(decayed.ne(amount)).toBeTrue()
        expect(decayed.toNumber()).toBe(114.5881)
      })
    })
    it('inverse decay calculation', () => {
      const amount = new GradidoUnit(100)
      amount.compoundInterest(14 * 24 * 60 * 60)
      expect(amount.toNumber()).toBe(102.6924)
    })
    it('inverse decay calculation with compoundInterested', () => {
      const amount = new GradidoUnit(100)
      const decayed = amount.compoundInterested(14 * 24 * 60 * 60)
      expect(decayed.ne(amount)).toBeTrue()
      expect(decayed.toNumber()).toBe(102.6924)
    })
    describe('performance', () => {
      it('mutate object 100k times', () => {
        const amount = new GradidoUnit(1001.2041)
        for (let i = 0; i < 100000; i++) {
          amount.decay(10)
        }
        expect(amount.toNumber()).toBe(971.2041)
      })
      it('create new object 100k times', () => {
        const amount = new GradidoUnit(1001.2041)
        for (let i = 0; i < 100000; i++) {
          amount.decayed(10)
        }
        expect(amount.toNumber()).toBe(1001.2041)
      })
    })
  })
  // const DECAY_START_TIME = new Date('2021-05-13T17:46:31Z')
  describe('effectiveDecayDuration', () => {
    it('should calculate seconds between two dates', () => {
      const start = new Date('2026-01-01T00:00:00Z')
      const end = new Date('2026-01-01T01:00:00Z')
      const result = GradidoUnit.effectiveDecayDuration(start, end)
      expect(result).toBe(3600)
    })
    it('should return error if end is before start', () => {
      const start = new Date('2026-01-01T01:00:00Z')
      const end = new Date('2026-01-01T00:00:00Z')
      expect(() => GradidoUnit.effectiveDecayDuration(start, end)).toThrow(
        'End date must be after start date',
      )
    })
    it('no decay seconds before decay start date', () => {
      const start = new Date('2020-05-13T17:46:31Z')
      const end = new Date('2021-05-13T17:46:31Z')
      const result = GradidoUnit.effectiveDecayDuration(start, end)
      expect(result).toBe(0)
    })
    it('decay seconds if start time is before and end time is after decay start date', () => {
      const start = new Date('2021-05-11T10:18:21Z')
      const end = new Date('2021-05-14T17:46:31Z')
      const result = GradidoUnit.effectiveDecayDuration(start, end)
      expect(result).toBe(60 * 60 * 24)
    })
  })
  describe('getDecayStartTime', () => {
    it('should return the decay start time', () => {
      const result = GradidoUnit.getDecayStartTime()
      expect(result).toBeInstanceOf(Date)
      expect(result.toISOString()).toBe('2021-05-13T17:46:31.000Z')
    })
  })
  describe('test clone', () => {
    it('should return a new instance with the same value', () => {
      const unit = new GradidoUnit(1)
      const cloned = unit.clone()
      expect(cloned.eq(unit)).toBe(true)
      expect(cloned).not.toBe(unit)
      unit.add(new GradidoUnit(1))
      expect(cloned.eq(unit)).toBe(false)
    })
  })
})
