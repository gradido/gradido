// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/**
 * The words of "Bild dazu" (`send-picture.*`, ZE-016), in all ten languages.
 *
 * - Every language has its own words: a key that fell back to English would still be shown.
 * - The labels are short enough for their places -- a field's label, two links beside a small
 *   picture --, and the sentence for another community is one sentence.
 * - ⛔ None speaks of paying (E-018): a transfer is a gift, and a picture goes with a gift.
 * - German says "Du" with a capital; Russian stays with "вы".
 *
 * ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class, and node turns an
 * instance of it away as coming from another realm.
 */
const here = dirname(fileURLToPath(import.meta.url))
const languages = readdirSync(here)
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace('.json', ''))
const wordsIn = (lang) =>
  JSON.parse(readFileSync(join(here, `${lang}.json`), 'utf8'))['send-picture'] ?? {}

const KEYS = ['home-only', 'label', 'none', 'other', 'remove']
const LABELS = ['label', 'none', 'other', 'remove']

describe('the words of "Bild dazu"', () => {
  it('are read from ten languages', () => {
    expect(languages).toHaveLength(10)
  })

  it.each(languages)('%s has exactly these words, none empty', (lang) => {
    const words = wordsIn(lang)

    expect(Object.keys(words).sort()).toEqual(KEYS)
    for (const key of KEYS) expect(words[key].trim()).not.toBe('')
  })

  it.each(languages.filter((lang) => lang !== 'en'))('%s says them in its own words', (lang) => {
    const english = wordsIn('en')
    const words = wordsIn(lang)

    for (const key of KEYS) expect(words[key]).not.toBe(english[key])
  })

  it.each(languages)('%s keeps the labels short and on one line', (lang) => {
    const words = wordsIn(lang)

    for (const key of LABELS) {
      expect(words[key]).not.toMatch(/\n/)
      expect(words[key].length).toBeLessThanOrEqual(24)
      // A label, not a sentence.
      expect(words[key]).not.toMatch(/[.!?]$/)
    }
  })

  it.each(languages)('%s says of another community one sentence', (lang) => {
    const sentence = wordsIn(lang)['home-only']

    expect(sentence).toMatch(/[.]$/)
    expect(sentence.slice(0, -1)).not.toMatch(/[.!?]/)
    expect(sentence.length).toBeLessThanOrEqual(110)
  })

  // E-018: no word of paying, in any of the languages the wallet has.
  it.each(languages)('%s speaks of no payment', (lang) => {
    const all = Object.values(wordsIn(lang)).join(' ').toLowerCase()

    for (const word of [
      'zahlung',
      'bezahl',
      'payment',
      'pay ',
      'pago',
      'paiement',
      'pagamento',
      'betaling',
      'betal',
      'плат',
      'оплат',
      'πληρωμ',
      'ödeme',
    ]) {
      expect(all).not.toContain(word)
    }
  })

  it('German says "Du" with a capital', () => {
    const sentence = wordsIn('de')['home-only']

    expect(sentence).toBe(
      'Ein Bild kannst Du vorerst nur Mitgliedern Deiner Gemeinschaft mitschicken.',
    )
    expect(sentence).not.toMatch(/\b(du|dein|deiner|dir|dich)\b/)
  })

  it('Russian stays with the polite form', () => {
    const sentence = wordsIn('ru')['home-only']

    expect(sentence).toMatch(/вашего/)
    expect(sentence).not.toMatch(/(^|[^а-яё])(ты|твоего|твоей|тебе)([^а-яё]|$)/i)
  })

  it('the German labels are the ones of the canvas', () => {
    expect(wordsIn('de')).toMatchObject({
      label: 'Bild dazu',
      other: 'Anderes Bild',
      remove: 'Entfernen',
      none: 'Ohne Bild',
    })
  })
})
