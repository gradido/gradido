// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import i18n from '@/i18n'

/**
 * The number beside the tick under the search field (MatchingMap): how many people carry the
 * sentence of the chosen entry. The page writes it as `t(key, { n: n(count) }, count)` -- the
 * number grouped the way the language groups its thousands, the form chosen by the count. A
 * formatted number is a text, so only the count can choose the form: rendered here through the
 * wallet's own i18n and its own plural rules, a four-digit number among them, because that is the
 * only place the forms can be seen to fit.
 */
const people = (locale, count) =>
  i18n.global.t(
    'matching.query.exactPeople',
    { n: i18n.global.n(count, { locale }) },
    { plural: count, locale },
  )
const grouped = (locale, count) => new Intl.NumberFormat(locale).format(count)

const LANGUAGES = ['de', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'ru', 'tr', 'el']

describe('the number beside the tick at the map', () => {
  it('groups the thousands of a four-digit number in German', () => {
    expect(people('de', 1500)).toBe('1.500 Menschen')
    expect(people('de', 1)).toBe('1 Mensch')
    expect(people('de', 0)).toBe('0 Menschen')
  })

  it.each([
    ['en', 0, 'people'],
    ['en', 1, 'person'],
    ['en', 1500, 'people'],
    ['es', 0, 'personas'],
    ['es', 1, 'persona'],
    ['es', 1500, 'personas'],
    // French counts nothing the way it counts one: three forms, read [none | one | more].
    ['fr', 0, 'personne'],
    ['fr', 1, 'personne'],
    ['fr', 2, 'personnes'],
    ['fr', 1500, 'personnes'],
    ['it', 0, 'persone'],
    ['it', 1, 'persona'],
    ['it', 1500, 'persone'],
    ['nl', 0, 'mensen'],
    // Dutch counts one as a person and more as people, as English does.
    ['nl', 1, 'persoon'],
    ['nl', 1500, 'mensen'],
    ['pt', 0, 'pessoas'],
    ['pt', 1, 'pessoa'],
    ['pt', 1500, 'pessoas'],
    // Turkish does not decline after a number.
    ['tr', 1, 'kişi'],
    ['tr', 1500, 'kişi'],
    ['el', 0, 'άτομα'],
    ['el', 1, 'άτομο'],
    ['el', 1500, 'άτομα'],
  ])('says in %s for %i: %s', (locale, count, word) => {
    expect(people(locale, count)).toBe(`${grouped(locale, count)} ${word}`)
  })

  // Russian counts in three classes, by the wallet's own rule (utils/pluralRules.js).
  it.each([
    [0, 'человек'],
    [1, 'человек'],
    [2, 'человека'],
    [4, 'человека'],
    [5, 'человек'],
    [11, 'человек'],
    [21, 'человек'],
    [22, 'человека'],
    [1500, 'человек'],
  ])('declines %i people in Russian', (count, word) => {
    expect(people('ru', count)).toBe(`${grouped('ru', count)} ${word}`)
  })

  // The line under the map, "n Menschen gefunden": the same number grouped the same way, and in
  // the singular for one where the number stands in front of the word.
  describe('the line under the map', () => {
    const found = (locale, count) =>
      i18n.global.t(
        'matching.map.found',
        { n: i18n.global.n(count, { locale }) },
        { plural: count, locale },
      )

    it.each([
      ['de', 0, '0 Menschen gefunden'],
      ['de', 1, '1 Mensch gefunden'],
      ['de', 1500, '1.500 Menschen gefunden'],
      ['en', 1, '1 person found'],
      ['en', 2, '2 people found'],
    ])('says in %s for %i: %s', (locale, count, said) => {
      expect(found(locale, count)).toBe(said)
    })

    it.each(LANGUAGES)('shows the grouped number in %s, and no form separator', (locale) => {
      const said = found(locale, 1500)
      expect(said).toContain(grouped(locale, 1500))
      expect(said).not.toMatch(/[|{}]/)
    })
  })

  // Rendered, not reasoned about: a form separator or a placeholder left open shows here.
  describe.each(LANGUAGES)('in %s', (locale) => {
    it('leaves neither a form separator nor a placeholder open, and starts with the number', () => {
      for (const count of [0, 1, 2, 5, 21, 1500]) {
        const said = people(locale, count)
        expect(said).not.toMatch(/[|{}]/)
        expect(said.startsWith(grouped(locale, count))).toBe(true)
      }
    })

    // In its own words, not through the English fallback.
    it('names the row in its own words', () => {
      const named = i18n.global.t('matching.query.exact', {}, { locale })
      expect(named).not.toBe('matching.query.exact')
      expect(named).not.toMatch(/[|{}]/)
      if (locale !== 'en') {
        expect(named).not.toBe(i18n.global.t('matching.query.exact', {}, { locale: 'en' }))
        expect(people(locale, 2).replace(grouped(locale, 2), '')).not.toBe(' people')
      }
    })
  })
})
