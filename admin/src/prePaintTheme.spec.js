// AI-GENERATED — not an architecture reference

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, THEME_MODE_STORAGE_KEY } from '@/composables/useTheme'

// The admin is light or dark before its first paint (AO-011): a script in the head of the page
// reads the wallet's setting and marks <html> before anything is drawn. Nothing of the page runs
// in a test, so the page itself is read -- and its script run, the way the browser would.
const here = dirname(fileURLToPath(import.meta.url))
const html = readFileSync(join(here, '..', 'index.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '')
// Parted at the end of the head, not by a search for the tags: a script may name a tag in a comment.
const [beforeBody, body = ''] = html.split('</head>')
const head = beforeBody.slice(beforeBody.indexOf('<head>'))
// Classic scripts only: an inline script without attributes runs while the page is parsed, a
// module waits until it is.
const headScripts = [...head.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(([, code]) => code)
const themeScript = headScripts.find((code) => code.includes('gradido-theme-mode'))

const runThemeScript = () => new Function(themeScript)()

const markedDark = () => document.documentElement.getAttribute('data-bs-theme') === 'dark'

const systemIs = (dark) => {
  window.matchMedia = vi.fn((query) => ({
    matches: query === '(prefers-color-scheme: dark)' && dark,
  }))
}

// stored value (null: no key) · system dark? · the document marked dark?
const CASES = [
  ['dark', false, true],
  ['light', true, false],
  ['system', true, true],
  ['system', false, false],
  [null, true, true],
  [null, false, false],
  ['blue', true, true],
]

describe('the theme before the first paint', () => {
  afterEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-bs-theme')
    delete window.matchMedia
    vi.restoreAllMocks()
  })

  it("index.html marks the document dark before the first paint from the wallet's key", () => {
    // One script, in the head, classic, ahead of the app's module in the body.
    expect(themeScript, 'no theme script in the head of index.html').toBeDefined()
    expect(headScripts.filter((code) => code.includes('gradido-theme-mode'))).toHaveLength(1)
    expect(body).toContain('src="/src/main.ts"')
    expect(body).not.toContain('gradido-theme-mode')
    // The wallet's key, the system's preference, Bootstrap's mark -- on <html>, not on <body>.
    expect(themeScript).toContain(`'${THEME_MODE_STORAGE_KEY}'`)
    expect(themeScript).toContain("'(prefers-color-scheme: dark)'")
    expect(themeScript).toContain("document.documentElement.setAttribute('data-bs-theme', 'dark')")
    expect(themeScript).not.toMatch(/document\.body/)

    // What it does, case by case -- and the same as the composable that follows it afterwards.
    for (const [stored, systemDark, dark] of CASES) {
      window.localStorage.clear()
      if (stored !== null) {
        window.localStorage.setItem(THEME_MODE_STORAGE_KEY, stored)
      }
      systemIs(systemDark)
      document.documentElement.removeAttribute('data-bs-theme')
      runThemeScript()
      expect(markedDark(), `${stored} · system dark ${systemDark}`).toBe(dark)

      document.documentElement.removeAttribute('data-bs-theme')
      applyTheme()
      expect(markedDark(), `useTheme: ${stored} · system dark ${systemDark}`).toBe(dark)
    }
  })

  it('and guards the storage', () => {
    expect(themeScript).toMatch(/\btry\s*\{[\s\S]*getItem[\s\S]*\}\s*catch\b/)
    // A private window: reading the storage throws. The page still loads, and the system decides
    // -- as the composable decides a moment later, so nothing flips once the app is up.
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    })
    for (const systemDark of [true, false]) {
      systemIs(systemDark)
      document.documentElement.removeAttribute('data-bs-theme')
      expect(() => runThemeScript()).not.toThrow()
      expect(markedDark(), `system dark ${systemDark}`).toBe(systemDark)
      document.documentElement.removeAttribute('data-bs-theme')
      applyTheme()
      expect(markedDark(), `useTheme: system dark ${systemDark}`).toBe(systemDark)
    }
    // ... and a browser without matchMedia loads light.
    vi.restoreAllMocks()
    delete window.matchMedia
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, 'system')
    document.documentElement.removeAttribute('data-bs-theme')
    expect(() => runThemeScript()).not.toThrow()
    expect(markedDark()).toBe(false)
  })
})
