// AI-GENERATED — not an architecture reference
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

/**
 * A contact the find map was asked to show stands first in the map's list, and all of their
 * block -- heading, name, community, place -- is in the gold of the ring the map draws around
 * them (Bernd, 10.10.2026), so that it stands apart from the people around them.
 *
 * What that asks of the numbers, held here because no component test sees a colour: gold that
 * can be read. The list follows the wallet's theme and the map does not, so there are two: the
 * ring's own on the dark surface, a darker one on the white surface, where the ring's comes to
 * 2.8 : 1. Each at 4.5 : 1, on the list's ground and on the line under the pointer -- and at
 * full strength, because the quieter parts of a line are thinned by opacity.
 */
const here = dirname(fileURLToPath(import.meta.url))
const read = (path) => readFileSync(resolve(here, path), 'utf8')
const LIGHT = read('./assets/scss/_design-tokens.scss')
const DARK = read('./assets/scss/gradido-template-dark.scss')
const LIST = read('./components/Matching/MatchList.vue')
const MAP = read('./pages/MatchingMap.vue')

// A token of a stylesheet, written out in six digits (`#fff` is the white surface).
const full = (hex) =>
  hex?.length === 4 ? `#${[...hex.slice(1)].map((digit) => digit + digit).join('')}` : hex
const token = (sheet, name) =>
  full(sheet.match(new RegExp(`\\n\\s*--${name}:\\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})\\s*;`))?.[1])
/** The declarations of one rule of a stylesheet, by its selector at the start of a line. */
const rule = (sheet, selector) =>
  sheet.match(
    new RegExp(`\\n${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^]*?)\\n\\}`),
  )?.[1]
const colourOf = (block) => block?.match(/\n\s*color:\s*(#[0-9a-fA-F]{6});/)?.[1]

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const luminance = (hex) =>
  channels(hex)
    .map((c) => c / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0)
const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}
/** A colour laid thinly over a ground, as the line under the pointer is. */
const over = ([r, g, b], share, ground) =>
  `#${channels(ground)
    .map((c, i) => Math.round([r, g, b][i] * share + c * (1 - share)))
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`

// The line under the pointer or the keyboard: `.row-match:hover, :focus-visible`.
const pointer = LIST.match(/background: rgb\((\d+) (\d+) (\d+) \/ (\d+)%\);/)
const underPointer = (ground) =>
  over(pointer.slice(1, 4).map(Number), Number(pointer[4]) / 100, ground)

const contactRule = rule(LIST, '.list-section-contact')
const darkRule = rule(LIST, '.dark-mode .list-section-contact')
const ringGold = MAP.match(/\.gk-shown-ring \{[^}]*?border: 3px solid (#[0-9a-fA-F]{6});/)?.[1]

describe("the gold of a shown contact in the find map's list", () => {
  it('is found where this spec looks for it', () => {
    expect(contactRule, 'the rule of the contact section').toBeTruthy()
    expect(darkRule, 'its rule in the dark').toBeTruthy()
    expect(pointer, 'the ground of a line under the pointer').toBeTruthy()
    expect(ringGold, 'the gold of the ring on the map').toBeTruthy()
  })

  it('is the gold of the ring on the map, where the list is dark', () => {
    expect(colourOf(darkRule)).toBe(ringGold)
  })

  it.each([
    ['light', LIGHT, () => colourOf(contactRule)],
    ['dark', DARK, () => colourOf(darkRule)],
  ])('can be read on the list and on the line under the pointer (%s)', (_mode, sheet, gold) => {
    const ground = token(sheet, 'surface')
    expect(ground).toBeTruthy()

    expect(contrast(gold(), ground)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(gold(), underPointer(ground))).toBeGreaterThanOrEqual(4.5)
  })

  // The control for the two golds: each is right for its own ground only.
  it('needs both: neither gold can be read on the other ground', () => {
    expect(contrast(colourOf(darkRule), token(LIGHT, 'surface'))).toBeLessThan(4.5)
    expect(contrast(colourOf(contactRule), token(DARK, 'surface'))).toBeLessThan(4.5)
  })

  // A heading is coloured by the wallet's rule for headings and inherits nothing: in the first
  // build "Dein Kontakt" stayed in the text colour, found by measuring the built wallet.
  it('is handed to the heading by name, which would not inherit it', () => {
    expect(contactRule).toMatch(/\n\s*\.section-head \{\s*color: inherit;\s*\}/)
  })

  // Heading, dot, community and place are thinned in every other line. Thinned gold falls
  // under 4.5 : 1 (the heading at 70 %: 3.2 : 1 dark, 3.0 : 1 light).
  it('stands at full strength in every part of the block', () => {
    const [, parts] = contactRule.match(/\n\s*((?:\.[\w-]+,?\s*)+)\{\s*opacity: 1;\s*\}/) ?? []

    expect(parts, 'the parts of the block that are set to full strength').toBeTruthy()
    for (const part of ['.section-head', '.row-sep', '.row-community', '.row-where']) {
      expect(parts).toContain(part)
    }
  })
})
