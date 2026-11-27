// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { guarantorCodeState } from './Guarantor.logic'

const NOW = 1_760_000_000_000

describe('guarantorCodeState', () => {
  it('is active until the second its first part names', () => {
    expect(guarantorCodeState('1760000001.seal-AAAA_BBBB', NOW)).toBe('active')
    expect(guarantorCodeState('1760000000.seal', NOW)).toBe('expired')
    expect(guarantorCodeState('1000000000.seal', NOW)).toBe('expired')
  })

  it('is none where it is not written as a code', () => {
    for (const none of [
      undefined,
      '',
      'seal',
      '1760000001',
      '1760000001.',
      '.seal',
      'x.seal',
      '1.se al',
    ]) {
      expect(guarantorCodeState(none, NOW)).toBe('none')
    }
    // a query named twice
    expect(guarantorCodeState(['1760000001.seal'], NOW)).toBe('none')
  })
})
