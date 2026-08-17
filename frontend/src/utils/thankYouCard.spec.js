// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'vitest'
import { thankYouCardFileName } from './thankYouCard'

describe('thankYouCardFileName', () => {
  it('puts the label into the name so a folder sorts by card', () => {
    expect(thankYouCardFileName('Portemonnaie')).toBe('Dank-Karte Portemonnaie.png')
  })

  it('falls back to the bare name when there is no label', () => {
    expect(thankYouCardFileName('')).toBe('Dank-Karte.png')
    expect(thankYouCardFileName(null)).toBe('Dank-Karte.png')
    expect(thankYouCardFileName(undefined)).toBe('Dank-Karte.png')
  })

  // The label is whatever its owner typed, so it reaches this having been checked for
  // nothing. Reusing the cheque's builder is what makes that safe -- these two cases are
  // here to prove the reuse actually happens rather than to re-test its rules.
  it('takes the characters a file name cannot carry out of the label', () => {
    expect(thankYouCardFileName('Karte/2026')).not.toContain('/')
    expect(thankYouCardFileName('a<b>c:d"e|f?g*h')).toMatch(/^Dank-Karte [^<>:"/\\|?*]+\.png$/)
  })

  it('does not let a label end the name in a dot', () => {
    expect(thankYouCardFileName('Auto...')).not.toContain('..png')
  })
})
