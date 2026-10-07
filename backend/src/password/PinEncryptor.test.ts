// AI-GENERATED — not an architecture reference
import { deriveKeyedPinKey } from './PinEncryptor'

// test/testSetup.ts initializes the app context with the development secrets of .env.dist

describe('deriveKeyedPinKey', () => {
  it('is deterministic', () => {
    expect(deriveKeyedPinKey('salt-1', '123456')).toBe(deriveKeyedPinKey('salt-1', '123456'))
  })

  it.each([
    ['the salt', () => deriveKeyedPinKey('salt-2', '123456')],
    ['the pin', () => deriveKeyedPinKey('salt-1', '654321')],
  ])('changes when %s changes', (_name, derive) => {
    expect(derive()).not.toBe(deriveKeyedPinKey('salt-1', '123456'))
  })

  /**
   * ⛔ The exact output for fixed inputs, pinned on purpose (and once more in
   * shared-native/tests/appContext.test.js, against the native class). If this test falls,
   * the derivation changed -- and every stored KEYED_HASH pin on every server would stop
   * matching, with no way to tell that apart from a wrong PIN. A change here needs a new
   * `pin_derivation` value, never an edit in place.
   */
  it('never changes its answer for a known input', () => {
    expect(deriveKeyedPinKey('fixed-salt', '000000')).toBe(4194897870853666154n)
  })

  it('answers a bigint, the shape the column stores', () => {
    expect(typeof deriveKeyedPinKey('s', '1')).toBe('bigint')
  })
})
