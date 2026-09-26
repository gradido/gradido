// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import i18n from '@/i18n'

/**
 * Every language the wallet speaks needs its own date and number formats.
 *
 * ⛔ vue-i18n does not complain when one is missing. `$d(date, 'time')` and
 * `$n(value, 'decimal')` look the named format up along the fallback chain and then format
 * with the locale they FOUND it in -- English. Turkish ran like that from the day it was
 * added: "2:02 PM", "9/22/2026", "August 2026" in the middle of a Turkish sentence, and every
 * amount as "1,234.50". No test failed and nothing was logged in production; the wallet just
 * spoke English wherever a date or a number stood.
 *
 * So the languages of both format tables are held to the languages in `messages`, and the
 * format names of every language to the ones English has -- the language all others fall
 * back to, so a name missing anywhere else would quietly be printed in English.
 */
const { messages, datetimeFormats, numberFormats, d, n } = i18n.global
const languages = Object.keys(messages.value).sort()

const tables = [
  ['datetimeFormats', datetimeFormats],
  ['numberFormats', numberFormats],
]

const namesOf = (block) => Object.keys(block ?? {}).sort()

describe('the date and number formats', () => {
  it.each(tables)('%s has a block for every language in messages', (_, table) => {
    expect(Object.keys(table.value).sort()).toEqual(languages)
  })

  it.each(tables)('%s gives every language the format names English has', (_, table) => {
    const english = namesOf(table.value.en)
    const names = Object.fromEntries(languages.map((lang) => [lang, namesOf(table.value[lang])]))
    expect(names).toEqual(Object.fromEntries(languages.map((lang) => [lang, english])))
  })
})

describe('Turkish', () => {
  // The test script runs with TZ=UTC, so this is 14:02 on the clock the formats read.
  const septemberAfternoon = new Date(Date.UTC(2026, 8, 22, 14, 2))
  const midAugust = new Date(Date.UTC(2026, 7, 15, 10, 0))

  it('writes the time, the date and the month in Turkish', () => {
    expect(d(septemberAfternoon, 'time', 'tr')).toBe('14:02')
    expect(d(septemberAfternoon, 'short', 'tr')).toBe('22.09.2026')
    expect(d(midAugust, 'monthAndYear', 'tr')).toBe('Ağustos 2026')
  })

  it('writes an amount with the Turkish separators', () => {
    expect(n(1234.5, 'decimal', 'tr')).toBe('1.234,50')
    expect(n(1234.5, 'ungroupedDecimal', 'tr')).toBe('1234,50')
  })
})
