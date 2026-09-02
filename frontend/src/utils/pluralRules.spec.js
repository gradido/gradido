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

  it('leaves the two-form keys as they were', () => {
    expect(t('settings.username.quota-left', 1)).toContain('ещё один раз')
    expect(t('settings.username.quota-left', 3)).toContain('ещё 3 раз')
  })

  it('does not touch German', () => {
    expect(i18n.global.t('contacts.bookings', 1, { locale: 'de' })).toBe('1 Buchung')
    expect(i18n.global.t('contacts.bookings', 0, { locale: 'de' })).toBe('0 Buchungen')
  })
})
