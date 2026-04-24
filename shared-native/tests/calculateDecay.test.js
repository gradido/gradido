const { describe, it } = require('node:test');
const { strict } = require("node:assert");
const assert = strict;
const {
  calculateDecay,
  getDecayStartTime,
  gradidoUnitFromString,
  gradidoUnitToString,
  toDecimalPlaces,
} = require('../');

describe('GradidoUnit', () => {
  
  describe('gradidoUnitFromString', () => {
    it('converts string to GradidoUnit', () => {
      const result = gradidoUnitFromString('10012041')
      assert.equal(result, 100120410000n)
    })
    it('converts string to GradidoUnit (negative)', () => {
      const result = gradidoUnitFromString('-10012041')
      assert.equal(result, -100120410000n)
    })
    it('converts string with decimal to GradidoUnit', () => {
      const result = gradidoUnitFromString('1001.2041')
      assert.equal(result, 10012041n)
    })
    it('converts negative sub integer to GradidoUnit', () => {
      const result = gradidoUnitFromString('-0.2041')
      assert.equal(result, -2041n)
    })
    it('converts invalid (to big) string to GradidoUnit ', () => {
      assert.throws(() => gradidoUnitFromString('922337203685576.12812'), {
        message: "Invalid unit string. Must be a decimal with up to 4 fractional digits, integer part between -922'337'203'685'476 and 922'337'203'685'476."
      })
    })
    it('converts invalid (to small) string to GradidoUnit ', () => {
      assert.throws(() => gradidoUnitFromString('-922337203685576.12812'), {
        message: "Invalid unit string. Must be a decimal with up to 4 fractional digits, integer part between -922'337'203'685'476 and 922'337'203'685'476."
      })
    })
    it('round 5th decimal', () => {
      const result = gradidoUnitFromString('1001.20415')
      assert.equal(result, 10012042n)
    })
    it('round 5th decimal (negative)', () => {
      const result = gradidoUnitFromString('-1001.20415')
      assert.equal(result, -10012042n)
    })
    it('round 5th decimal down', () => {
      const result = gradidoUnitFromString('1001.20414')
      assert.equal(result, 10012041n)
    })
    it('round 5th decimal down (negative)', () => {
      const result = gradidoUnitFromString('-1001.20414')
      assert.equal(result, -10012041n)
    })

    it("don't round 6th decimal", () => {
      const result = gradidoUnitFromString('1001.204145')
      assert.equal(result, 10012041n)
    })
    it('positive number 1001.2041', () => {
      const result = gradidoUnitFromString('1001.2041')
      assert.equal(result, 10012041n)
    })
    it('negative number -1001.2041', () => {
      const result = gradidoUnitFromString('-1001.2041')
      assert.equal(result, -10012041n)
    })
  })

  describe('gradidoUnitToString', () => {
    it('converts BigInt to string', () => {
      const result = gradidoUnitToString(10012041n)
      assert.equal(result, '1001.2041')
    })
    it('converts BigInt to string with precision 7 (throw error)', () => {
      assert.throws(() => gradidoUnitToString(10012041n, 7), {
        message: 'Precision must be between 0 and 4'
      })
    })
    it('converts BigInt to string with precision 3', () => {
      const result = gradidoUnitToString(10012041n, 3)
      assert.equal(result, '1001.204')
    })
    it('converts BigInt to string with precision 2', () => {
      const result = gradidoUnitToString(10012041n, 2)
      assert.equal(result, '1001.20')
    })
    it('converts BigInt to string with precision 1', () => {
      const result = gradidoUnitToString(10012041n, 1)
      assert.equal(result, '1001.2')
    })
    it('converts BigInt to string with precision 0', () => {
      const result = gradidoUnitToString(10012041n, 0)
      assert.equal(result, '1001')
    })
    it('converts negative BigInt to string with precision 3', () => {
      const result = gradidoUnitToString(-10012041n, 3)
      assert.equal(result, '-1001.204')
    })
    it('converts negative BigInt to string with precision 2', () => {
      const result = gradidoUnitToString(-10012041n, 2)
      assert.equal(result, '-1001.20')
    })
    it('converts negative BigInt to string with precision 1', () => {
      const result = gradidoUnitToString(-10012041n, 1)
      assert.equal(result, '-1001.2')
    })
    it('converts negative BigInt to string with precision 0', () => {
      const result = gradidoUnitToString(-10012041n, 0)
      assert.equal(result, '-1001')
    })
    it('converts negative BigInt to string', () => {
      const result = gradidoUnitToString(-10012041n)
      assert.equal(result, '-1001.2041')
    })
  })

  describe('toDecimalPlaces', () => {
    it('rounds to 4 decimal places', () => {
      const result = toDecimalPlaces(100121415n, 4)
      assert.equal(result, 100121415n)
    })
    it('rounds to 3 decimal places', () => {
      const result = toDecimalPlaces(100121415n, 3)
      assert.equal(result, 100121420n)
    })
    it('rounds to 2 decimal places', () => {
      const result = toDecimalPlaces(100121415n, 2)
      assert.equal(result, 100121400n)
    })
    it('rounds to 1 decimal place', () => {
      const result = toDecimalPlaces(100121415n, 1)
      assert.equal(result, 100121000n)
    })
    it('rounds to 0 decimal places', () => {
      const result = toDecimalPlaces(100121415n, 0)
      assert.equal(result, 100120000n)
    })
  })

  describe('calculateDecay', () => {
    it('decay 0 seconds', () => {
      const amount = 10012041n
      const decay = calculateDecay(amount, 0n)
      assert.equal(decay, amount)
      assert.equal(decay, 10012041n)
    })
    it('decay 10 seconds', () => {
      const amount = 10012041n
      const decay = calculateDecay(amount, 10n)
      assert.equal(decay, 10012039n)
    })
    it('decayed 10 seconds', () => {
      const amount = 10012041n
      const decayed = calculateDecay(amount, 10n)
      assert.notEqual(decayed, amount)
      assert.equal(decayed, 10012039n)
    })
    describe('different gdd seconds pairs', () => {
      it('1 gdd, 1 second', () => {
        const amount = 10000n
        const decay = calculateDecay(amount, 1n)
        assert.equal(decay, 10000n)
      })
      it('100 gdd, 14 days', () => {
        const amount = 1000000n
        const decay = calculateDecay(amount, 14n * 24n * 60n * 60n)
        assert.equal(decay, 973781n)
      })
      it('100 gdd, 1 year', () => {
        const amount = 1000000n
        const decay = calculateDecay(amount, 31556952n)
        assert.equal(decay, 500000n)
      })
    })
  })

  describe('calculateDecay with very large numbers', () => {
    it('handles very large amounts', () => {
      const amount = 1000000000000000000n
      const decay = calculateDecay(amount, 0n)
      assert.equal(decay, amount)
    })
  })
  describe('calculateDecay with edge cases', () => {
    it('handles edge case with minimal amount', () => {
      const amount = 1n
      const decay = calculateDecay(amount, 0n)
      assert.equal(decay, amount)
    })
  })
  describe('getDecayStartTime', () => {
    it('returns a valid Date object', () => {
      const startTime = getDecayStartTime()
      assert(startTime instanceof Date)
      assert.equal(startTime.getTime(), 1620927991000)
    })
  })
})
