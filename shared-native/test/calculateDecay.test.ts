import { describe, expect, it } from 'bun:test'
import {
  calculateDecay,
  getDecayStartTime,
  gradidoUnitFromString,
  gradidoUnitToString,
  toDecimalPlaces,
} from '../'

describe('GradidoUnit', () => {
  describe('fromString', () => {
    it('converts string to GradidoUnit', () => {
      const result = gradidoUnitFromString('10012041')
      expect(result).toBe(100120410000n)
    })
    it('converts string to GradidoUnit (negative)', () => {
      const result = gradidoUnitFromString('-10012041')
      expect(result).toBe(-100120410000n)
    })
    it('converts string with decimal to GradidoUnit', () => {
      const result = gradidoUnitFromString('1001.2041')
      expect(result).toBe(10012041n)
    })
    it('converts negative sub integer to GradidoUnit', () => {
      const result = gradidoUnitFromString('-0.2041')
      expect(result).toBe(-2041n)
    })
    it('converts invalid (to big) string to GradidoUnit ', () => {
      expect(() => gradidoUnitFromString('922337203685576.12812')).toThrowError(
        "Invalid unit string. Must be a decimal with up to 4 fractional digits, integer part between -922'337'203'685'476 and 922'337'203'685'476.",
      )
    })
    it('converts invalid (to small) string to GradidoUnit ', () => {
      expect(() => gradidoUnitFromString('-922337203685576.12812')).toThrowError(
        "Invalid unit string. Must be a decimal with up to 4 fractional digits, integer part between -922'337'203'685'476 and 922'337'203'685'476.",
      )
    })
    it('round 5th decimal', () => {
      const result = gradidoUnitFromString('1001.20415')
      expect(result).toBe(10012042n)
    })
    it('round 5th decimal (negative)', () => {
      const result = gradidoUnitFromString('-1001.20415')
      expect(result).toBe(-10012042n)
    })
    it('round 5th decimal down', () => {
      const result = gradidoUnitFromString('1001.20414')
      expect(result).toBe(10012041n)
    })
    it('round 5th decimal down (negative)', () => {
      const result = gradidoUnitFromString('-1001.20414')
      expect(result).toBe(-10012041n)
    })

    it("don't round 6th decimal", () => {
      const result = gradidoUnitFromString('1001.204145')
      expect(result).toBe(10012041n)
    })
    it('positive number 1001.2041', () => {
      const result = gradidoUnitFromString('1001.2041')
      expect(result).toBe(10012041n)
    })
    it('negative number -1001.2041', () => {
      const result = gradidoUnitFromString('-1001.2041')
      expect(result).toBe(-10012041n)
    })
  })
  describe('toString', () => {
    it('converts BigInt to string', () => {
      const result = gradidoUnitToString(10012041n)
      expect(result).toBe('1001.2041')
    })
    it('converts BigInt to string with precision 7 (throw error)', () => {
      expect(() => gradidoUnitToString(10012041n, 7)).toThrowError(
        'Precision must be between 0 and 4',
      )
    })
    it('converts BigInt to string with precision 3', () => {
      const result = gradidoUnitToString(10012041n, 3)
      expect(result).toBe('1001.204')
    })
    it('converts BigInt to string with precision 2', () => {
      const result = gradidoUnitToString(10012041n, 2)
      expect(result).toBe('1001.20')
    })
    it('converts BigInt to string with precision 1', () => {
      const result = gradidoUnitToString(10012041n, 1)
      expect(result).toBe('1001.2')
    })
    it('converts BigInt to string with precision 0', () => {
      const result = gradidoUnitToString(10012041n, 0)
      expect(result).toBe('1001')
    })
    it('converts negative BigInt to string with precision 3', () => {
      const result = gradidoUnitToString(-10012041n, 3)
      expect(result).toBe('-1001.204')
    })
    it('converts negative BigInt to string with precision 2', () => {
      const result = gradidoUnitToString(-10012041n, 2)
      expect(result).toBe('-1001.20')
    })
    it('converts negative BigInt to string with precision 1', () => {
      const result = gradidoUnitToString(-10012041n, 1)
      expect(result).toBe('-1001.2')
    })
    it('converts negative BigInt to string with precision 0', () => {
      const result = gradidoUnitToString(-10012041n, 0)
      expect(result).toBe('-1001')
    })
    it('converts negative BigInt to string', () => {
      const result = gradidoUnitToString(-10012041n)
      expect(result).toBe('-1001.2041')
    })
  })
  describe('calculateDecay', () => {
    it('decay 0 seconds', () => {
      const amount = 10012041n
      const decay = calculateDecay(amount, 0n)
      expect(decay).toBe(amount)
      expect(decay).toBe(10012041n)
    })
    it('decay 10 seconds', () => {
      const amount = 10012041n
      const decay = calculateDecay(amount, 10n)
      expect(decay).toBe(10012039n)
    })
    it('decayed 10 seconds', () => {
      const amount = 10012041n
      const decayed = calculateDecay(amount, 10n)
      expect(decayed).not.toBe(amount)
      expect(decayed).toBe(10012039n)
    })
    describe('different gdd seconds pairs', () => {
      it('1 gdd, 1 second', () => {
        const amount = 10000n
        const decay = calculateDecay(amount, 1n)
        expect(decay).toBe(10000n)
      })
      it('100 gdd, 14 days', () => {
        const amount = 1000000n
        const decay = calculateDecay(amount, 14n * 24n * 60n * 60n)
        expect(decay).toBe(973781n)
      })
      it('100 gdd, 1 year', () => {
        const amount = 1000000n
        const decay = calculateDecay(amount, 31556952n)
        expect(decay).toBe(500000n)
      })
    })
  })

  describe('calculateDecay with very large numbers', () => {
    it('handles very large amounts', () => {
      const amount = 1000000000000000000n
      const decay = calculateDecay(amount, 0n)
      expect(decay).toBe(amount)
    })
  })
  describe('calculateDecay with edge cases', () => {
    it('handles edge case with minimal amount', () => {
      const amount = 1n
      const decay = calculateDecay(amount, 0n)
      expect(decay).toBe(amount)
    })
  })
  describe('getDecayStartTime', () => {
    it('returns a valid Date object', () => {
      const startTime = getDecayStartTime()
      expect(startTime).toBeInstanceOf(Date)
      expect(startTime.getTime()).toBe(1620927)
    })
  })
  describe('toDecimalPlaces', () => {
    it('rounds to 3 decimal places', () => {
      const result = toDecimalPlaces(10012041n, 3)
      expect(result).toBe(10012040n)
    })
    it('rounds to 2 decimal places', () => {
      const result = toDecimalPlaces(10012041n, 2)
      expect(result).toBe(10012000n)
    })
    it('rounds to 1 decimal place', () => {
      const result = toDecimalPlaces(10012741n, 1)
      expect(result).toBe(10013000n)
    })
    it('rounds to 0 decimal places', () => {
      const result = toDecimalPlaces(10012041n, 0)
      expect(result).toBe(10010000n)
    })
    it('handles negative numbers', () => {
      const result = toDecimalPlaces(-10012041n, 2)
      expect(result).toBe(-10012000n)
    })
  })
  describe('reverse decay', () => {
    it('reverses decay correctly', () => {
      const amount = 10012041n
      const decayed = calculateDecay(amount, 10n)
      const reversed = calculateDecay(decayed, -10n)
      expect(reversed).toBe(amount)
    })
  })
  describe('find good break points', () => {
    const secondsPerYear = 33554432n// 31556952n
    it('finds good break points', () => {
      const amount = 1000000n
      const values = [
        secondsPerYear / 2n,
        secondsPerYear / 4n,
        secondsPerYear / 8n,
        secondsPerYear / 16n,
        secondsPerYear / 32n,
        secondsPerYear / 64n,
        secondsPerYear / 128n,
        secondsPerYear / 256n,
        secondsPerYear / 512n,
        secondsPerYear / 1024n,
      ]
      values.forEach((value, index) => {
        const decay = calculateDecay(amount, value)
        console.log(`[${index}] Decay after ${value} seconds: ${decay}`)
      })
    })
  })
})
