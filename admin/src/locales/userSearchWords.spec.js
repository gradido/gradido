// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'

/**
 * The line above the list of the member search says how many it holds, with the real i18n: the
 * page hands it the number twice, once written for the language and once to choose the form by
 * (UserSearch.tsx). The admin has no plural rule of its own, so Russian says it without a form
 * for each number, and a form written for it would be wrong at 2 to 4.
 */
const here = dirname(fileURLToPath(import.meta.url))
const LANGUAGES = ['de', 'en', 'es', 'fr', 'nl', 'pt', 'it', 'tr', 'ru', 'el']
const messages = Object.fromEntries(
  LANGUAGES.map((lang) => [lang, JSON.parse(readFileSync(join(here, `${lang}.json`), 'utf8'))]),
)
const { t } = createI18n({ legacy: false, locale: 'en', messages }).global
// With a language of its own the form goes into the options; a fourth argument would be dropped,
// and the words come in the default language.
const hits = (lang, n) =>
  t('userSearch.hits', { count: n.toLocaleString(lang) }, { plural: n, locale: lang })

describe('the number of hits of the member search', () => {
  it.each(LANGUAGES)('%s writes the number and no form of another', (lang) => {
    for (const n of [0, 1, 2, 5, 21, 6116]) {
      expect(hits(lang, n)).toContain(n.toLocaleString(lang))
      expect(hits(lang, n)).not.toContain('|')
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
  ])('%s says one and two as the language does', (lang, one, two) => {
    expect(hits(lang, 1)).toBe(one)
    expect(hits(lang, 2)).toBe(two)
  })

  it('takes the form from the number, also where it is written with separators', () => {
    expect(hits('en', 6116)).toBe('6,116 matches')
    expect(hits('de', 6116)).toBe('6.116 Treffer')
  })

  it('French counts nothing in the singular', () => {
    expect(hits('fr', 0)).toBe('0 résultat')
  })

  it('every language has four tabs of its own', () => {
    for (const lang of LANGUAGES) {
      const tabs = messages[lang].userSearch.tabs
      expect(new Set(Object.values(tabs)).size, lang).toBe(4)
    }
  })
})
