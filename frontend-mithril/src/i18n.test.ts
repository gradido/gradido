// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it } from 'bun:test'
import { d, LANGUAGES, locale, n, setLocale, t } from './i18n'

afterEach(async () => {
  await setLocale('en')
})

describe('setLocale', () => {
  it('shows the language named, and of what the browser names its language', async () => {
    await setLocale('de')
    expect(locale).toBe('de')
    expect(t('settings.language.success')).toBe('Deine Sprache wurde erfolgreich geändert.')
    await setLocale('ru-RU')
    expect(locale).toBe('ru')
  })

  it('is English for a language the wallet does not speak', async () => {
    await setLocale('de')
    await setLocale('xx')
    expect(locale).toBe('en')
    expect(t('settings.language.success')).toBe('Your language has been successfully updated.')
  })

  it('is English for a name every object has, which is no language', async () => {
    await setLocale('de')
    await setLocale('constructor')
    expect(locale).toBe('en')
    await setLocale('toString-DE')
    expect(locale).toBe('en')
  })

  it('shows the language asked for last, also where an earlier one arrives after it', async () => {
    const { fetch } = LANGUAGES.de
    const german = Promise.withResolvers<Awaited<ReturnType<typeof fetch>>>()
    LANGUAGES.de.fetch = () => german.promise
    const slow = setLocale('de')
    expect(await setLocale('fr')).toBe(true)
    german.resolve(await fetch())
    // and says so: the caller keeps nothing of the earlier one
    expect(await slow).toBe(false)
    LANGUAGES.de.fetch = fetch
    expect(locale).toBe('fr')
    expect(t('settings.language.success')).not.toBe('Deine Sprache wurde erfolgreich geändert.')
  })

  it('is English where the texts cannot be fetched', async () => {
    const { fetch } = LANGUAGES.de
    LANGUAGES.de.fetch = () => Promise.reject(new Error('no network'))
    await setLocale('de')
    LANGUAGES.de.fetch = fetch
    expect(locale).toBe('en')
  })
})

describe('t', () => {
  it('fills the placeholders, and leaves one without a value as it is written', async () => {
    await setLocale('de')
    expect(t('chatGroup.leaveTitle', { name: 'Garten' })).toBe('Garten verlassen?')
    expect(t('chatGroup.leaveTitle')).toBe('{name} verlassen?')
  })

  it('gives the key where no language has the text', () => {
    expect(t('no.such.key')).toBe('no.such.key')
    // a branch of the texts is no text
    expect(t('chatGroup')).toBe('chatGroup')
  })

  it('takes the form for the count, which fills {n}', async () => {
    await setLocale('de')
    expect(t('chatGroup.memberCount', {}, 1)).toBe('1 Mitglied')
    expect(t('chatGroup.memberCount', {}, 0)).toBe('0 Mitglieder')
    expect(t('chatGroup.memberCount', {}, 2)).toBe('2 Mitglieder')
  })

  it('takes the form for one where no count is named', () => {
    expect(t('link-load')).toBe('Load the last link')
  })

  // tr: "Son linki yükle| Son {n} linki yükle"
  it('parts the forms at the bar, with or without a blank beside it', async () => {
    await setLocale('tr')
    expect(t('link-load', {}, 3)).toBe('Son 3 linki yükle')
    expect(t('link-load', {}, 1)).toBe('Son linki yükle')
  })

  it('gives the one form of a text that has no others, whatever the count', async () => {
    await setLocale('tr')
    expect(t('chatThread.unreadBadge', {}, 5)).toBe('5 sohbette yeni mesaj var')
  })

  // one (1, 21), few (2-4, 22-24), many (0, 5-20)
  it('takes the Russian form by the three classes of numbers', async () => {
    await setLocale('ru')
    expect(t('chatGroup.memberCount', {}, 21)).toBe('21 участник')
    expect(t('chatGroup.memberCount', {}, 3)).toBe('3 участника')
    expect(t('chatGroup.memberCount', {}, 11)).toBe('11 участников')
  })
})

describe('d and n', () => {
  it('write a date in the language shown', async () => {
    await setLocale('de')
    const date = new Date(2026, 10, 9, 14, 5)
    expect(d(date, 'short')).toBe('9.11.2026')
    expect(d(date, 'long')).toBe('9. November 2026 um 14:05')
    expect(d(date, 'monthAndYear')).toBe('November 2026')
    expect(d(date, 'time')).toBe('14:05')
  })

  it('write a number in the language shown, with two places where asked', async () => {
    await setLocale('de')
    expect(n(1234)).toBe('1.234')
    expect(n(1234.5, 'decimal')).toBe('1.234,50')
    expect(n(1234.5, 'ungroupedDecimal')).toBe('1234,50')
  })
})
