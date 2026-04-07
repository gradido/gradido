import { describe, expect, it } from 'bun:test'
import { GradidoUnit } from './GradidoUnit'
import { calculateDecay as calculateDecayNative } from 'shared-native'

describe('GradidoUnit', () => {
  it('adds properly', () => {
    const a = new GradidoUnit(10n)
    const b = new GradidoUnit(3n)
    const sum = a.add(b)
    expect(sum.gddCent).toEqual(13n)
  })

  it('subtracts properly', () => {
    const a = new GradidoUnit(10n)
    const b = new GradidoUnit(3n)
    const diff = a.subtract(b)
    expect(diff.gddCent).toEqual(7n)
  })

  it('can be constructed from a number', () => {
    const value = 123.456
    const gdd = GradidoUnit.fromNumber(value)
    expect(gdd.toNumber()).toBe(value)
  })

  it('can decay', () => {
    const gdd = new GradidoUnit(10000n)
    const from = new Date('2022-01-01')
    const to = new Date('2022-01-02')
    const decay = gdd.calculateDecay(from, to)
    expect(decay.balance.gddCent).toBe(9981n)
    expect(decay.decay.gddCent).toBe(-19n)
    expect(decay.duration?.seconds).toBe(86400n)
    expect(decay.start).toBe(from)
    expect(decay.end).toBe(to)
  })

  it('calculateDecay called with invalid dates', () => {
    const gdd = new GradidoUnit(10000n)
    const from = new Date('2022-01-02')
    const to = new Date('2022-01-01')
    expect(() => gdd.calculateDecay(from, to)).toThrow('effectiveDecayDuration: to < from, reverse decay calculation is invalid')
  })

  it('decayed', () => {
    const gdd = new GradidoUnit(10000n)
    const from = new Date('2022-01-01')
    const to = new Date('2022-01-02')
    const decayed = gdd.decayed(from, to)
    expect(decayed.gddCent).toBe(9981n)
  })

  it('can calculate required amount before decay', () => {
    const gdd = new GradidoUnit(10000n)
    const from = new Date('2022-01-01')
    const to = new Date('2022-01-02')
    const decayed = gdd.requiredBeforeDecay(from, to)
    expect(decayed.gddCent).toBe(10018n)
  })

  describe('toString', () => {
    it('with default places after comma', () => {
      const gdd = new GradidoUnit(12345n)
      expect(gdd.toString()).toBe('1.2345')
    })

    it('with 3 places after comma', () => {
      const gdd = new GradidoUnit(12345n)
      expect(gdd.toString(3)).toBe('1.235')
    })

    it('with 2 places after comma', () => {
      const gdd = new GradidoUnit(12345n)
      expect(gdd.toString(2)).toBe('1.23')
    })

    it('with 1 place after comma', () => {
      const gdd = new GradidoUnit(12345n)
      expect(gdd.toString(1)).toBe('1.2')
    })

    it('with 0 places after comma', () => {
      const gdd = new GradidoUnit(12345n)
      expect(gdd.toString(0)).toBe('1')
    })
    it('with 5 places after comma (auto capped to 4)', () => {
      const gdd = new GradidoUnit(12345n)
      expect(gdd.toString(5)).toBe('1.2345')
    })
    it('big, but valid number with 3 places after comma', () => {
      const gdd = new GradidoUnit(156789012345n)
      expect(gdd.toString(3)).toBe('15678901.235')
    })
  })
  describe('legacy decay tests', () => {
    it('with large values', () => {
      const amount = GradidoUnit.fromNumber(100.0)
      const seconds = 1209600n
      expect(calculateDecayNative(amount.gddCent, seconds)).toBe(973781n)
    })

    it('with one year', () => {
      const amount = GradidoUnit.fromNumber(100.0)
      const seconds = 31556952n
      expect(calculateDecayNative(amount.gddCent, seconds)).toBe(500000n)
    })

    it('has correct backward calculation 1 GDD, 1 day', () => {
      const amount = GradidoUnit.fromNumber(1.0)
      const seconds = -(3600n * 24n)
      expect(calculateDecayNative(amount.gddCent, seconds)).toBe(10018n)
    })

    it("has correct backward calculation 1'000 GDD, 1 minute", () => {
      const amount = GradidoUnit.fromNumber(1000.0)
      const seconds = -(60n)
      expect(calculateDecayNative(amount.gddCent, seconds)).toBe(10000013n)
    })

    it("has correct backward calculation 10'000 GDD, 1 second", () => {
      const amount = GradidoUnit.fromNumber(10000.0)
      const seconds = -(1n)
      expect(calculateDecayNative(amount.gddCent, seconds)).toBe(100000002n)
    })

    // we get pretty close, but not exact here, luckily blockchain allow/ignore 1 GDD cent diff (0.0001 GDD)
    it('has correct forward calculation from number', () => {
      const amount = GradidoUnit.fromNumber(1.0019)
      const seconds = 3600n * 24n
      expect(calculateDecayNative(amount.gddCent, seconds)).toBe(10000n)
    })
    it('has correct forward calculation from bigInt', () => {
      const amount = new GradidoUnit(10019n)
      const seconds = 3600n * 24n
      expect(calculateDecayNative(amount.gddCent, seconds)).toBe(10000n)
    })
  })
})
