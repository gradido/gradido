// only for IDE, bun don't need this to work
import { describe, expect, it } from 'bun:test'
import { HARDENED_KEY_BITMASK, hardenDerivationIndex } from './derivationHelper'

describe('utils', () => {
  it('test bitmask for hardened keys', () => {
    const derivationIndex = hardenDerivationIndex(1)
    expect(derivationIndex).toBeGreaterThan(HARDENED_KEY_BITMASK)
  })
})
