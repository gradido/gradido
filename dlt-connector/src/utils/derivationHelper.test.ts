import 'reflect-metadata'

import { hardenDerivationIndex, HARDENED_KEY_BITMASK } from './derivationHelper'

describe('utils', () => {
  it('test bitmask for hardened keys', () => {
    const derivationIndex = hardenDerivationIndex(1)
    expect(derivationIndex).toBeGreaterThan(HARDENED_KEY_BITMASK)
  })
})
