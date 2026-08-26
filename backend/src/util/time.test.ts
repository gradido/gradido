// AI-GENERATED — not an architecture reference
import { printDateTime, resolveDateTimeLocale } from './time'

describe('printDateTime', () => {
  const moment = new Date('2026-08-27T09:05:00Z')

  // The first version of this asked Intl for `dateStyle` together with `timeZoneName`, which
  // is a RangeError - and the fallback below would have thrown in exactly the same way, so
  // the mail would have died instead of going out. A typecheck cannot see that; this can.
  it('writes a moment out without throwing, with a time on it', () => {
    const written = printDateTime(moment, 'de')
    expect(written).toContain('2026')
    expect(written).toMatch(/\d{1,2}:\d{2}/)
  })

  it('writes it in the language it was handed', () => {
    expect(printDateTime(moment, 'de')).not.toBe(printDateTime(moment, 'en'))
  })

  it('falls back to English for a tag Intl cannot read, instead of costing the mail', () => {
    expect(printDateTime(moment, 'not a language tag')).toBe(printDateTime(moment, 'en'))
  })
})

describe('resolveDateTimeLocale', () => {
  // Measured here rather than through `printDateTime`, because the interesting case cannot
  // be shown through it: on a machine whose own default is English, asking for an unknown
  // language gives the English answer either way - right for the wrong reason.
  it('keeps a language this runtime knows', () => {
    expect(resolveDateTimeLocale('de')).toBe('de')
  })

  it('answers English for a WELL-FORMED tag it does not know, not the machine default', () => {
    // The one Intl does not throw on. Left to the constructor it would resolve to whatever
    // the server is set to, so a mail would be dated differently on every machine.
    expect(resolveDateTimeLocale('xx')).toBe('en')
    expect(resolveDateTimeLocale('xx-nonsense')).toBe('en')
  })

  it('answers English for a malformed tag, the one case Intl throws on', () => {
    expect(resolveDateTimeLocale('not a language tag')).toBe('en')
  })
})
