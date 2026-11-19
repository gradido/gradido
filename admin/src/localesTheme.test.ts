// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The switch of light and dark in the account menu (NavBar.ts) speaks the wallet's words
 * (AO-012): what the wallet's settings page calls the setting and its three modes, in each
 * language, letter for letter -- the admin coins no word of its own for it.
 *
 * The two apps share no package, so the wallet's language files are read across the tree, as
 * darkModeStyles.test.ts reads its dark tones; the admin's workflow runs on them as well
 * (workflowPaths.test.ts). One literal path per language, so that check can find each of them.
 */
const here = dirname(fileURLToPath(import.meta.url))
const WALLET = {
  de: resolve(here, '../../frontend/src/locales/de.json'),
  el: resolve(here, '../../frontend/src/locales/el.json'),
  en: resolve(here, '../../frontend/src/locales/en.json'),
  es: resolve(here, '../../frontend/src/locales/es.json'),
  fr: resolve(here, '../../frontend/src/locales/fr.json'),
  it: resolve(here, '../../frontend/src/locales/it.json'),
  nl: resolve(here, '../../frontend/src/locales/nl.json'),
  pt: resolve(here, '../../frontend/src/locales/pt.json'),
  ru: resolve(here, '../../frontend/src/locales/ru.json'),
  tr: resolve(here, '../../frontend/src/locales/tr.json'),
}
const ADMIN = join(here, 'locales')

const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'))

describe('the switch of light and dark', () => {
  it("speaks the wallet's words in every language", () => {
    // Every language of the admin has its wallet file here, and no other.
    const languages = readdirSync(ADMIN)
      .filter((name) => name.endsWith('.json'))
      .map((name) => name.replace(/\.json$/, ''))
    expect(languages.length).toBeGreaterThanOrEqual(10)
    expect(Object.keys(WALLET).sort()).toEqual(languages.sort())

    for (const [language, path] of Object.entries(WALLET)) {
      const wallet = read(path).settings.theme
      const { appearance, theme } = read(join(ADMIN, `${language}.json`)).navbar
      expect(wallet.title, language).toBeTruthy()
      expect({ appearance, ...theme }, language).toEqual({
        appearance: wallet.title,
        system: wallet.system,
        light: wallet.light,
        dark: wallet.dark,
      })
    }
  })
})
