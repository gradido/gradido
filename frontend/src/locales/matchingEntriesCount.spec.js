// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import i18n from '@/i18n'

/**
 * The line above a member's matching entries counts three things: the entries, the live
 * ones among them, the paused ones. It was one message per language, with one word after
 * each number, and printed "1 Einträge · 1 live · 0 pausiert" for a single entry -- and
 * "3 entradas · 1 activas" in the languages that decline the second word too.
 *
 * One message can follow one number only. So each part is a message of its own
 * (`countTotal`, `countLive`, `countPaused`) and `count` is the line they stand in. The page
 * puts them together exactly as `line` does here; rendered through the wallet's own i18n,
 * with its own plural rules, because that is the only place the forms can be seen to fit.
 */
const part = (locale, key, n) => i18n.global.t(`matching.entries.${key}`, n, { locale })
const line = (locale, total, live) =>
  i18n.global.t(
    'matching.entries.count',
    {
      total: part(locale, 'countTotal', total),
      live: part(locale, 'countLive', live),
      paused: part(locale, 'countPaused', total - live),
    },
    { locale },
  )

const LANGUAGES = ['de', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'ru', 'tr', 'el']

describe('the line that counts the matching entries', () => {
  // The slip this is about, in the language most members read.
  it('counts one entry as one, in German', () => {
    expect(line('de', 1, 1)).toBe('1 Eintrag · 1 live · 0 pausiert')
    expect(line('de', 0, 0)).toBe('0 Einträge · 0 live · 0 pausiert')
    expect(line('de', 2, 1)).toBe('2 Einträge · 1 live · 1 pausiert')
  })

  it.each([
    ['en', 1, 1, '1 entry · 1 live · 0 paused'],
    ['en', 3, 2, '3 entries · 2 live · 1 paused'],
    ['nl', 1, 0, '1 vermelding · 0 live · 1 gepauzeerd'],
    ['nl', 4, 4, '4 vermeldingen · 4 live · 0 gepauzeerd'],
    // The live ones follow THEIR number, not the number of entries.
    ['es', 3, 1, '3 entradas · 1 activa · 2 en pausa'],
    ['es', 1, 0, '1 entrada · 0 activas · 1 en pausa'],
    ['it', 3, 1, '3 voci · 1 attiva · 2 in pausa'],
    ['it', 1, 1, '1 voce · 1 attiva · 0 in pausa'],
    ['pt', 2, 1, '2 entradas · 1 ativa · 1 em pausa'],
    ['pt', 1, 0, '1 entrada · 0 ativas · 1 em pausa'],
    ['el', 1, 1, '1 καταχώριση · 1 ενεργή · 0 σε παύση'],
    ['el', 3, 2, '3 καταχωρίσεις · 2 ενεργές · 1 σε παύση'],
    // Turkish does not decline after a number.
    ['tr', 1, 1, '1 giriş · 1 aktif · 0 duraklatıldı'],
    ['tr', 5, 3, '5 giriş · 3 aktif · 2 duraklatıldı'],
  ])('says in %s for %i entries, %i of them live: %s', (locale, total, live, said) => {
    expect(line(locale, total, live)).toBe(said)
  })

  // French counts nothing the way it counts one: three forms, read [none | one | more].
  it('counts none like one in French', () => {
    expect(line('fr', 0, 0)).toBe('0 entrée · 0 active · 0 en pause')
    expect(line('fr', 1, 1)).toBe('1 entrée · 1 active · 0 en pause')
    expect(line('fr', 3, 2)).toBe('3 entrées · 2 actives · 1 en pause')
  })

  // Russian counts in three classes, by the wallet's own rule (utils/pluralRules.js).
  it.each([
    [1, 1, '1 запись · 1 активная · 0 на паузе'],
    [2, 2, '2 записи · 2 активные · 0 на паузе'],
    [4, 3, '4 записи · 3 активные · 1 на паузе'],
    [5, 5, '5 записей · 5 активных · 0 на паузе'],
    [11, 11, '11 записей · 11 активных · 0 на паузе'],
    [21, 21, '21 запись · 21 активная · 0 на паузе'],
    [22, 0, '22 записи · 0 активных · 22 на паузе'],
  ])('declines %i entries with %i live ones in Russian', (total, live, said) => {
    expect(line('ru', total, live)).toBe(said)
  })

  // Rendered, not reasoned about: a form separator or a placeholder left open shows here.
  describe.each(LANGUAGES)('in %s', (locale) => {
    it.each([
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
      [5, 2],
      [21, 11],
    ])('prints whole words and the three numbers for %i entries, %i live', (total, live) => {
      const said = line(locale, total, live)

      expect(said).not.toMatch(/[{}|]/)
      expect(said).not.toContain('matching.entries')
      expect(said.split(' · ')).toHaveLength(3)
      expect(said.split(' · ').map((piece) => Number.parseInt(piece, 10))).toEqual([
        total,
        live,
        total - live,
      ])
    })
  })
})
