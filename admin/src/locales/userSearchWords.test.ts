// AI-GENERATED — not an architecture reference
import { afterAll, describe, expect, it } from 'bun:test'
import { setLocale, t } from '@/i18n'

/**
 * The line above the list of the member search says how many it holds, with the real i18n: the
 * page hands it the number twice, once written for the language and once to choose the form by
 * (pages/UserSearch.ts). The admin has no plural rule of its own, so Russian says it without a form
 * for each number, and a form written for it would be wrong at 2 to 4.
 */
const LANGUAGES = ['de', 'en', 'es', 'fr', 'nl', 'pt', 'it', 'tr', 'ru', 'el']
const hits = async (lang: string, n: number) => {
  await setLocale(lang)
  return t('userSearch.hits', { count: n.toLocaleString(lang) }, n)
}

afterAll(() => setLocale('en'))

describe('the number of hits of the member search', () => {
  it.each(LANGUAGES)('%s writes the number and no form of another', async (lang) => {
    for (const n of [0, 1, 2, 5, 21, 6116]) {
      expect(await hits(lang, n)).toContain(n.toLocaleString(lang))
      expect(await hits(lang, n)).not.toContain('|')
    }
  })

  it.each([
    ['de', '1 Treffer', '2 Treffer'],
    ['en', '1 match', '2 matches'],
    ['es', '1 resultado', '2 resultados'],
    ['fr', '1 résultat', '2 résultats'],
    ['nl', '1 resultaat', '2 resultaten'],
    ['pt', '1 resultado', '2 resultados'],
    ['it', '1 risultato', '2 risultati'],
    ['tr', '1 sonuç', '2 sonuç'],
    ['ru', 'Найдено: 1', 'Найдено: 2'],
    ['el', '1 αποτέλεσμα', '2 αποτελέσματα'],
  ])('%s says one and two as the language does', async (lang, one, two) => {
    expect(await hits(lang, 1)).toBe(one)
    expect(await hits(lang, 2)).toBe(two)
  })

  it('takes the form from the number, also where it is written with separators', async () => {
    expect(await hits('en', 6116)).toBe('6,116 matches')
    expect(await hits('de', 6116)).toBe('6.116 Treffer')
  })

  it('French counts nothing in the singular', async () => {
    expect(await hits('fr', 0)).toBe('0 résultat')
  })

  it('every language has four tabs of its own', async () => {
    for (const lang of LANGUAGES) {
      const { userSearch } = (await import(`./${lang}.json`)).default
      expect(new Set(Object.values(userSearch.tabs)).size).toBe(4)
    }
  })
})
