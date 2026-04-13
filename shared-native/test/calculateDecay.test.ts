import { describe, expect, it } from 'bun:test'
import { calculateDecay, getDecayStartTime } from '../'

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
    expect(decay).toBe(10012038n)
  })
  it('decayed 10 seconds', () => {
    const amount = 10012041n
    const decayed = calculateDecay(amount, 10n)
    expect(decayed).not.toBe(amount)
    expect(decayed).toBe(10012038n)
  })
  describe('different gdd seconds pairs', () => {
    it('1 gdd, 1 second', () => {
      const amount = 10000n
      const decay = calculateDecay(amount, 1n)
      expect(decay).toBe(9999n)
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
