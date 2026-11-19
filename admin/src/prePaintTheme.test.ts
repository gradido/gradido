// AI-GENERATED — not an architecture reference

import { afterAll, afterEach, describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

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

const runThemeScript = () => new Function(themeScript ?? '')()

// No browser here: a window and a document of the test's own, with as much of each as the script
// and theme.ts ask for -- the storage, the system's preference, the mark on <html> and the tags
// in the head.
const items = new Map<string, string>()
let refuses = false
const localStorage = {
  getItem: (key: string) => {
    if (refuses) {
      throw new Error('SecurityError')
    }
    return items.get(key) ?? null
  },
}
let systemDark = false
// one object, as theme.ts asks for it once: what it answers follows the test
const preference = {
  get matches() {
    return systemDark
  },
  addEventListener: () => undefined,
}
const matchMedia = (query: string) =>
  query === '(prefers-color-scheme: dark)' ? preference : { matches: false }
const page: { matchMedia?: typeof matchMedia } & Record<string, unknown> = {
  localStorage,
  matchMedia,
  addEventListener: () => undefined,
}
const attributes = new Map<string, string>()
type Meta = { name: string; content: string; remove: () => void }
let metas: Meta[] = []
Object.assign(globalThis, {
  window: page,
  localStorage,
  document: {
    documentElement: {
      setAttribute: (name: string, value: string) => attributes.set(name, value),
      removeAttribute: (name: string) => attributes.delete(name),
    },
    head: {
      querySelector: () => metas.find((meta) => meta.name === 'theme-color') ?? null,
      appendChild: (meta: Meta) => metas.push(meta),
    },
    createElement: () => {
      const meta: Meta = {
        name: '',
        content: '',
        remove: () => {
          metas = metas.filter((other) => other !== meta)
        },
      }
      return meta
    },
  },
})
// after the window: theme.ts asks it for the system's preference as it loads
const { DARK_BAR_COLOUR, followTheme, THEME_MODE_STORAGE_KEY } = await import('@/theme')

// taken away again: the tests of other files run in this process, and sass, for one, takes a
// `document` for a browser
afterAll(() => {
  for (const name of ['window', 'localStorage', 'document']) {
    Reflect.deleteProperty(globalThis, name)
  }
})

const markedDark = () => attributes.get('data-bs-theme') === 'dark'
const unmark = () => attributes.delete('data-bs-theme')

// The colours named for the window's bar (as an installed app the admin runs in the wallet's
// window): the page's dark in the dark, nothing in the light.
const barColours = () =>
  metas.filter((meta) => meta.name === 'theme-color').map((meta) => meta.content)
const clearBar = () => {
  metas = []
}

// The page's dark: `--bs-body-bg` of the bridge in App.css, the wallet's --bg.
const appCss = readFileSync(join(here, 'App.css'), 'utf8')
const bridge = appCss.match(/:root\[data-bs-theme='dark'\]\s*\{([^}]*)\}/)?.[1] ?? ''
const pageDark = bridge.match(/--bs-body-bg:\s*(#[0-9a-f]{6})/)?.[1]

const systemIs = (dark: boolean) => {
  systemDark = dark
}

// stored value (null: no key) · system dark? · the document marked dark?
const CASES: [string | null, boolean, boolean][] = [
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
    items.clear()
    unmark()
    clearBar()
    page.matchMedia = matchMedia
    refuses = false
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

    // What it does, case by case -- and the same as theme.ts, which follows it afterwards.
    for (const [stored, systemDark, dark] of CASES) {
      items.clear()
      if (stored !== null) {
        items.set(THEME_MODE_STORAGE_KEY, stored)
      }
      systemIs(systemDark)
      unmark()
      clearBar()
      runThemeScript()
      expect(markedDark(), `${stored} · system dark ${systemDark}`).toBe(dark)
      expect(barColours(), `bar: ${stored} · system dark ${systemDark}`).toEqual(
        dark ? [DARK_BAR_COLOUR] : [],
      )

      // theme.ts takes over the tag the script left, and names no second one.
      unmark()
      followTheme()
      expect(markedDark(), `theme.ts: ${stored} · system dark ${systemDark}`).toBe(dark)
      expect(barColours(), `theme.ts bar: ${stored} · system dark ${systemDark}`).toEqual(
        dark ? [DARK_BAR_COLOUR] : [],
      )
    }
  })

  it("names the page's dark for the window's bar, in the page and in theme.ts alike", () => {
    expect(pageDark, "no --bs-body-bg in App.css's dark bridge").toMatch(/^#[0-9a-f]{6}$/)
    expect(pageDark).toBe(DARK_BAR_COLOUR)
    expect(themeScript).toContain(`'${pageDark}'`)
    expect(themeScript).toContain("'theme-color'")
    expect(themeScript).toContain('document.head.appendChild')
  })

  it('and guards the storage', () => {
    expect(themeScript).toMatch(/\btry\s*\{[\s\S]*getItem[\s\S]*\}\s*catch\b/)
    // A private window: reading the storage throws. The page still loads, and the system decides
    // -- as theme.ts decides a moment later, so nothing flips once the app is up.
    refuses = true
    for (const systemDark of [true, false]) {
      systemIs(systemDark)
      unmark()
      expect(() => runThemeScript()).not.toThrow()
      expect(markedDark(), `system dark ${systemDark}`).toBe(systemDark)
      unmark()
      followTheme()
      expect(markedDark(), `theme.ts: system dark ${systemDark}`).toBe(systemDark)
    }
    // ... and a browser without matchMedia loads light.
    refuses = false
    delete page.matchMedia
    items.set(THEME_MODE_STORAGE_KEY, 'system')
    unmark()
    expect(() => runThemeScript()).not.toThrow()
    expect(markedDark()).toBe(false)
  })
})
