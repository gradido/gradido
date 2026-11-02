// AI-GENERATED — not an architecture reference

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, DARK_BAR_COLOUR, THEME_MODE_STORAGE_KEY } from '@/composables/useTheme'

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

// The colours named for the window's bar (as an installed app the admin runs in the wallet's
// window): the page's dark in the dark, nothing in the light.
const barColours = () =>
  [...document.querySelectorAll('meta[name="theme-color"]')].map((meta) => meta.content)
const clearBar = () => {
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    meta.remove()
  }
}

// The page's dark: `--bs-body-bg` of the bridge in App.css, the wallet's --bg.
const appCss = readFileSync(join(here, 'App.css'), 'utf8')
const bridge = appCss.match(/:root\[data-bs-theme='dark'\]\s*\{([^}]*)\}/)?.[1] ?? ''
const pageDark = bridge.match(/--bs-body-bg:\s*(#[0-9a-f]{6})/)?.[1]

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
    clearBar()
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
      clearBar()
      runThemeScript()
      expect(markedDark(), `${stored} · system dark ${systemDark}`).toBe(dark)
      expect(barColours(), `bar: ${stored} · system dark ${systemDark}`).toEqual(
        dark ? [DARK_BAR_COLOUR] : [],
      )

      // The composable takes over the tag the script left, and names no second one.
      document.documentElement.removeAttribute('data-bs-theme')
      applyTheme()
      expect(markedDark(), `useTheme: ${stored} · system dark ${systemDark}`).toBe(dark)
      expect(barColours(), `useTheme bar: ${stored} · system dark ${systemDark}`).toEqual(
        dark ? [DARK_BAR_COLOUR] : [],
      )
    }
  })

  it("names the page's dark for the window's bar, in the page and in the composable alike", () => {
    expect(pageDark, "no --bs-body-bg in App.css's dark bridge").toMatch(/^#[0-9a-f]{6}$/)
    expect(DARK_BAR_COLOUR).toBe(pageDark)
    expect(themeScript).toContain(`'${pageDark}'`)
    expect(themeScript).toContain("'theme-color'")
    expect(themeScript).toContain('document.head.appendChild')
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
