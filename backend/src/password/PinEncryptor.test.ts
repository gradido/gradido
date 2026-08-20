// AI-GENERATED — not an architecture reference
import { deriveKeyedPinKeyFunc } from './PinEncryptor'

const appSecret = Buffer.from('21ffbbc616fe', 'hex')
const serverKey = Buffer.from('a51ef8ac7ef1abf162fb7a65261acd7a', 'hex')

describe('deriveKeyedPinKeyFunc', () => {
  it('is deterministic', () => {
    expect(deriveKeyedPinKeyFunc('salt-1', '123456', appSecret, serverKey)).toBe(
      deriveKeyedPinKeyFunc('salt-1', '123456', appSecret, serverKey),
    )
  })

  it.each([
    ['the salt', () => deriveKeyedPinKeyFunc('salt-2', '123456', appSecret, serverKey)],
    ['the pin', () => deriveKeyedPinKeyFunc('salt-1', '654321', appSecret, serverKey)],
    [
      'the app secret',
      () => deriveKeyedPinKeyFunc('salt-1', '123456', Buffer.from('ff', 'hex'), serverKey),
    ],
    [
      'the server key',
      () =>
        deriveKeyedPinKeyFunc(
          'salt-1',
          '123456',
          appSecret,
          Buffer.from('b51ef8ac7ef1abf162fb7a65261acd7a', 'hex'),
        ),
    ],
  ])('changes when %s changes', (_name, derive) => {
    expect(derive()).not.toBe(deriveKeyedPinKeyFunc('salt-1', '123456', appSecret, serverKey))
  })

  /**
   * ⛔ The exact output for fixed inputs, pinned on purpose. If this test falls, the
   * derivation changed -- and every stored KEYED_HASH pin on every server would stop
   * matching, with no way to tell that apart from a wrong PIN. A change here needs a new
   * `pin_derivation` value, never an edit in place.
   */
  it('never changes its answer for a known input', () => {
    // Frozen as a literal, computed once at build time -- a snapshot would be regenerated
    // fresh on every CI run and hold nothing.
    expect(deriveKeyedPinKeyFunc('fixed-salt', '000000', appSecret, serverKey)).toBe(
      4194897870853666154n,
    )
  })

  it('answers a bigint, the shape the column stores', () => {
    expect(typeof deriveKeyedPinKeyFunc('s', '1', appSecret, serverKey)).toBe('bigint')
  })
})
