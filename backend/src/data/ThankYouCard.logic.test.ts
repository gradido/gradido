// AI-GENERATED — not an architecture reference
import {
  createThankYouCardCode,
  createThankYouCardPinSalt,
  isValidThankYouCardPin,
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
