// AI-GENERATED — not an architecture reference
// @vitest-environment node
// Node, not jsdom: sass runs here, and jsdom's URL class is one node rejects. The two small
// documents below are built by hand instead.
import { describe, it, expect } from 'vitest'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { compile } from 'sass'
import { JSDOM } from 'jsdom'

/**
 * The "collapse" (up) arrow is `.text-black`, and bootstrap gives that class its colour with
 * `!important`. In dark mode the dark stylesheet has to win against it wherever the arrow
 * stands -- in a transaction row inside #app, and in the map's profile window, a modal that
 * is teleported to <body> and so stands OUTSIDE #app. The rule used to read
 * `#app.dark-mode .collapse-icon .text-black`: it never reached the modal, and the arrow
 * stayed black on the dark window.
 *
 * jsdom runs no cascade, so the dark stylesheet is compiled the way the build compiles it and
 * its rules are matched against the arrow in both places, then weighed against bootstrap's.
 */
const here = dirname(fileURLToPath(import.meta.url))
const DARK = resolve(here, '../../assets/scss/gradido-template-dark.scss')
const BOOTSTRAP = createRequire(import.meta.url).resolve('bootstrap/dist/css/bootstrap.css')

// Loud comments survive the compiler. A rule quoted in one is not a rule.
const withoutComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')

/** Every selector that sets a colour, with the value and whether it is !important. */
const colourRules = (css) =>
  [...withoutComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap(([, selectors, body]) => {
    const value = body.match(/(?:^|[\s;])color\s*:\s*([^;]+)/)?.[1].trim()
    if (!value) return []
    return selectors.split(',').map((selector) => ({
      selector: selector.trim(),
      important: /!important$/.test(value),
      colour: value.replace(/\s*!important$/, ''),
    }))
  })

/** Specificity (ids, classes, types) of a plain selector; anything fancier is refused. */
const specificity = (selector) => {
  if (/::|:(not|is|where|has|nth-[\w-]+)\(/.test(selector)) {
    throw new Error(`weigh this selector by hand: ${selector}`)
  }
  return [
    (selector.match(/#[\w-]+/g) || []).length,
    (selector.match(/\.[\w-]+|\[[^\]]*\]|:[\w-]+/g) || []).length,
    (selector.match(/(?:^|[\s>+~])[a-z][\w-]*/gi) || []).length,
  ]
}

const heavier = (a, b) => {
  const [x, y] = [specificity(a), specificity(b)]
  const differs = x.findIndex((weight, i) => weight !== y[i])
  return differs !== -1 && x[differs] > y[differs]
}

const ARROW = '<div class="collapse-icon"><svg class="text-black h1"></svg></div>'

// What App.vue builds in dark mode: the class on #app and on <body>.
const arrowIn = (html) =>
  new JSDOM(`<body class="dark-mode">${html}</body>`).window.document.querySelector('.text-black')

const places = {
  'a transaction row inside #app': `<div id="app" class="dark-mode"><div class="row">${ARROW}</div></div>`,
  'the profile window, a modal outside #app': `<div id="app" class="dark-mode"></div><div class="modal"><div class="modal-content"><button class="area-head">${ARROW}</button></div></div>`,
}

/**
 * The dark stylesheet's rules that reach this arrow. Only selectors that name the class are
 * asked: the sheet holds selectors jsdom's matcher cannot parse, and none of them is about it.
 */
const darkRulesFor = (arrow) =>
  colourRules(compile(DARK).css)
    .filter((rule) => /\.text-black(?![\w-])/.test(rule.selector))
    .filter((rule) => arrow.matches(rule.selector))

describe('CollapseIcon in dark mode', () => {
  it('stands against the bootstrap rule this test assumes', () => {
    const rule = colourRules(readFileSync(BOOTSTRAP, 'utf8')).filter(
      ({ selector }) => selector === '.text-black',
    )

    expect(rule).toHaveLength(1)
    expect(rule[0].important).toBe(true)
  })

  it('builds two different places, one of them outside #app', () => {
    expect(arrowIn(places['a transaction row inside #app']).closest('#app')).not.toBeNull()
    expect(arrowIn(places['the profile window, a modal outside #app']).closest('#app')).toBeNull()
  })

  it.each(Object.entries(places))('greys the up arrow in %s', (_, html) => {
    const rules = darkRulesFor(arrowIn(html))

    expect(rules, 'no dark rule reaches the arrow here').toHaveLength(1)
    expect(rules[0].colour).toBe('var(--text-muted)')
    expect(rules[0].important, 'bootstrap says !important, so this must too').toBe(true)
    expect(heavier(rules[0].selector, '.text-black')).toBe(true)
  })
})
