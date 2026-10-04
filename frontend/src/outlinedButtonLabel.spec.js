// AI-GENERATED — not an architecture reference
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

/**
 * The label of an outlined button ("Link kopieren", "Karte drucken", "E-Mail-Adresse ändern";
 * Bernd, 04.10.2026): it reads at 4.5:1 or more on its ground, in both themes.
 *
 * - Light: the wallet's own rule in `_buttons.scss` sets the colour, with `!important`. It was
 *   #4385b1, 4.02:1 on a white card.
 * - Dark: the dark stylesheet set `--bs-btn-color` alone (24.08.2026). That never reached the
 *   label -- a `color` with `!important` outranks whatever the variable says -- and the light
 *   mode's blue stood on the dark card at 3.48:1 until it was measured. The dark rule has to set
 *   `color` itself, and with `!important`.
 */
const here = dirname(fileURLToPath(import.meta.url))
const read = (path) => readFileSync(resolve(here, path), 'utf8')
const BUTTONS = read('./assets/scss/custom/gradido-custom/_buttons.scss')
const COLORS = read('./assets/scss/custom/gradido-custom/_color.scss')
const LIGHT = read('./assets/scss/gradido-template.scss')
const TOKENS = read('./assets/scss/_design-tokens.scss')
const DARK = read('./assets/scss/gradido-template-dark.scss')

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const luminance = (hex) =>
  rgb(hex)
    .map((value) => value / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0)
const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}
const darkToken = (name) =>
  DARK.match(new RegExp(`\\n\\s*--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`))?.[1]
const hex = (channels) =>
  `#${channels.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`
/** A colour with an alpha (#rrggbbaa) as it stands over an opaque ground. */
const over = (top, ground) => {
  const alpha = parseInt(top.slice(7, 9), 16) / 255
  return hex(rgb(top).map((c, i) => c * alpha + rgb(ground)[i] * (1 - alpha)))
}

describe('the label of an outlined button', () => {
  describe('in the light theme', () => {
    const rule = BUTTONS.match(/\n\.btn-outline-secondary\s*\{([^}]*)\}/)?.[1] ?? ''
    const label = rule.match(/color:\s*(#[0-9a-fA-F]{6})\s*!important/)?.[1]

    it('is the blue that was chosen, and outranks Bootstrap', () => {
      expect(label).toBe('#397196')
    })

    it('reads at 4.5:1 or more on a white card', () => {
      expect(contrast(label, '#ffffff')).toBeGreaterThanOrEqual(4.5)
    })

    // Bootstrap fills an outlined button with its own colour under the pointer and the focus:
    // $secondary, which is near-white in this template.
    it('reads at 4.5:1 or more on the ground the button takes under the pointer', () => {
      const secondary = COLORS.match(/\n\$secondary:\s*(#[0-9a-fA-F]{6})\s*;/)?.[1]
      expect(secondary, '$secondary is gone from _color.scss').toBeTruthy()
      expect(contrast(label, secondary)).toBeGreaterThanOrEqual(4.5)
    })

    // The greyest ground an outlined button stands on: the card of the sign-in pages
    // ("Weiter zur Registrierung"), a translucent grey over the page. This is the ground that
    // decided the blue -- #3b759c, enough on white, comes to 4.34:1 here.
    it('reads at 4.5:1 or more on the card of the sign-in pages', () => {
      const card = LIGHT.match(
        /\n\.gradido-custom-background\s*\{[^}]*background-color:\s*(#[0-9a-fA-F]{8})/,
      )?.[1]
      const page = TOKENS.match(/\n\s*--bg:\s*(#[0-9a-fA-F]{6})\s*;/)?.[1]
      expect(card, 'the card of the sign-in pages has another ground now').toBeTruthy()
      expect(page, '--bg is gone from the design tokens').toBeTruthy()
      const ground = over(card, page)
      expect(ground).toBe('#efefef')
      expect(contrast(label, ground)).toBeGreaterThanOrEqual(4.5)
      expect(contrast('#3b759c', ground)).toBeLessThan(4.5)
    })

    // The counter-sample: the blue it replaces fails the same measure.
    it('is not the blue that read at 4.02:1', () => {
      expect(contrast('#4385b1', '#ffffff')).toBeLessThan(4.5)
    })
  })

  describe('in the dark theme', () => {
    const rule = DARK.match(/\n\.dark-mode \.btn-outline-secondary\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
    // Without the comments: one of them quotes the light rule.
    const declarations = rule.replace(/\/\*[\s\S]*?\*\//g, '')

    it('sets the colour itself, and with !important: the variable alone never reached it', () => {
      expect(declarations).toMatch(/\n\s*color:\s*var\(--text\)\s*!important;/)
    })

    it.each(['surface', 'bg', 'surface-muted'])('reads at 4.5:1 or more on --%s', (ground) => {
      expect(darkToken('text'), '--text is gone from the dark stylesheet').toBeTruthy()
      expect(darkToken(ground), `--${ground} is gone from the dark stylesheet`).toBeTruthy()
      expect(contrast(darkToken('text'), darkToken(ground))).toBeGreaterThanOrEqual(4.5)
    })

    it('fills the button with the muted surface under the pointer, not with the light theme’s', () => {
      expect(declarations).toMatch(/--bs-btn-hover-bg:\s*var\(--surface-muted\);/)
    })

    // The counter-sample: what stood on the dark card until 04.10.2026.
    it('is not the light theme’s blue on the dark card', () => {
      expect(contrast('#4385b1', darkToken('surface'))).toBeLessThan(4.5)
      expect(contrast('#397196', darkToken('surface'))).toBeLessThan(4.5)
    })
  })
})
