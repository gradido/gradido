// AI-GENERATED — not an architecture reference
// @vitest-environment node
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile } from 'sass'
import { describe, expect, it } from 'vitest'

/**
 * The stylesheet of the top bar, compiled as the build compiles it, for what the account menu
 * carries since its switch of light and dark (AO-012): a heading that reads on the bar's own dark,
 * and entries that stay inside the window on a phone, in every language.
 *
 * The bar carries Bootstrap's dark mode in both modes of the page (NavBar.tsx, `vBColorMode`), so
 * its menu's ground and muted colour are Bootstrap's dark ones, read from Bootstrap's stylesheet.
 */
const here = dirname(fileURLToPath(import.meta.url))
const css = compile(join(here, 'NavBar.scss')).css.replace(/\/\*[\s\S]*?\*\//g, '')
const bootstrap = readFileSync(
  createRequire(import.meta.url).resolve('bootstrap/dist/css/bootstrap.css'),
  'utf8',
)

/** The flat rules of a stretch of CSS: each selector with its declarations. */
const rules = (text) =>
  [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, declarations]) => ({
    selector: selector.trim().replace(/\s+/g, ' '),
    declarations: Object.fromEntries(
      declarations
        .split(';')
        .map((declaration) => declaration.split(':'))
        .filter((parts) => parts.length >= 2)
        .map(([property, ...value]) => [property.trim(), value.join(':').trim()]),
    ),
  }))
const declarationsOf = (list, selector) =>
  Object.assign({}, ...list.filter((rule) => rule.selector === selector).map((r) => r.declarations))

const PHONE = '@media (width < 992px)'
/** The rules inside every phone block, and the rules outside them. */
const phoneBlocks = [...css.matchAll(/@media \(width < 992px\) \{([\s\S]*?)\n\}/g)].map(
  ([, b]) => b,
)
const phone = rules(phoneBlocks.join('\n'))
const desk = rules(css.replace(/@media[^{]*\{[\s\S]*?\n\}/g, ''))

// WCAG 2's contrast ratio, with a translucent colour laid over its ground.
const parse = (colour) =>
  colour.startsWith('#')
    ? [1, 3, 5].map((at) => Number.parseInt(colour.slice(at, at + 2), 16)).concat(1)
    : colour
        .replace(/rgba?\(|\)/g, '')
        .split(',')
        .map(Number)
        .concat(1)
        .slice(0, 4)
const over = (fg, bg) => fg.slice(0, 3).map((c, i) => c * fg[3] + bg[i] * (1 - fg[3]))
const luminance = (rgb) =>
  rgb
    .map((value) => value / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0)
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('the stylesheet of the top bar', () => {
  it('compiles, and has the blocks this reads', () => {
    expect(css).toContain('.component-nabvar .dropdown-menu')
    expect(phoneBlocks.length).toBeGreaterThan(0)
    expect(css).toContain(PHONE)
  })

  // Bootstrap's own heading grey, #6c757d, stood at 3.3 on the menus of the bar.
  it('gives the heading of a menu the bar’s muted colour, 4.5 and more on its ground', () => {
    const menu = declarationsOf(desk, '.component-nabvar .dropdown-menu')
    expect(menu['--bs-dropdown-header-color']).toBe('var(--bs-secondary-color)')

    const dark = bootstrap.match(/\[data-bs-theme=dark\] \{([^}]*)\}/)?.[1] ?? ''
    const variable = (name) => dark.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1]?.trim()
    const ground = parse(variable('--bs-body-bg'))
    const muted = parse(variable('--bs-secondary-color'))
    expect(ground).toHaveLength(4)
    expect(muted[3]).toBeLessThan(1)
    expect(contrast(over(muted, ground), ground.slice(0, 3))).toBeGreaterThanOrEqual(4.5)
  })

  // "Seguir la configuración del sistema (predeterminado)" alone is 390 px wide, and Bootstrap
  // keeps an entry on one line: at 320 and 390 px the menu ran past the window in eight languages.
  it('keeps the account menu inside the window on a phone, an entry breaking into a second line', () => {
    expect(declarationsOf(phone, '.component-nabvar .navbar-account .dropdown-menu')).toEqual({
      width: 'max-content',
      'max-width': 'calc(100vw - 1rem)',
    })
    expect(
      declarationsOf(phone, '.component-nabvar .navbar-account .dropdown-item')['white-space'],
    ).toBe('normal')
    // At the desk the menu is as wide as its longest entry, as it was.
    expect(declarationsOf(desk, '.component-nabvar .navbar-account .dropdown-menu')).toEqual({})
    expect(declarationsOf(desk, '.component-nabvar .navbar-account .dropdown-item')).toEqual({})
  })
})
