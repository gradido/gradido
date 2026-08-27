// AI-GENERATED — not an architecture reference
import {
  createThankYouCardCode,
  createThankYouCardPinSalt,
  isValidThankYouCardPin,
  pinMatches,
  startOfDay,
  startOfNextDay,
  THANK_YOU_CARD_CODE_PREFIX,
} from './ThankYouCard.logic'

describe('createThankYouCardCode', () => {
  it('carries the prefix and 32 hex characters, so 128 bits of randomness', () => {
    const code = createThankYouCardCode()

    expect(code).toMatch(/^DK-[0-9a-f]{32}$/)
    expect(code).toHaveLength(THANK_YOU_CARD_CODE_PREFIX.length + 32)
  })

  // The transaction link spends part of its length on the creation time. A card must
  // not, so this checks that nothing time-shaped crept back in: two codes made in the
  // same millisecond have to differ everywhere, not just at the front.
  it('shares no tail with a code made a moment earlier', () => {
    const first = createThankYouCardCode()
    const second = createThankYouCardCode()

    expect(first).not.toBe(second)
    expect(first.slice(-11)).not.toBe(second.slice(-11))
  })
})

describe('createThankYouCardPinSalt', () => {
  it('is different every time', () => {
    expect(createThankYouCardPinSalt()).not.toBe(createThankYouCardPinSalt())
  })
})

describe('isValidThankYouCardPin', () => {
  it('accepts six unremarkable digits', () => {
    expect(isValidThankYouCardPin('407312')).toBe(true)
    expect(isValidThankYouCardPin('900154')).toBe(true)
  })

  it('refuses anything that is not exactly six digits', () => {
    expect(isValidThankYouCardPin('12345')).toBe(false)
    expect(isValidThankYouCardPin('1234567')).toBe(false)
    expect(isValidThankYouCardPin('12a456')).toBe(false)
    expect(isValidThankYouCardPin('')).toBe(false)
    expect(isValidThankYouCardPin(' 123456')).toBe(false)
  })

  it('refuses one digit repeated', () => {
    expect(isValidThankYouCardPin('111111')).toBe(false)
    expect(isValidThankYouCardPin('000000')).toBe(false)
  })

  it('refuses runs in both directions', () => {
    expect(isValidThankYouCardPin('123456')).toBe(false)
    expect(isValidThankYouCardPin('654321')).toBe(false)
    expect(isValidThankYouCardPin('456789')).toBe(false)
  })

  it('refuses a PIN that starts with a plausible year', () => {
    expect(isValidThankYouCardPin('195804')).toBe(false)
    expect(isValidThankYouCardPin('202611')).toBe(false)
  })

  it('still accepts a run that breaks somewhere', () => {
    expect(isValidThankYouCardPin('123457')).toBe(true)
  })
})

describe('startOfDay', () => {
  it('winds a moment back to midnight of its own day', () => {
    const start = startOfDay(new Date('2026-08-16T21:44:31.500'))

    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
    expect(start.getSeconds()).toBe(0)
    expect(start.getMilliseconds()).toBe(0)
    expect(start.getDate()).toBe(16)
  })

  it('leaves the moment it was given alone', () => {
    const now = new Date('2026-08-16T21:44:31.500')
    startOfDay(now)

    expect(now.getHours()).toBe(21)
  })
})

describe('startOfNextDay', () => {
  it('is midnight at the end of that same day', () => {
    const end = startOfNextDay(new Date('2026-08-16T23:58:00.000'))

    expect(end.getDate()).toBe(17)
    expect(end.getHours()).toBe(0)
    expect(end.getMinutes()).toBe(0)
    expect(end.getMilliseconds()).toBe(0)
  })

  it('carries over the end of a month', () => {
    const end = startOfNextDay(new Date('2026-08-31T12:00:00.000'))

    expect(end.getMonth()).toBe(8) // September, counted from zero
    expect(end.getDate()).toBe(1)
  })

  // The pair is what the daily limit is counted over, so a request created just before
  // midnight has to fall inside its own day and outside the next one.
  it('bounds exactly the day the moment belongs to', () => {
    const lateAtNight = new Date('2026-08-16T23:58:00.000')

    expect(startOfDay(lateAtNight).getTime()).toBeLessThanOrEqual(lateAtNight.getTime())
    expect(startOfNextDay(lateAtNight).getTime()).toBeGreaterThan(lateAtNight.getTime())
    expect(startOfNextDay(lateAtNight).getDate()).toBe(startOfDay(lateAtNight).getDate() + 1)
  })

  it('leaves the moment it was given alone', () => {
    const now = new Date('2026-08-16T21:44:31.500')
    startOfNextDay(now)

    expect(now.getDate()).toBe(16)
  })
})

/**
 * ⛔ The one that cost a whole evening. `!==` between the stored value and the derived one
 * looks obviously right and is obviously wrong: the two do not come from the same place —
 * the database through Drizzle, the derivation possibly across a worker boundary — and
 * neither end guarantees the JS type. When they disagree, EVERY PIN is wrong, for
 * everybody, while the server counts attempts and blocks the card as if a stranger were
 * guessing. The house has compared this derivation as strings since long before the card.
 */
describe('pinMatches', () => {
  it('accepts the same value however each side spells it', () => {
    expect(pinMatches(1234567890123456789n, 1234567890123456789n)).toBe(true)
    expect(pinMatches(1234567890123456789n, '1234567890123456789')).toBe(true)
    expect(pinMatches('1234567890123456789', 1234567890123456789n)).toBe(true)
  })

  // ⛔ This is the case that was broken in production: a bigint out of the database against
  // its own decimal spelling out of the worker. A strict comparison says "wrong PIN".
  it('is exactly what a strict comparison gets wrong', () => {
    // Typed as unknown on purpose: this is the shape the values really arrive in, and
    // TypeScript refuses to compare a bigint with a string at all — which is worth noting,
    // because in the resolver both sides were typed loosely enough that it never complained.
    const stored: unknown = 9007199254740993n
    const offered: unknown = '9007199254740993'

    expect(offered !== stored).toBe(true) // what the code used to ask
    expect(pinMatches(offered, stored)).toBe(true) // what it means to ask
  })

  it('still says no to a different value', () => {
    expect(pinMatches(1234567890123456789n, 1234567890123456788n)).toBe(false)
    expect(pinMatches('1234567890123456789', '987')).toBe(false)
  })

  // Nothing may be read as "matches": a missing stored value must not let anybody in.
  it('refuses when either side is missing', () => {
    expect(pinMatches(undefined, undefined)).toBe(false)
    expect(pinMatches(null, null)).toBe(false)
    expect(pinMatches(1234n, null)).toBe(false)
    expect(pinMatches(undefined, 1234n)).toBe(false)
  })
})
