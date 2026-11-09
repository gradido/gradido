// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, setSystemTime } from 'bun:test'
import { distanceToNow, n, setLocale, t } from './i18n'

afterEach(() => {
  setLocale('en')
  setSystemTime()
})

describe('t', () => {
  it('gives the message of the current language, with its placeholders filled', () => {
    setLocale('de')
    expect(t('contributionLink.deleteNow', { name: 'Welcome' })).toBe(
      "Automatische Creations 'Welcome' wirklich löschen?",
    )
  })

  it('stays English for a language the admin has no messages for', () => {
    setLocale('xx')
    expect(t('success')).toBe('Success')
  })

  it('gives the key where no language has the message', () => {
    expect(t('no.such.key')).toBe('no.such.key')
  })

  it('takes the plural form for a count, as vue-i18n did', () => {
    setLocale('de')
    expect(t('dashboard.waitingForMember', { n: 1 }, 1)).toBe('1 wartet auf das Mitglied')
    expect(t('dashboard.waitingForMember', { n: 0 }, 0)).toBe('0 warten auf das Mitglied')
    expect(t('dashboard.waitingForMember', { n: 2 }, 2)).toBe('2 warten auf das Mitglied')
  })

  it('leaves a placeholder without a value as it is', () => {
    expect(t('contributionLink.deleteNow')).toContain('{name}')
  })
})

describe('distanceToNow', () => {
  it('words the distance in the current language', () => {
    setSystemTime(new Date('2026-11-09T12:00:00Z'))
    setLocale('de')
    expect(distanceToNow(new Date('2026-11-07T12:00:00Z'))).toBe('vor 2 Tagen')
  })

  it('words it in English for a language date-fns is not given', () => {
    setSystemTime(new Date('2026-11-09T12:00:00Z'))
    setLocale('it')
    expect(distanceToNow(new Date('2026-11-07T12:00:00Z'))).toBe('2 days ago')
  })
})

describe('n', () => {
  it('writes a number in the current language, as decimal with two places', () => {
    setLocale('de')
    expect(n(1234)).toBe('1.234')
    expect(n(1234.5, 'decimal')).toBe('1.234,50')
  })
})
