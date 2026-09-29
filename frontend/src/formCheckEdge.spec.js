// AI-GENERATED — not an architecture reference
// @vitest-environment node
// Node, not jsdom: sass runs here, and jsdom's URL class is one node rejects.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { compile, Logger } from 'sass'

/**
 * The edge of an empty box, switch or radio (Bootstrap's `.form-check-input`) in light mode:
 * the muted text colour, as the dark mode has it (Bernd, 26.09.2026 -- Bootstrap's own edge
 * stood at 1.19:1 against white). The rule sits in gradido-template.scss, which the wallet's
 * stylesheet takes in BEFORE Bootstrap, so it has to outweigh Bootstrap's rule rather than
 * follow it -- and must not outweigh Bootstrap's focus and validation edges.
 *
 * jsdom runs no cascade, so the stylesheet is compiled as the build compiles it
 * (scripts/scss.mjs: gradido.scss, node_modules and the scss folder to look in) and the rules
 * are weighed against each other in the order they come out.
 */
const here = dirname(fileURLToPath(import.meta.url))
const SCSS = join(here, 'assets', 'scss')

const css = compile(join(SCSS, 'gradido.scss'), {
  loadPaths: [join(here, '..', '..', 'node_modules'), SCSS],
  logger: Logger.silent,
}).css.replace(/\/\*[\s\S]*?\*\//g, '')

/** Every rule in the order it comes out: its selectors, its declarations, its place. */
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selectors, body], at) => ({
  selectors: selectors.split(',').map((selector) => selector.trim()),
  body: body.replace(/\s+/g, ' ').trim(),
  at,
}))
const ruleFor = (selector, declaration) =>
  rules.find((rule) => rule.selectors.includes(selector) && declaration.test(rule.body))

/**
 * Classes and pseudo-classes of a selector, `:not(x)` weighing what x weighs -- all the
 * selectors here need, and refused where more would be guessed.
 */
const weight = (selector) => {
  if (/#|::|:(is|where|has|nth-[\w-]+)\(/.test(selector)) {
    throw new Error(`weigh this selector by hand: ${selector}`)
  }
  return (selector.replace(/:not\(([^)]*)\)/g, '$1').match(/\.[\w-]+|:[\w-]+/g) || []).length
}

const light = ruleFor('.form-check-input:not(:checked)', /border-color/)
const dark = ruleFor('.dark-mode .form-check-input:not(:checked)', /border-color/)
const bootstrap = ruleFor('.form-check-input', /(^|; )border: /)
const focus = ruleFor('.form-check-input:focus', /border-color/)

describe('the edge of an empty box in light mode', () => {
  it('finds the rules it is about to weigh', () => {
    // The fixture proves itself: without the four, every weighing below would describe nothing.
    expect(light).toBeDefined()
    expect(dark).toBeDefined()
    expect(bootstrap).toBeDefined()
    expect(focus).toBeDefined()
  })

  it('is the muted text colour, and nothing else', () => {
    expect(light.body).toBe('border-color: var(--text-muted);')
  })

  // Written before Bootstrap: only the weight can carry it.
  it("outweighs Bootstrap's edge, which comes after it", () => {
    expect(light.at).toBeLessThan(bootstrap.at)
    expect(weight(light.selectors[0])).toBeGreaterThan(weight('.form-check-input'))
  })

  // A tie, and Bootstrap's comes later: the focused box keeps Bootstrap's edge.
  it("leaves the edge of a focused box to Bootstrap's focus rule", () => {
    expect(focus.at).toBeGreaterThan(light.at)
    expect(weight('.form-check-input:focus')).toBe(weight(light.selectors[0]))
  })

  it('leaves the dark mode its own edge, which weighs more', () => {
    expect(weight(dark.selectors[0])).toBeGreaterThan(weight(light.selectors[0]))
  })

  // WCAG 1.4.11: a control's edge at 3:1 at least against its ground.
  it('stands at 3:1 or more against white', () => {
    const tokens = readFileSync(join(SCSS, '_design-tokens.scss'), 'utf8')
    const hex = tokens.match(/--text-muted:\s*#([0-9a-f]{6})/i)[1]
    const channel = (at) => {
      const value = parseInt(hex.slice(at, at + 2), 16) / 255
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    }
    const luminance = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4)

    expect((1 + 0.05) / (luminance + 0.05)).toBeGreaterThanOrEqual(3)
  })
})
