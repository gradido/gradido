// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/**
 * The eye inside a field, drawn by one set of rules for the password field and the thank-you
 * card's PIN (`assets/scss/_reveal-field.scss`). The PIN's eye began as a copy of the
 * password's; when the password's was fixed (#3948), the copy kept every fault. What the two
 * components hand these rules -- which classes, in which nesting -- is tested in their own
 * specs, against the selectors written here.
 *
 * jsdom lays nothing out, so this reads the stylesheets, with the comments stripped first:
 * the files explain their rules in prose, and a search over the raw text would find its own
 * explanation and stay green.
 *
 * ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class and node rejects
 * an instance of it as coming from another realm.
 */
const here = dirname(fileURLToPath(import.meta.url))
const source = (...path) => readFileSync(join(here, ...path), 'utf8')
// Block comments, and SCSS line comments where they start a line or follow a space -- a URL's
// `//` follows a colon or a bracket and stays.
const live = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '$1')

/** The declarations of the rule written for exactly `selector`, or null. */
const rule = (css, selector) => {
  for (const [, written, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    // A variable set just before the rule ends in `;` and is not part of its selector.
    if (written.split(';').pop().trim() === selector) return body.replace(/\s+/g, ' ').trim()
  }
  return null
}

describe('the eye inside a field', () => {
  const css = live(source('assets', 'scss', '_reveal-field.scss'))
  const eye = rule(css, '.reveal-field > .reveal-eye')

  it('finds the rules it is about to measure', () => {
    // The fixture proves itself: without it every assertion below would describe nothing.
    expect(eye).not.toBeNull()
    expect(rule(css, '.reveal-field')).not.toBeNull()
  })

  it('stands over the right end of the field, a finger wide and the field full height', () => {
    expect(eye).toMatch(/position: absolute;/)
    expect(eye).toMatch(/top: 0;/)
    expect(eye).toMatch(/right: 0;/)
    expect(eye).toMatch(/bottom: 0;/)
    expect(eye).toMatch(/width: var\(--reveal-eye\);/)
    expect(rule(css, '.reveal-field')).toMatch(/--reveal-eye: 3rem;.*position: relative;/)
  })

  // The box beside the input drew no frame and a dark shadow; inside, the input's frame is
  // the only one.
  it('draws no frame, ground or shadow of its own', () => {
    expect(eye).toMatch(/border: 0;/)
    expect(eye).toMatch(/background: transparent;/)
    expect(eye).toMatch(/box-shadow: none;/)
  })

  it('keeps the typed text clear of it', () => {
    expect(rule(css, '.reveal-field > .form-control')).toMatch(
      /padding-right: var\(--reveal-eye\);/,
    )
  })

  // Its corners carry the focus ring, so they are the field's own, from one value.
  it('takes the corners of the rounded field', () => {
    expect(eye).toMatch(/border-radius: 0 \$rounded-input-radius \$rounded-input-radius 0;/)
    const template = live(source('assets', 'scss', 'gradido-template.scss'))
    expect(rule(template, 'input.rounded-input')).toBe('border-radius: $rounded-input-radius;')
  })

  it('shows where the focus is when the keyboard lands on it, inside the field', () => {
    const focus = rule(css, '.reveal-field > .reveal-eye:focus-visible')
    expect(focus).toMatch(/outline: 2px solid/)
    expect(focus).toMatch(/outline-offset: -\d+px;/)
  })

  // A tie with `.btn:hover` or `.btn:focus-visible` goes to the rule that comes later.
  it('comes after Bootstrap, so that the button states do not win the ties', () => {
    const main = live(source('assets', 'scss', 'gradido.scss'))
    const bootstrap = main.indexOf('@import "bootstrap/scss/bootstrap";')
    const own = main.indexOf('@import "reveal-field";')
    expect(bootstrap).toBeGreaterThan(-1)
    expect(own).toBeGreaterThan(bootstrap)
  })
})
