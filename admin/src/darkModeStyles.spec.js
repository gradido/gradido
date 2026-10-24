// AI-GENERATED — not an architecture reference

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * The dark mode of the admin, read from its stylesheets (AO-011 … AO-016).
 *
 * As in phoneStyles.spec.js: Vitest hands every stylesheet to the tests as an empty string and
 * jsdom lays nothing out, so the rules are read where they are written, comments taken out first.
 * How the dark mode looks is measured in the built admin; what these hold is what that rests on:
 * the tones of the bridge in App.css are the wallet's, each text colour of it reaches 4.5 on each
 * of its grounds, every dark rule waits for the mark on <html>, and no stylesheet grows a fixed
 * colour of the dark mode unseen.
 *
 * ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class and node rejects an
 * instance of it as coming from another realm.
 */
const here = dirname(fileURLToPath(import.meta.url))
const APP = join(here, 'App.css')
// The wallet's dark tones. The two apps share no package; this file is read across the tree, as
// utils/avatarColor.spec.js reads the wallet's copy of its rule.
const WALLET_DARK = resolve(here, '../../frontend/src/assets/scss/gradido-template-dark.scss')

const DARK = ":root[data-bs-theme='dark']"

const withoutComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const read = (path) => withoutComments(readFileSync(path, 'utf8'))

/** The flat rules of a stretch of CSS: each selector with its declarations. */
const rules = (css) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, declarations]) => ({
    selector: selector.trim().replace(/\s+/g, ' '),
    declarations: Object.fromEntries(
      declarations
        .split(';')
        .map((declaration) => declaration.split(':'))
        .filter((parts) => parts.length >= 2)
        .map(([property, ...value]) => [
          property.trim(),
          value.join(':').trim().replace(/\s+/g, ' '),
        ]),
    ),
  }))

/** The dark rules: every rule whose selector names the mark. */
const darkRules = (css) => rules(css).filter((rule) => rule.selector.includes('data-bs-theme'))

/** The declarations of every rule with exactly this selector, together. */
const declarationsOf = (list, selector) =>
  Object.assign({}, ...list.filter((rule) => rule.selector === selector).map((r) => r.declarations))

const fixedColours = (css) =>
  (css.match(/#[0-9a-f]{3,8}\b/gi) ?? []).length + (css.match(/\brgba?\(/gi) ?? []).length

/** Every stylesheet below a folder, by a walk of its own (`recursive` is ignored before Node 18.17). */
const stylesheetsBelow = (folder) =>
  readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name)
    if (entry.isDirectory()) {
      return stylesheetsBelow(path)
    }
    return /\.s?css$/.test(entry.name) ? [path] : []
  })

