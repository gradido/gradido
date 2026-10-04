// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import i18n from '@/i18n'

/**
 * Texts of the redeem page (`gdd_per_link.*`) that had gone wrong in single languages. A
 * contribution link and a link from another community still open as that page.
 *
 * Three of the texts end in a date as the wallet writes one (`d(..., 'long')`), and that is
 * not the same thing everywhere: the Greek one ends in "π.μ." or "μ.μ.", so a full stop behind
 * it gave "π.μ.."; the Italian "il" before the day gave "il 8 settembre" and "il 11 settembre";
 * the Russian "в" before it gave "истек в 24 сентября". They are read here with real dates, in
 * all ten languages.
 *
 * ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class, and node turns an
 * instance of it away as coming from another realm.
 */
const languages = readdirSync(dirname(fileURLToPath(import.meta.url)))
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace('.json', ''))

// A morning, an afternoon, the first of a month, an eighth and an eleventh.
const DATES = [
  '2026-09-24T09:43:00.000Z',
  '2026-09-01T14:05:00.000Z',
  '2026-09-08T00:30:00.000Z',
  '2026-09-11T23:59:00.000Z',
]

const text = (lang, key, named = {}) =>
  i18n.global.t(`gdd_per_link.${key}`, named, { locale: lang })
const date = (lang, iso) => i18n.global.d(new Date(iso), 'long', lang)

describe('gdd_per_link in the language files', () => {
  it('reads all ten language files', () => {
    expect(languages).toHaveLength(10)
  })

  describe.each(['link-deleted', 'link-expired', 'redeemed-at'])('%s, with its date', (key) => {
    it.each(languages)('reads as a sentence that ends once, in %s', (lang) => {
      for (const iso of DATES) {
        const day = date(lang, iso)
        const sentence = text(lang, key, { date: day })

        expect(sentence).toContain(day)
        expect(sentence).not.toMatch(/\.\.|\{|\}/)
        expect(sentence).toMatch(/[.!]$/)
      }
    })
  })

  it.each(['link-deleted', 'link-expired', 'redeemed-at'])(
    'has no Italian "il" right before the day (%s): "il 8" and "il 11" are "l’8" and "l’11"',
    (key) => {
      for (const iso of DATES) {
        expect(text('it', key, { date: date('it', iso) })).not.toMatch(/\bil \d/)
      }
    },
  )

  it('has no Russian "в" before the day a link ran out', () => {
    for (const iso of DATES) {
      expect(text('ru', 'link-expired', { date: date('ru', iso) })).not.toMatch(/ в \d{1,2} [а-я]/)
    }
  })

  it('has no English word left in the French sentence about a deleted link', () => {
    expect(text('fr', 'link-deleted', { date: date('fr', DATES[0]) })).not.toMatch(/\bon\b/)
  })

  it('says in whole English that a member may not redeem their own link', () => {
    expect(text('en', 'no-redeem')).toBe('You are not allowed to redeem your own link!')
  })

  // The Spanish file speaks to "tú" throughout; this one said "usted".
  it('invites to register in the form the Spanish file speaks in', () => {
    expect(text('es', 'to-register')).toBe('Registra una nueva cuenta.')
  })

  /**
   * "Duplizieren" in the menu of a link (ZE-030): a new link is made of an old one.
   * ⛔ It is not "copy". The same menu has "copy link", which puts the address into the
   * clipboard -- so in every language this entry is another word than that one's.
   *
   * Spanish, Portuguese and Turkish name the link with it ("Duplicar enlace"): their word alone
   * is also the everyday one for doubling a sum, and the entry stands beside an amount.
   */
  describe('duplicate, in the menu of a link', () => {
    // What each language calls copying, as its "copy link" says it.
    const COPYING = {
      de: /kopi/i,
      en: /cop[yi]/i,
      es: /copi/i,
      fr: /copi/i,
      it: /copi/i,
      nl: /kopi/i,
      pt: /copi/i,
      ru: /копи/i,
      el: /αντ[ιί]γρ/i,
      tr: /kopya/i,
    }
    const words = (said) => said.toLocaleLowerCase().split(/\s+/).filter(Boolean)

    it('knows the word for copying of every language', () => {
      expect(Object.keys(COPYING).sort()).toEqual([...languages].sort())
    })

    it.each(languages)('is another word than the one of "copy link", in %s', (lang) => {
      const duplicate = text(lang, 'duplicate')
      const copy = text(lang, 'copy-link')

      // The fixture proves itself: this is what "copy link" says.
      expect(copy).toMatch(COPYING[lang])
      expect(duplicate).not.toMatch(COPYING[lang])
      // What the two may share is the link they are about, never the whole entry.
      expect(words(duplicate).filter((word) => words(copy).includes(word)).length).toBeLessThan(
        words(duplicate).length,
      )
    })

    it.each([
      ['es', 'Duplicar enlace'],
      ['pt', 'Duplicar link'],
      ['tr', 'Linki çoğalt'],
    ])('names the link where the word alone could mean doubling a sum, in %s', (lang, said) => {
      expect(text(lang, 'duplicate')).toBe(said)
    })

    // An entry of a menu: a word or two, no sentence.
    it.each(languages)('is an entry of a menu, in %s', (lang) => {
      const duplicate = text(lang, 'duplicate')

      expect(duplicate).not.toBe('gdd_per_link.duplicate')
      expect(duplicate).not.toMatch(/[{}|.!?]/)
      expect(words(duplicate).length).toBeLessThanOrEqual(2)
    })

    it.each(languages.filter((lang) => lang !== 'en'))(
      'is said in the language itself, not in English, in %s',
      (lang) => {
        expect(text(lang, 'duplicate')).not.toBe(text('en', 'duplicate'))
      },
    )

    it('is "Duplizieren" in German', () => {
      expect(text('de', 'duplicate')).toBe('Duplizieren')
    })
  })
})
