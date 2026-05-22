const { describe, it } = require('node:test')
const { strict } = require("node:assert")
const assert = strict
const {
  calculateDecay,
  getDecayStartTime,
  gradidoUnitFromString,
  gradidoUnitToString,
  toDecimalPlaces,
  durationToString
} = require('../')

const { Decimal } = require('decimal.js-light')

// Set precision value
Decimal.set({
  precision: 25,
  rounding: Decimal.ROUND_HALF_UP,
})
// legacy decay calculation for comparisation with new decay calculation
// Expect bigint, return bigint
function decayFormula(value, seconds) {
  return BigInt(
    new Decimal(value.toString())
      .mul(
        new Decimal('0.99999997803504048973201202316767079413460520837376')
        .pow(seconds)
      )
      .toDecimalPlaces(0)
      .toString()
  )
}

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
        const legacyDecay = decayFormula(amount, 1)
        assert.equal(decay, 10000n)
        assert.equal(legacyDecay, decay)
      })
      it('100 gdd, 14 days', () => {
        const amount = 1000000n
        const decay = calculateDecay(amount, 14n * 24n * 60n * 60n)
        const legacyDecay = decayFormula(amount, 14 * 24 * 60 * 60)
        assert.equal(decay, 973781n)
        assert.equal(legacyDecay, decay)
      })
      it('100 gdd, 1 year', () => {
        const amount = 1000000n
        const decay = calculateDecay(amount, 31556952n)
        const legacyDecay = decayFormula(amount, 31556952)
        assert.equal(decay, 500000n)
        assert.equal(legacyDecay, decay)
      })
      it('0.0001 gdd, 1 second', () => {
          const amount = 1n
          const decay = calculateDecay(amount, 1n)
          const legacyDecay = decayFormula(amount, 1)
          assert.equal(decay, 1n)
          assert.equal(legacyDecay, decay)
      })

      it('1 gdd, 1 hour', () => {
        const amount = 10000n
        const decay = calculateDecay(amount, 3600n)
        const legacyDecay = decayFormula(amount, 3600)
        assert.equal(decay, 9999n)
        assert.equal(legacyDecay, decay)
      })

      it('1 gdd, 1 day', () => {
        const amount = 10000n
        const decay = calculateDecay(amount, 86400n)
        const legacyDecay = decayFormula(amount, 86400)
        assert.equal(decay, 9981n)
        assert.equal(legacyDecay, decay)
      })

      it('100 gdd, 30 days', () => {
        const amount = 1000000n
        const decay = calculateDecay(amount, 30n * 24n * 60n * 60n)
        const legacyDecay = decayFormula(amount, 30 * 24 * 60 * 60)
        assert.equal(decay, 944657n)
        assert.equal(legacyDecay, decay)
      })

      it('100 gdd, half year', () => {
        const amount = 1000000n
        const decay = calculateDecay(amount, 15778476n)
        const legacyDecay = decayFormula(amount, 15778476)
        assert.equal(decay, 707107n)
        assert.equal(legacyDecay, decay)
      })

      it('1000 gdd, 1 year', () => {
        const amount = 10000000n
        const decay = calculateDecay(amount, 31556952n)
        const legacyDecay = decayFormula(amount, 31556952)
        assert.equal(decay, 5000000n)
        assert.equal(legacyDecay, decay)
      })

      it('1000 gdd, 2 years', () => {
        const amount = 10000000n
        const decay = calculateDecay(amount, 2n * 31556952n)
        const legacyDecay = decayFormula(amount, 2 * 31556952)
        assert.equal(decay, 2500000n)
        assert.equal(legacyDecay, decay)
      })

      it('2 gdd, 1 second', () => {
        const amount = 20000n
        const decay = calculateDecay(amount, 1n)
        const legacyDecay = decayFormula(amount, 1)
        assert.equal(decay, 20000n)
        assert.equal(legacyDecay, decay)
      })

      it('5 gdd, 1 second', () => {
        const amount = 50000n
        const decay = calculateDecay(amount, 1n)
        const legacyDecay = decayFormula(amount, 1)
        assert.equal(decay, 50000n)
        assert.equal(legacyDecay, decay)
      })

      it('10 gdd, 1 second', () => {
        const amount = 100000n
        const decay = calculateDecay(amount, 1n)
        const legacyDecay = decayFormula(amount, 1)
        assert.equal(decay, 100000n)
        assert.equal(legacyDecay, decay)
      })

      it('25 gdd, 1 second', () => {
        const amount = 250000n
        const decay = calculateDecay(amount, 1n)
        const legacyDecay = decayFormula(amount, 1)
        assert.equal(decay, 250000n)
        assert.equal(legacyDecay, decay)
      })

      it('50 gdd, 1 second', () => {
        const amount = 500000n
        const decay = calculateDecay(amount, 1n)
        const legacyDecay = decayFormula(amount, 1)
        assert.equal(decay, 500000n)
        assert.equal(legacyDecay, decay)
      })

      it('75 gdd, 1 second', () => {
        const amount = 750000n
        const decay = calculateDecay(amount, 1n)
        const legacyDecay = decayFormula(amount, 1)
        assert.equal(decay, 750000n)
        assert.equal(legacyDecay, decay)
      })

      it('100 gdd, 1 second', () => {
        const amount = 1000000n
        const decay = calculateDecay(amount, 1n)
        const legacyDecay = decayFormula(amount, 1)
        assert.equal(decay, 1000000n)
        assert.equal(legacyDecay, decay)
      })

      it('250 gdd, 1 second', () => {
        const amount = 2500000n
        const decay = calculateDecay(amount, 1n)
        const legacyDecay = decayFormula(amount, 1)
        assert.equal(decay, 2500000n)
        assert.equal(legacyDecay, decay)
      })

      it('500 gdd, 1 second', () => {
        const amount = 5000000n
        const decay = calculateDecay(amount, 1n)
        const legacyDecay = decayFormula(amount, 1)
        assert.equal(decay, 5000000n)
        assert.equal(legacyDecay, decay)
      })

      it('750 gdd, 1 second', () => {
        const amount = 7500000n
        const decay = calculateDecay(amount, 1n)
        const legacyDecay = decayFormula(amount, 1)
        assert.equal(decay, 7500000n)
        assert.equal(legacyDecay, decay)
      })

      it('1000 gdd, 1 second', () => {
        const amount = 10000000n
        const decay = calculateDecay(amount, 1n)
        const legacyDecay = decayFormula(amount, 1)
        assert.equal(decay, 10000000n)
        assert.equal(legacyDecay, decay)
      })

      it('2500 gdd, 1 second', () => {
        const amount = 25000000n
        const decay = calculateDecay(amount, 1n)
        const legacyDecay = decayFormula(amount, 1)
        assert.equal(decay, 24999999n)
        assert.equal(legacyDecay, decay)
      })

      it('5000 gdd, 1 second', () => {
        const amount = 50000000n
        const decay = calculateDecay(amount, 1n)
        const legacyDecay = decayFormula(amount, 1)
        assert.equal(decay, 49999999n)
        assert.equal(legacyDecay, decay)
      })

      it('10000 gdd, 1 second', () => {
        const amount = 100000000n
        const decay = calculateDecay(amount, 1n)
        const legacyDecay = decayFormula(amount, 1)
        assert.equal(decay, 99999998n)
        assert.equal(legacyDecay, decay)
      })

      it('25000 gdd, 1 second', () => {
        const amount = 250000000n
        const decay = calculateDecay(amount, 1n)
        const legacyDecay = decayFormula(amount, 1)
        assert.equal(decay, 249999995n)
        assert.equal(legacyDecay, decay)
      })

      it('50000 gdd, 1 second', () => {
        const amount = 500000000n
        const decay = calculateDecay(amount, 1n)
        const legacyDecay = decayFormula(amount, 1)
        assert.equal(decay, 499999989n)
        assert.equal(legacyDecay, decay)
      })

      it('100000 gdd, 1 second', () => {
        const amount = 1000000000n
        const decay = calculateDecay(amount, 1n)
        const legacyDecay = decayFormula(amount, 1)
        assert.equal(decay, 999999978n)
        assert.equal(legacyDecay, decay)
      })

      it('250000 gdd, 1 second', () => {
        const amount = 2500000000n
        const decay = calculateDecay(amount, 1n)
        const legacyDecay = decayFormula(amount, 1)
        assert.equal(decay, 2499999945n)
        assert.equal(legacyDecay, decay)
      })

      it('500000 gdd, 1 second', () => {
        const amount = 5000000000n
        const decay = calculateDecay(amount, 1n)
        const legacyDecay = decayFormula(amount, 1)
        assert.equal(decay, 4999999890n)
        assert.equal(legacyDecay, decay)
      })

      it('1000000 gdd, 1 second', () => {
        const amount = 10000000000n
        const decay = calculateDecay(amount, 1n)
        const legacyDecay = decayFormula(amount, 1)
        assert.equal(decay, 9999999780n)
        assert.equal(legacyDecay, decay)
      })

      it('max-ish value, 1 year', () => {
        const amount = 9223372036854775807n
        const decay = calculateDecay(amount, 31556952n)
        const legacyDecay = decayFormula(amount, 31556952)
        assert.equal(decay, 4611686018427387903n)
        assert.equal(legacyDecay, decay)
      })
    })
  })

  describe('GradidoUnit > calculateDecay > monotonic stability over long range', () => {
    it.skip('TestWithManyDifferentDuration', () => {
      const amount = 100000000n

      let prevValue = 0n
      let prevDistance = 0n

      const TWO_YEARS = 31556952 * 2

      for (let i = 1; i < TWO_YEARS; i += 32) {
        const decayed = decayFormula(amount, i)

        if (prevValue !== 0n) {
          // monotonicity: value must never increase
          assert.ok(
            prevValue >= decayed,
            `previous value wasn't greater on i: ${i}`
          )

          const distance = prevValue - decayed

          if (prevDistance !== 0n) {
            const diff = prevDistance > distance
              ? prevDistance - distance
              : distance - prevDistance

            assert.ok(
              diff <= 1n,
              `distance increased unexpectedly i: ${i} (diff=${diff})`
            )
          }

          prevDistance = distance
        }

        prevValue = decayed
        process.stdout.write(`${i}/${TWO_YEARS} = ${i / TWO_YEARS * 100} %\r`)
      }
      process.stdout.write(`\n`)
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

  describe('durationToString', () => {
    it('converts duration to string', () => {
      const duration = 1000000000n
      const result = durationToString(duration)
      assert.equal(result, '1.00 s')
    })
    it('converts duration to string with custom precision', () => {
      const duration = 1000000000n
      const result = durationToString(duration, 3)
      assert.equal(result, '1.000 s')
    })
    it('converts duration to string with zero precision', () => {
      const duration = 1000000000n
      const result = durationToString(duration, 0)
      assert.equal(result, '1 s')
    })
    it('converts for ms', () => {
      const duration = 1000000n
      const result = durationToString(duration)
      assert.equal(result, '1.00 ms')
    })
    it('converts for us', () => {
      const duration = 1000n
      const result = durationToString(duration)
      assert.equal(result, '1.00 us')
    })
    it('converts for ms with decimal places', () => {
      const duration = 726372839n
      const result = durationToString(duration)
      assert.equal(result, '726.37 ms')
    })
  })
})
