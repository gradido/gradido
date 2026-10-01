// AI-GENERATED — not an architecture reference
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

/**
 * The menus that open over a conversation -- the paperclip's and the one at a chat message --
 * stand on a grey of their own (Bernd, 01.10.2026, E-061): on the window's surface they were its
 * own colour, 1 : 1, and easily overlooked, light and dark. He chose the grey from five drafts
 * photographed in the wallet (C, "Grau, kräftiger").
 *
 * What the choice asks of the numbers, held here because no component test sees a colour: the
 * menu a clear step away from the window and from the bubbles, and what stands on it readable --
 * the words at 4.5 : 1, the signs at 3 : 1, on the menu and on the entry under the pointer.
 */
const here = dirname(fileURLToPath(import.meta.url))
const read = (path) => readFileSync(resolve(here, path), 'utf8')
const LIGHT = read('./assets/scss/_design-tokens.scss')
const DARK = read('./assets/scss/gradido-template-dark.scss')
const COMPOSE = read('./components/Chat/ChatComposeBar.vue')
const MESSAGE = read('./components/Chat/ChatMessageMenu.vue')

const token = (sheet, name) =>
  sheet.match(new RegExp(`\\n\\s*--${name}:\\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})\\s*;`))?.[1]
const full = (hex) =>
  hex.length === 4 ? `#${[...hex.slice(1)].map((digit) => digit + digit).join('')}` : hex
const luminance = (hex) =>
  [1, 3, 5]
    .map((i) => parseInt(full(hex).slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0)
const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

describe.each([
  // The words of an entry take the body colour: `--text` in the dark, Bootstrap's in the light.
  ['light', LIGHT, '#dde1e6', 1.25, '#383838'],
  ['dark', DARK, '#50545b', 1.5, null],
])('the menus over a conversation, %s', (mode, sheet, chosen, step, words) => {
  const menu = token(sheet, 'menu-surface')
  const hover = token(sheet, 'menu-hover')

  it('stand on the grey Bernd chose', () => {
    expect(menu).toBe(chosen)
  })

  it('are a clear step away from the window and from the bubbles', () => {
    expect(contrast(menu, token(sheet, 'surface'))).toBeGreaterThanOrEqual(step)
    expect(contrast(menu, token(sheet, 'surface-muted'))).toBeGreaterThanOrEqual(1.15)
  })

  it('show the entry under the pointer, on a tone of its own', () => {
    expect(hover).toBeTruthy()
    expect(contrast(hover, menu)).toBeGreaterThanOrEqual(1.1)
  })

  it.each([
    ['the quiet line under an entry', 'menu-text-muted', 4.5],
    ['the sign of an entry', 'menu-icon', 3],
  ])('keep %s readable, on the menu and under the pointer', (_what, name, least) => {
    const ink = token(sheet, name)
    expect(ink, `--${name} is gone from the ${mode} stylesheet`).toBeTruthy()
    expect(contrast(ink, menu)).toBeGreaterThanOrEqual(least)
    expect(contrast(ink, hover)).toBeGreaterThanOrEqual(least)
  })

  it('keep the words of an entry readable', () => {
    const ink = words ?? token(sheet, 'text')
    expect(contrast(ink, menu)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(ink, hover)).toBeGreaterThanOrEqual(4.5)
  })

  it('carry a rim that shows against the window', () => {
    expect(contrast(token(sheet, 'menu-border'), token(sheet, 'surface'))).toBeGreaterThanOrEqual(
      1.9,
    )
  })
})

describe('the two menus', () => {
  /** The declarations of the rule for exactly this selector. */
  const ruleOf = (source, selector) => {
    const styles = source
      .slice(source.indexOf('>', source.indexOf('<style')) + 1)
      .replace(/\/\*[\s\S]*?\*\//g, '')
    return [...styles.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter((m) => m[1].split(',').some((part) => part.trim() === selector))
      .map((m) => m[2])
      .join('\n')
  }

  it.each([
    ["the paperclip's", COMPOSE, 'chat-compose-menu'],
    ['the one at a message', MESSAGE, 'chat-message-menu'],
  ])('take all of it from the tokens: %s', (_which, source, name) => {
    expect(ruleOf(source, `.${name}`)).toMatch(/background:\s*var\(--menu-surface,/)
    expect(ruleOf(source, `.${name}`)).toMatch(/border:\s*1px solid var\(--menu-border,/)
    expect(ruleOf(source, `.${name}-item:hover`)).toMatch(/background:\s*var\(--menu-hover,/)
    expect(ruleOf(source, `.${name}-icon`)).toMatch(/color:\s*var\(--menu-icon,/)
    expect(ruleOf(source, `.${name}-hint`)).toMatch(/color:\s*var\(--menu-text-muted,/)
  })
})
