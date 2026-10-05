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
const LINK = read('./components/TransactionLinks/TransactionLink.vue')
const LANGUAGE = read('./components/LanguageSwitch2.vue')

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

/**
 * E-060: the pencil of the strip over the field, while a message is being changed, is drawn in
 * the gold of the menus' signs -- on the strip's own ground (`--surface-muted`), where the house
 * gold falls short of the 3 : 1 a sign needs in the light mode.
 */
describe.each([
  ['light', LIGHT],
  ['dark', DARK],
])('the pencil of the strip over the field, %s', (_mode, sheet) => {
  it('is made out on the strip’s ground', () => {
    expect(
      contrast(token(sheet, 'menu-icon'), token(sheet, 'surface-muted')),
    ).toBeGreaterThanOrEqual(3)
  })
})

describe('the strip over the field', () => {
  const styles = COMPOSE.slice(COMPOSE.indexOf('>', COMPOSE.indexOf('<style')) + 1).replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  )
  const rule = (selector) =>
    styles.match(new RegExp(`\\n\\${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

  it('draws its pencil in the menus’ gold, on the ground the measure is taken on', () => {
    expect(rule('.chat-compose-editing-icon')).toMatch(/color:\s*var\(--menu-icon,/)
    expect(rule('.chat-compose-editing')).toMatch(/background:\s*var\(--surface-muted,/)
  })

  // Gegenprobe: the house gold would not do in the light mode -- which is why it is not taken.
  it('would not do with the house gold in the light mode', () => {
    expect(contrast('#c58d38', token(LIGHT, 'surface-muted'))).toBeLessThan(3)
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

/**
 * Two menus more stand on the same grey (Bernd, 05.10.2026): the one at a link, in the list of
 * links, and the list of languages, in the settings and on the sign-in pages. Their words are
 * the wallet's text colour of the light mode, a blue-grey -- measured in the built wallet at
 * 4.84 : 1 on the grey and 5.57 : 1 under the pointer; in the dark they take `--text`.
 */
describe('the menu at a link and the list of languages', () => {
  const withoutComments = (text) =>
    text.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
  /** Every style block of the file, scoped or not, without its comments. */
  const stylesOf = (source) =>
    withoutComments(
      [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n'),
    )
  const ruleOf = (source, selector) =>
    [...stylesOf(source).matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter((m) => m[1].split(',').some((part) => part.trim() === selector))
      .map((m) => m[2])
      .join('\n')
  const darkCode = DARK.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

  it('reads code, not notes', () => {
    expect(stylesOf(LINK)).toContain('.transaction-link-menu')
    expect(stylesOf(LINK)).not.toContain('Bernd')
    expect(DARK).toContain('LanguageSwitch2')
    expect(darkCode).not.toContain('LanguageSwitch2')
  })

  /**
   * ⛔ One class more than the dark stylesheet's `.dark-mode .dropdown-menu`, which says
   * `!important` too, and than its `.dark-mode .dropdown-item:hover`: with the same weight the
   * order the stylesheets load in would decide.
   */
  it('puts the menu at a link on the tokens, outweighing the dark stylesheet', () => {
    const menu = ruleOf(LINK, '.transaction-link .dropdown-menu.transaction-link-menu')
    expect(menu).toMatch(/background-color:\s*var\(--menu-surface,[^)]*\)\s*!important/)
    expect(menu).toMatch(/border:\s*1px solid var\(--menu-border,/)
    for (const state of ['hover', 'focus']) {
      expect(
        ruleOf(LINK, `.transaction-link .transaction-link-menu .dropdown-item:${state}`),
      ).toMatch(/background-color:\s*var\(--menu-hover,/)
    }
    expect(darkCode).toMatch(/\.dark-mode\s*\{[^}]*\.dropdown-menu,/)
    expect(darkCode).toMatch(/\n\.dark-mode \.dropdown-item:hover,/)
  })

  it('puts the list of languages on the tokens', () => {
    expect(ruleOf(LANGUAGE, '.ls-menu')).toMatch(/background:\s*var\(--menu-surface,/)
    expect(ruleOf(LANGUAGE, '.ls-menu')).toMatch(/border:\s*1px solid var\(--menu-border,/)
    expect(ruleOf(LANGUAGE, '.ls-item:hover')).toMatch(/background:\s*var\(--menu-hover,/)
    expect(ruleOf(LANGUAGE, '.ls-item-active')).toMatch(/background:\s*var\(--menu-hover,/)
  })

  /**
   * The dark stylesheet used to paint this list itself (`#app.dark-mode .ls-menu`), and with
   * an id in its selector it would beat the tokens: the list would be the window's own colour
   * again in the dark.
   */
  it('leaves the dark stylesheet nothing to say about the list but the chosen language', () => {
    expect(darkCode).not.toMatch(/\.ls-menu/)
    expect(darkCode).not.toMatch(/\.ls-item:hover/)
    const chosen = darkCode.match(/#app\.dark-mode \.ls-item-active\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(chosen).toMatch(/color:\s*var\(--text\)/)
    expect(chosen).not.toMatch(/background/)
  })

  it.each([
    ['light', LIGHT, '#185fa5'],
    ['dark', DARK, null],
  ])('keeps the chosen language readable on the tone it stands on, %s', (_mode, sheet, ink) => {
    expect(
      contrast(ink ?? token(sheet, 'text'), token(sheet, 'menu-hover')),
    ).toBeGreaterThanOrEqual(4.5)
  })

  // Gegenprobe: what the chosen language wore in the dark before would not do on the grey.
  it('would not do with the link green in the dark', () => {
    expect(contrast(token(DARK, 'link'), token(DARK, 'menu-surface'))).toBeLessThan(4.5)
    expect(contrast(token(DARK, 'link'), token(DARK, 'menu-hover'))).toBeLessThan(4.5)
  })

  /**
   * The room around the three dots is laid OVER the row and takes no place in it: the row is
   * one line at every width only as long as the menu's column stays as narrow as its button.
   */
  it('lays the room that opens the menu over the row', () => {
    const room = ruleOf(LINK, '.transaction-link-menu-reach')
    expect(room).toMatch(/position:\s*absolute/)
    expect(room).toMatch(/inset:\s*-0\.5rem -1rem -0\.25rem -1\.5rem/)
  })
})
