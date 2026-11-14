// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'

// A key that is missing, or misspelt, stands as the key on the screen (i18n.ts), and no lint reads
// this package: every key the support's files name has to be in all ten languages.
const here = new URL('./', import.meta.url)
const files = [
  ...readdirSync(here)
    .filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'))
    .map((name) => new URL(name, here)),
  new URL('../../pages/Support.ts', import.meta.url),
  new URL('../../data/SupportTicket.logic.ts', import.meta.url),
  // the count of the open tab (K3): its lines on the start page, its badge in the bar
  new URL('../../pages/Dashboard.ts', import.meta.url),
  new URL('../NavBar.ts', import.meta.url),
]
const source = files.map((file) => readFileSync(file, 'utf8')).join('\n')
// keys handed to t() and the keys of the tabs and the questions, which are named as strings --
// a key with a hyphen too (moderator.message-tooltip)
const keys = [
  ...new Set(
    [
      ...source.matchAll(/\bt\(\s*'([\w.-]+)'/g),
      ...source.matchAll(/'((?:support|navbar|dashboard)\.[\w.-]+)'/g),
    ].map((match) => match[1]),
  ),
]
const LANGUAGES = ['de', 'el', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'ru', 'tr']
const messages = Object.fromEntries(
  LANGUAGES.map((language) => [
    language,
    JSON.parse(
      readFileSync(
        new URL(`../../../../admin/src/locales/${language}.json`, import.meta.url),
        'utf8',
      ),
    ),
  ]),
)
const textOf = (language: string, key: string) =>
  key
    .split('.')
    .reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], messages[language])

describe('the texts of the support page', () => {
  it('finds the keys it is about: the fixture has to prove itself', () => {
    expect(keys).toContain('support.tab.open')
    expect(keys).toContain('support.notFound')
    expect(keys).toContain('details')
    expect(keys).toContain('moderator.message-tooltip')
    expect(keys).toContain('support.confirmDelete.body')
    expect(keys).toContain('dashboard.supportNone')
    expect(keys.length).toBeGreaterThan(40)
  })

  it('has every key in all ten languages', () => {
    const missing = LANGUAGES.flatMap((language) =>
      keys
        .filter((key) => typeof textOf(language, key) !== 'string')
        .map((key) => `${language}: ${key}`),
    )
    expect(missing).toEqual([])
  })

  it('has the menu entry in all ten languages', () => {
    expect(
      LANGUAGES.filter((language) => typeof textOf(language, 'navbar.support') !== 'string'),
    ).toEqual([])
  })
})
