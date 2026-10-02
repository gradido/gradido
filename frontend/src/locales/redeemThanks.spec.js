// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import i18n from '@/i18n'

/**
 * The words of the thank-you a redeem link opens as (`redeem-thanks.*`), in all ten languages.
 * Rendered with the wallet's own vue-i18n and its own date formats: the source is what the
 * translations are, the rendering is what arrives.
 *
 * - The sentence on the sheet is the first line of the share text, without its colon: whoever
 *   taps the link reads the sentence they were sent. Held against that line in every language.
 * - Two sentences take a date as the wallet writes one (`d(..., 'long')`), and that is not the
 *   same thing everywhere: the Greek one ends in "π.μ.", the Dutch one starts with the weekday.
 *   A full stop right after the date gave "π.μ.." -- so each is read with real dates.
 * - Nothing here speaks of redeeming or paying (E-018): it is a thank-you that is accepted.
 *   And what is said after accepting is where the Gradido are now -- not the old page's
 *   sentence about an account being credited, which eight files had kept at first.
 * - The days a thank-you waited are a number, and Russian has three forms for it.
 *
 * ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class, and node turns an
 * instance of it away as coming from another realm.
 */
const here = dirname(fileURLToPath(import.meta.url))
const languages = readdirSync(here)
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace('.json', ''))
const thanksIn = (lang) =>
  JSON.parse(readFileSync(join(here, `${lang}.json`), 'utf8'))['redeem-thanks'] ?? {}

const KEYS = [
  'accept',
  'accepted-text',
  'accepted-title',
  'accepted-toast',
  'deleted-text',
  'deleted-title',
  'expired-text',
  'expired-title',
  'from',
  'have-account',
  'how',
  'invite',
  'other-community',
  'own-links',
  'own-text',
  'own-title',
  'title',
  'to-account',
  'where-account',
]

// A morning, an afternoon, the first of a month, an eighth and an eleventh: where a language
// writes the time with "a.m.", or would need another article before some numbers.
const DATES = [
  '2026-09-24T09:43:00.000Z',
  '2026-09-01T14:05:00.000Z',
  '2026-09-08T00:30:00.000Z',
  '2026-09-11T23:59:00.000Z',
]

// What each language calls redeeming and paying. None of it belongs to a thank-you.
const NOT_A_THANK_YOU = {
  de: /einl[öo]s|zahl/i,
  en: /redeem|pay/i,
  es: /canje|pago|pagar/i,
  fr: /encaiss|per[çc]u|percev|paiement|payer/i,
  it: /riscatt|pagament|pagare/i,
  nl: /inwissel|betal/i,
  pt: /resgat|pagament|pagar/i,
  ru: /активир|оплат|платеж|платёж/i,
  el: /εξαργ[υύ]ρ|πληρωμ/i,
  tr: /kullan|ödeme/i,
}

// With `count` as the view hands it on: the form to choose, where a language has several.
const render = (lang, key, named = {}, count) =>
  i18n.global.t(
    `redeem-thanks.${key}`,
    named,
    count === undefined ? { locale: lang } : { locale: lang, plural: count },
  )
const date = (lang, iso) => i18n.global.d(new Date(iso), 'long', lang)

