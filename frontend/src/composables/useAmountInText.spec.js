// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import i18n from '@/i18n'
import { useAmountInText } from './useAmountInText'

// With the wallet's own vue-i18n and its number formats: what stands in the sentence is the
// product, and a stand-in for `n` would hand back whatever it was given.
const amountIn = (locale) => {
  i18n.global.locale.value = locale
  let amountInText
  mount(
    {
      setup() {
        amountInText = useAmountInText()
        return () => null
      },
    },
    { global: { plugins: [i18n] } },
  )
  return amountInText
}

const LANGUAGES = ['de', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'ru', 'el', 'tr']

describe('useAmountInText', () => {
  it('writes a whole amount without decimals', () => {
    expect(amountIn('de')('20')).toBe('20')
    expect(amountIn('en')('20')).toBe('20')
  })

  it('writes the decimal mark of the language', () => {
    expect(amountIn('de')('12.5')).toBe('12,5')
    expect(amountIn('en')('12.5')).toBe('12.5')
  })

  it('writes the decimals that were typed, and no zero behind them', () => {
    expect(amountIn('de')('12.25')).toBe('12,25')
    expect(amountIn('de')('12.50')).toBe('12,5')
    expect(amountIn('de')('20.00')).toBe('20')
  })

  it('reads a number as it reads the text the server sends', () => {
    expect(amountIn('de')(12.5)).toBe(amountIn('de')('12.5'))
  })

  // "1.000 Gradido" would read as one Gradido to somebody used to the other mark.
  it.each(LANGUAGES)('groups nothing, in %s', (locale) => {
    expect(amountIn(locale)('1000')).toBe('1000')
    expect(amountIn(locale)('100000')).toBe('100000')
  })

  it.each(LANGUAGES)('has a format to write with, in %s', (locale) => {
    expect(amountIn(locale)('12.5')).toBe(locale === 'en' ? '12.5' : '12,5')
  })
})
