// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'vitest'
import { LINK_COMPOUND_INTEREST_FACTOR, LINK_VALID_DAYS, linkAmountMax } from './constants'

describe('the days a link stays open', () => {
  it('are what the factor reckons from', () => {
    expect(LINK_COMPOUND_INTEREST_FACTOR).toBe(Math.pow(2, LINK_VALID_DAYS / 365.2425))
    expect(LINK_COMPOUND_INTEREST_FACTOR).toBeGreaterThan(1)
  })
})

describe('linkAmountMax', () => {
  // The rule of the confirmation step of the send form (TransactionConfirmationLink): the
  // amount times the factor has to fit into the balance.
  it('is the highest amount to the cent that still fits with its reserve', () => {
    for (const balance of [0.02, 1, 20, 97.37, 100, 1234.56]) {
      const max = linkAmountMax(balance)

      expect(max * LINK_COMPOUND_INTEREST_FACTOR).toBeLessThanOrEqual(balance)
      expect((max + 0.01) * LINK_COMPOUND_INTEREST_FACTOR).toBeGreaterThan(balance)
      expect(Number(max.toFixed(2))).toBe(max)
    }
  })

  it('is 97.37 out of 100', () => {
    expect(linkAmountMax(100)).toBe(97.37)
  })

  it('is nothing out of nothing, and never below it', () => {
    expect(linkAmountMax(0)).toBe(0)
    expect(linkAmountMax(-5)).toBe(0)
    expect(linkAmountMax(0.01)).toBe(0)
  })
})