describe('redeem-thanks in the language files', () => {
  it('reads all ten language files', () => {
    expect(languages).toHaveLength(10)
    expect(languages).toEqual(expect.arrayContaining(Object.keys(NOT_A_THANK_YOU)))
  })

  it.each(languages)('has every text and no other, in %s', (lang) => {
    expect(Object.keys(thanksIn(lang)).sort()).toEqual(KEYS)
  })

  it.each(languages.filter((lang) => lang !== 'en'))(
    'says every text in its own words, not in the English ones, in %s',
    (lang) => {
      const english = thanksIn('en')
      const same = KEYS.filter((key) => thanksIn(lang)[key] === english[key])
      expect(same).toEqual([])
    },
  )

  it.each(languages)('writes the sentence on the sheet as the share text has it, in %s', (lang) => {
    const shared = i18n.global.t(
      'gdd_per_link.share-line1',
      { name: 'Oma-Emma', amount: '20' },
      { locale: lang },
    )
    const unit = i18n.global.t('GDD-long', {}, { locale: lang })

    // The share text ends in a colon, the words follow it there; the French one has a space
    // before it.
    expect(shared).toMatch(/:$/)
    expect(render(lang, 'from', { name: 'Oma-Emma', amount: `20 ${unit}` })).toBe(
      shared.replace(/\s*:$/, ''),
    )
  })

  it.each(languages)('writes the day a thank-you was accepted as a sentence, in %s', (lang) => {
    for (const iso of DATES) {
      const day = date(lang, iso)
      const sentence = render(lang, 'accepted-text', { date: day })

      expect(sentence).toContain(day)
      expect(sentence).not.toMatch(/\.\.|\{|\}/)
      expect(sentence).toMatch(/[.!]$/)
    }
  })

  it.each(languages)('writes who deleted a link and when as one sentence, in %s', (lang) => {
    for (const iso of DATES) {
      const day = date(lang, iso)
      const sentence = render(lang, 'deleted-text', { name: 'Oma-Emma', date: day })

      expect(sentence).toContain(day)
      expect(sentence).toContain('Oma-Emma')
      expect(sentence).not.toMatch(/\.\.|\{|\}/)
      expect(sentence).toMatch(/[.!]$/)
    }
  })

  it.each(languages)('names the sender and the amount where they belong, in %s', (lang) => {
    expect(render(lang, 'expired-text', { name: 'Oma-Emma' })).toContain('Oma-Emma')
    expect(render(lang, 'accepted-toast', { n: '20' })).toContain('20 GDD')
  })

  // A server may keep its links open for any number of days.
  it.each(languages)('writes the days a thank-you waited as one sentence, in %s', (lang) => {
    for (const days of [2, 3, 5, 7, 14, 21, 30]) {
      const sentence = render(lang, 'expired-title', { days }, days)

      expect(sentence).toContain(String(days))
      expect(sentence).not.toMatch(/\||\{|\}/)
      expect(sentence).toMatch(/\.$/)
    }
  })

  it('writes the days in the form Russian has for each number', () => {
    const waited = (days) => render('ru', 'expired-title', { days }, days)

    expect([1, 21, 31, 101].map(waited)).toEqual(
      [1, 21, 31, 101].map((days) => `Эта благодарность ждала ${days} день.`),
    )
    expect([2, 3, 4, 22, 24].map(waited)).toEqual(
      [2, 3, 4, 22, 24].map((days) => `Эта благодарность ждала ${days} дня.`),
    )
    expect([5, 7, 11, 12, 14, 20, 25, 30].map(waited)).toEqual(
      [5, 7, 11, 12, 14, 20, 25, 30].map((days) => `Эта благодарность ждала ${days} дней.`),
    )
  })

  // The old page said after redeeming that an account "has been credited". The first
  // sentence went, and the second one stayed in eight files: what is left of it here is its
  // number and unit, nothing else.
  it.each(languages)('says after accepting where the Gradido are now, in %s', (lang) => {
    const old = JSON.parse(readFileSync(join(here, `${lang}.json`), 'utf8')).gdd_per_link.redeemed
    const [, credited] = old.match(/^[^!]+!\s*(.+)$/)

    expect(credited).toContain('{n} GDD')
    expect(thanksIn(lang)['accepted-toast']).not.toContain(credited)
  })

  it.each(languages)('speaks of a thank-you, not of redeeming or paying, in %s', (lang) => {
    for (const key of KEYS) {
      expect(`${key}: ${thanksIn(lang)[key]}`).not.toMatch(NOT_A_THANK_YOU[lang])
    }
  })

  // What the old page said about the same link, to prove the patterns above can find something:
  // a list that matches nothing would hold every text.
  it.each(languages)('would find the old words of the redeem page, in %s', (lang) => {
    const old = JSON.parse(readFileSync(join(here, `${lang}.json`), 'utf8')).gdd_per_link
    expect([old.redeemed, old['no-redeem'], old['redeemed-at']].join(' ')).toMatch(
      NOT_A_THANK_YOU[lang],
    )
  })
})