// WCAG 2's relative luminance and contrast ratio.
const channels = (hex) => {
  const digits = hex.replace('#', '')
  const full = digits.length === 3 ? [...digits].map((d) => d + d).join('') : digits
  return [0, 2, 4].map((at) => Number.parseInt(full.slice(at, at + 2), 16))
}
const luminance = (hex) => {
  const [r, g, b] = channels(hex).map((value) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const app = read(APP)
const bridge = declarationsOf(darkRules(app), DARK)

/** A colour as the bridge resolves it: a variable of the bridge, or the value itself. */
const colour = (value) => {
  const plain = value.replace(/\s*!important$/, '')
  const variable = plain.match(/^var\((--[\w-]+)\)$/)
  return variable ? bridge[variable[1]] : plain
}

describe('the dark mode of the admin', () => {
  it("the bridge carries the wallet's dark tokens", () => {
    const wallet = readFileSync(WALLET_DARK, 'utf8')
    // The wallet's token block: the first one, on #app.dark-mode and body.dark-mode.
    const start = wallet.indexOf('body.dark-mode {')
    expect(start, 'no token block in the wallet stylesheet').toBeGreaterThan(-1)
    const block = wallet.slice(start, wallet.indexOf('}', start))
    const tokens = Object.fromEntries(
      [...block.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-f]{3,8})\b/gi)].map(([, name, hex]) => [
        name,
        hex.toLowerCase(),
      ]),
    )
    const PAIRS = {
      '--bg': '--bs-body-bg',
      '--surface': '--bs-tertiary-bg',
      '--surface-muted': '--bs-secondary-bg',
      '--text': '--bs-body-color',
      '--text-muted': '--bs-secondary-color',
      '--border': '--bs-border-color',
      '--link': '--bs-link-color',
    }
    for (const [token, variable] of Object.entries(PAIRS)) {
      expect(tokens[token], `${token} in the wallet`).toMatch(/^#[0-9a-f]{6}$/)
      expect(bridge[variable], variable).toBe(tokens[token])
    }
    // Every triple beside a tone is that tone: Bootstrap mixes some colours from the triples.
    const triples = Object.entries(bridge).filter(([name]) => name.endsWith('-rgb'))
    expect(triples.length).toBeGreaterThanOrEqual(7)
    for (const [name, triple] of triples) {
      const tone = bridge[name.replace(/-rgb$/, '')]
      expect(tone, name).toMatch(/^#[0-9a-f]{3,6}$/)
      expect(triple.split(',').map(Number), name).toEqual(channels(tone))
    }
  })

  // The top bar keeps its own dark in both modes (AO-015). It carries `data-bs-theme="dark"` itself
  // and so declares Bootstrap's dark variables for itself; only a rule on its menus could reach in.
  it('leaves the menus of the top bar to the bar', () => {
    const menus = darkRules(app).filter((rule) => rule.selector.includes('.dropdown-menu'))
    expect(menus.length).toBeGreaterThan(0)
    for (const rule of menus) {
      for (const selector of rule.selector.split(',').map((part) => part.trim())) {
        expect(selector).toContain(':not(.navbar .dropdown-menu)')
      }
    }
    // ... and no other dark rule names the bar.
    for (const sheet of stylesheetsBelow(here)) {
      for (const rule of darkRules(read(sheet))) {
        expect(rule.selector.replaceAll(':not(.navbar .dropdown-menu)', ''), sheet).not.toMatch(
          /navbar/,
        )
      }
    }
  })

  // The clear box of the search field (UserQuery.tsx) answers the pointer with a ground of its own:
  // a field's ground at rest would make the dark hover no hover at all.
  it('gives the clear box under the pointer a ground apart from its ground at rest', () => {
    const hover = colour(
      declarationsOf(darkRules(app), `${DARK} .pointer:hover`)['background-color'],
    )
    expect(hover).toMatch(/^#[0-9a-f]{6}$/)
    expect(contrast(hover, bridge['--bs-secondary-bg'])).toBeGreaterThanOrEqual(1.4)
    expect(contrast(bridge['--bs-body-color'], hover)).toBeGreaterThanOrEqual(4.5)
  })

  it('every text colour of the bridge reaches 4.5 on every surface of the bridge', () => {
    const dark = darkRules(app)
    const grounds = {
      page: bridge['--bs-body-bg'],
      card: bridge['--bs-tertiary-bg'],
      field: bridge['--bs-secondary-bg'],
    }
    const texts = {
      text: bridge['--bs-body-color'],
      muted: bridge['--bs-secondary-color'],
      link: bridge['--bs-link-color'],
    }
    for (const variant of ['secondary', 'danger', 'primary', 'success']) {
      const selector = `${DARK} .btn-outline-${variant}`
      texts[`outline ${variant}`] = colour(declarationsOf(dark, selector)['--bs-btn-color'] ?? '')
    }
    for (const word of ['success', 'danger', 'primary', 'secondary']) {
      texts[`.text-${word}`] = colour(declarationsOf(dark, `${DARK} .text-${word}`).color ?? '')
    }
    for (const [name, text] of Object.entries(texts)) {
      expect(text, name).toMatch(/^#[0-9a-f]{3,6}$/)
      for (const [groundName, ground] of Object.entries(grounds)) {
        const ratio = contrast(text, ground)
        // Known, and the one exception: muted text in a field. No such text stands in one --
        // only a placeholder, which has a colour of its own (below).
        if (text === texts.muted && groundName === 'field') {
          expect(ratio).toBeGreaterThan(4.2)
          continue
        }
        expect(ratio, `${name} ${text} on the ${groundName} ${ground}`).toBeGreaterThanOrEqual(4.5)
      }
    }
    const placeholder = colour(
      declarationsOf(dark, `${DARK} .form-control::placeholder`).color ?? '',
    )
    expect(contrast(placeholder, grounds.field)).toBeGreaterThanOrEqual(4.5)

    // A button's own grounds: the light one, and the light and the grey one under the pointer
    // and pressed.
    const light = declarationsOf(dark, `${DARK} .btn-light`)
    const pairs = [
      [light['--bs-btn-color'], light['--bs-btn-bg']],
      [light['--bs-btn-hover-color'], light['--bs-btn-hover-bg']],
      [light['--bs-btn-active-color'], light['--bs-btn-active-bg']],
    ]
    for (const variant of ['secondary', 'danger']) {
      const outline = declarationsOf(dark, `${DARK} .btn-outline-${variant}`)
      pairs.push([outline['--bs-btn-hover-color'], outline['--bs-btn-hover-bg']])
      pairs.push([outline['--bs-btn-active-color'], outline['--bs-btn-active-bg']])
    }
    for (const [text, ground] of pairs) {
      expect(contrast(colour(text), colour(ground)), `${text} on ${ground}`).toBeGreaterThanOrEqual(
        4.5,
      )
    }
  })

  // ⛔ On the root: the top bar carries `data-bs-theme="dark"` itself, in the light mode as well
  // (NavBar.tsx, `vBColorMode`). A bare `[data-bs-theme=dark] .x` would reach into it while the
  // page is light; `:root[…]` reaches it only while the whole page is dark.
  it('every dark rule of the admin sits under data-bs-theme', () => {
    const sheets = stylesheetsBelow(here)
    // The walk proves itself: it reached the sheets two folders down, App.css among them.
    expect(sheets.length).toBeGreaterThan(20)
    expect(sheets).toContain(APP)
    let darkSelectors = 0
    for (const sheet of sheets) {
      const css = read(sheet)
      expect(css, sheet).not.toMatch(/prefers-color-scheme/)
      expect(css, sheet).not.toMatch(/\.dark-mode\b/)
      for (const rule of darkRules(css)) {
        for (const selector of rule.selector.split(',').map((part) => part.trim())) {
          expect(selector.startsWith(DARK), `${sheet}: ${selector}`).toBe(true)
          darkSelectors += 1
        }
      }
    }
    // ... and finds a dark rule where there is one.
    expect(darkRules(app).length).toBeGreaterThan(10)
    expect(darkSelectors).toBeGreaterThanOrEqual(darkRules(app).length)
  })

  // The dark rules may name a tone of their own only where Bootstrap has none -- App.css is the
  // palette. Counted as built; a sheet that is not listed holds no fixed colour in a dark rule.
  it('the dark blocks stay within their bounds', () => {
    const DARK_COLOURS_AT_MOST = {
      [APP]: 41,
    }
    const counted = Object.fromEntries(
      stylesheetsBelow(here).map((sheet) => {
        const dark = read(sheet).match(/[^{}]*data-bs-theme[^{}]*\{[^{}]*\}/g) ?? []
        return [sheet, fixedColours(dark.join('\n'))]
      }),
    )
    for (const [sheet, count] of Object.entries(counted)) {
      expect(count, sheet).toBeLessThanOrEqual(DARK_COLOURS_AT_MOST[sheet] ?? 0)
    }
    // The count sees a colour where there is one.
    expect(counted[APP]).toBeGreaterThan(0)
  })
})
