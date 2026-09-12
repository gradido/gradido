// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import i18n from '@/i18n'
import { slavicPlural } from './pluralRules'

describe('slavicPlural', () => {
  it('picks one, few and many for a three-form message', () => {
    const forms = [1, 2, 3, 4, 5, 11, 12, 14, 15, 20, 21, 22, 25, 100, 101, 111, 0].map((n) =>
      slavicPlural(n, 3),
    )
    expect(forms).toEqual([0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 0, 1, 2, 2, 0, 2, 2])
  })

  it('keeps the default reading for a two-form message', () => {
    expect([0, 1, 2, 5].map((n) => slavicPlural(n, 2))).toEqual([1, 0, 1, 1])
  })

  // vue-i18n hands -1 to the rule when a message with forms is translated without a count.
  // Its own rule takes the absolute value first and lands on the singular; so does this one.
  it('reads a message asked for without a count as the singular, like the default', () => {
    expect(slavicPlural(-1, 2)).toBe(0)
    expect(slavicPlural(-1, 3)).toBe(0)
  })
})

describe('the Russian keys through the real i18n instance', () => {
  const t = (key, n) => i18n.global.t(key, n, { locale: 'ru' })

  it('declines the contact counts', () => {
    expect(t('contacts.bookings', 1)).toBe('1 операция')
    expect(t('contacts.bookings', 2)).toBe('2 операции')
    expect(t('contacts.bookings', 5)).toBe('5 операций')
    expect(t('contacts.bookings', 0)).toBe('0 операций')
    expect(t('contacts.count', 21)).toBe('21 контакт')
    expect(t('contacts.count', 11)).toBe('11 контактов')
  })

  /**
   * ⛔ The rule reaches EVERY Russian message with forms, not only the ones it was written
   * for. This key existed before it, with three forms in the same order -- and its caller
   * (CollapseLinksList) asks for the singular by the count, which is what this pins.
   */
  it('reads the link-load key that was here before it', () => {
    expect(t('link-load', 1)).toBe('перезагрузить последнюю ссылку')
    expect(t('link-load', { n: 3 })).toBe('перезагрузить последние 3 ссылки')
  })

  // Two forms, so the default reading: 1 is the first, everything else the second. Which
  // form is chosen is what this asserts -- the wording of the second one is a question for
  // the locale files (Russian wants a different case for 2-4), not for the rule.
  it('leaves the two-form keys as they were', () => {
    expect(t('settings.username.quota-left', 1)).toContain('ещё один раз')
    expect(t('settings.username.quota-left', 3)).toContain('ещё 3')
  })

  /**
   * The mark over a narrowed booking list carries a count since 12.09.2026, so this key has
   * forms now -- three of them in Russian, which means it goes through the rule above. The
   * name travels with it, so the call passes named values AND the count: `t(key, {n, name}, n)`.
   */
  it('declines the mark over a list narrowed to one member', () => {
    // ⚠️ `{ plural, locale }` as options -- measured: a FOURTH positional argument is
    // swallowed, the message comes back in the default language and the test would pin
    // English while claiming Russian.
    const mark = (n) =>
      i18n.global.t('transaction.onlyWith', { n, name: 'Margret' }, { plural: n, locale: 'ru' })
    expect(mark(1)).toBe('1 операция с Margret')
    expect(mark(3)).toBe('3 операции с Margret')
    expect(mark(117)).toBe('117 операций с Margret')
  })

  it('does not touch German', () => {
    expect(i18n.global.t('contacts.bookings', 1, { locale: 'de' })).toBe('1 Buchung')
    expect(i18n.global.t('contacts.bookings', 0, { locale: 'de' })).toBe('0 Buchungen')
    // And the count the link button now passes reads as the singular here too.
    expect(i18n.global.t('link-load', 1, { locale: 'de' })).toBe('den letzten Link nachladen')
    // The mark over a narrowed list, in the language Bernd reads it in.
    const mark = (n, locale) =>
      i18n.global.t('transaction.onlyWith', { n, name: 'Margret' }, { plural: n, locale })
    expect(mark(117, 'de')).toBe('117 Buchungen mit Margret')
    expect(mark(1, 'de')).toBe('1 Buchung mit Margret')
    expect(mark(117, 'en')).toBe('117 bookings with Margret')
    expect(mark(1, 'en')).toBe('1 booking with Margret')
    // Turkish counts without a plural ending and puts the name first -- both forms alike.
    expect(mark(117, 'tr')).toBe('Margret ile 117 işlem')
  })
})
