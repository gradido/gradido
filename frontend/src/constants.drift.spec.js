// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { LINK_COMPOUND_INTEREST_FACTOR, LINK_VALID_DAYS, linkAmountMax } from './constants'

// How many days a transaction link stays open exists twice: in `shared`, where the server
// takes it from, and here, where the wallet says it to the member ("Dein Gruß wartet 14 Tage")
// and reckons what a link holds on top of its amount. The wallet does not depend on `shared`.
//
// What drift costs: a sentence that promises more or fewer days than the link gets, and a
// highest amount the server then refuses -- or one that is lower than it had to be.
//
// ⚠️ Read as text, not imported: shared/src/const/index.ts loads `shared-native`, a native
// binding, with its first line. And `fileURLToPath`, not `new URL(...)`: jsdom brings its own
// `URL` class, and node turns an instance of it away as coming from another realm.
const sharedConst = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'shared', 'src', 'const', 'index.ts'),
  'utf8',
)

describe('the days a link stays open, on both sides', () => {
  it('are the same number here and in shared', () => {
    const [, days] = sharedConst.match(/^export const CODE_VALID_DAYS_DURATION = (\d+)$/m) ?? []

    // The fixture has to prove itself: no match would compare a number with nothing.
    expect(days).toBeDefined()
    expect(LINK_VALID_DAYS).toBe(Number(days))
  })

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
