// AI-GENERATED — not an architecture reference
// @vitest-environment node
// Node, not jsdom: sass and the SFC compiler run here, and jsdom's URL class is one node rejects.
import { describe, it, expect } from 'vitest'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { compile } from 'sass'
import { parse, compileStyle } from 'vue/compiler-sfc'

/**
 * An expired link fades in dark mode only if the dark stylesheet's rule outweighs the
 * component's own. Both rules say `!important`, and the component's scoped rule comes out
 * of the build as `.light-gray-text[data-v-…]` (0,2,0) in a route chunk that loads AFTER
 * the index stylesheet, so a dark rule of the same weight loses the tie. It did: the rule
 * read `.dark-mode .light-gray-text`, also 0,2,0, and measured in a built wallet the expired
 * rows stayed rgb(173, 181, 189) in dark mode instead of rgb(107, 108, 111).
 *
 * jsdom runs no cascade, so both rules are compiled the way the build compiles them (sass
 * for the stylesheet, the SFC compiler for the scoped block) and weighed against each other.
 */
const here = dirname(fileURLToPath(import.meta.url))
const DARK = resolve(here, '../../assets/scss/gradido-template-dark.scss')
const COMPONENT = resolve(here, 'TransactionLink.vue')

// Loud comments survive both compilers. A rule quoted in one is not a rule.
const withoutComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')

const darkCss = () => withoutComments(compile(DARK).css)

const componentCss = () => {
  const { descriptor } = parse(readFileSync(COMPONENT, 'utf8'), { filename: COMPONENT })
  const block = descriptor.styles.find((style) => style.scoped)
  const result = compileStyle({
    source: block.content,
    filename: COMPONENT,
    id: 'data-v-probe',
    scoped: true,
    preprocessLang: block.lang,
  })
  expect(result.errors).toEqual([])
  return withoutComments(result.code)
}

/** Every rule whose selector ends in the class, with its colour and whether it is !important. */
const colourRules = (css, className) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap(([, selectors, body]) =>
    selectors
      .split(',')
      .map((selector) => selector.trim())
      .filter((selector) => new RegExp(`\\.${className}(?![\\w-])[^\\s>+~]*$`).test(selector))
      .map((selector) => {
        const value = body.match(/(?:^|[\s;])color\s*:\s*([^;]+)/)[1].trim()
        return {
          selector,
          important: /!important$/.test(value),
          colour: value.replace(/\s*!important$/, ''),
        }
      }),
  )

/**
 * Specificity (ids, classes, types) of a plain selector. The functional pseudo-classes and
 * pseudo-elements do not weigh what a simple count says, so they are refused, not guessed.
 */
const specificity = (selector) => {
  if (/::|:(not|is|where|has|nth-[\w-]+)\(/.test(selector)) {
    throw new Error(`weigh this selector by hand: ${selector}`)
  }
  const plain = selector.replace(/\[[^\]]*\]/g, '[]')
  return [
    (plain.match(/#[\w-]+/g) || []).length,
    (plain.match(/\.[\w-]+|\[\]|:[\w-]+/g) || []).length,
    (plain.match(/(?:^|[\s>+~])[a-z][\w-]*/gi) || []).length,
  ]
}

/** Whether `rule` wins against `later`, a rule that comes after it in the page. */
const outweighs = (rule, later) => {
  if (rule.important !== later.important) return rule.important
  const [a, b] = [specificity(rule.selector), specificity(later.selector)]
  const differs = a.findIndex((weight, i) => weight !== b[i])
  return differs !== -1 && a[differs] > b[differs]
}

describe('TransactionLink in dark mode', () => {
  it('reads exactly one rule on each side, the scoped one as the build writes it', () => {
    const own = colourRules(componentCss(), 'light-gray-text')
    const dark = colourRules(darkCss(), 'light-gray-text')

    expect(own).toHaveLength(1)
    expect(own[0].selector).toBe('.light-gray-text[data-v-probe]')
    expect(dark).toHaveLength(1)
  })

  it('weighs a tie as lost, so the old form of the dark rule would fail here', () => {
    const [own] = colourRules(componentCss(), 'light-gray-text')
    const before = { selector: '.dark-mode .light-gray-text', important: true, colour: '#6b6c6f' }

    expect(specificity(before.selector)).toEqual(specificity(own.selector))
    expect(outweighs(before, own)).toBe(false)
  })

  it('outweighs the component, whatever the order the stylesheets load in', () => {
    const [own] = colourRules(componentCss(), 'light-gray-text')
    const [dark] = colourRules(darkCss(), 'light-gray-text')

    expect(
      outweighs(dark, own),
      `${dark.selector} must outweigh ${own.selector}, which loads after it`,
    ).toBe(true)
  })

  it('fades expired links to the grey chosen for dark mode', () => {
    // Bernd, 22.09.2026, at a picture: this grey, over keeping #adb5bd and over --text-muted.
    const [dark] = colourRules(darkCss(), 'light-gray-text')

    expect(dark.colour).toBe('#6b6c6f')
  })
})
