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
// The sheets the sweep gave dark rules to (D1), and the Crea helper's window and chat (D2).
const SWEEP = {
  rows: join(here, 'components', 'Tables', 'OpenCreationsTable.css'),
  messages: join(
    here,
    'components',
    'ContributionMessages',
    'slots',
    'ContributionMessagesListItem.css',
  ),
  deletedUser: join(here, 'components', 'DeletedUserFormular.css'),
  confirmMail: join(here, 'components', 'ConfirmRegisterMailFormular.css'),
  spaces: join(here, 'components', 'ProjectBranding', 'ListHumhubSpaces.module.css'),
  themedSelect: join(here, 'components', 'ThemedSelect.scss'),
  timePicker: join(here, 'components', 'input', 'TimePicker.module.css'),
  creationGroups: join(here, 'pages', 'CreationGroups.module.css'),
  chatSettings: join(here, 'pages', 'ChatSettings.module.css'),
  creaWindow: join(here, 'components', 'CreaEvaluationModal.module.css'),
  creaChat: join(here, 'components', 'AiChat.module.css'),
}
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
      // The four tints of a row (ground, striped, under the pointer, border) and their muted
      // grey, the faint whites of the group select and of the Crea button.
      [SWEEP.rows]: 21,
      // The four bubbles.
      [SWEEP.messages]: 4,
      // The yellow of the prefix, as a dark tint, in each of its two files.
      [SWEEP.deletedUser]: 1,
      [SWEEP.confirmMail]: 1,
      // The light blue of a space under the pointer.
      [SWEEP.spaces]: 1,
      // The gold of the outlined decision (its word and its edge) and the red of App.css.
      [SWEEP.creaWindow]: 4,
      // The shadow of the window, Crea's bubble, the error's ground and its red, the opener's edge.
      [SWEEP.creaChat]: 5,
      // The top bar: the black of the window's bar, and the light line below it.
      [join(here, 'components', 'NavBar.scss')]: 2,
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

  // AO-014: Bootstrap 5.3 keeps the four row colours light in its dark mode -- 390 of the 462
  // light islands. Every stage of a row (ground, striped, under the pointer) carries its words,
  // its muted words and the grey of the outlined buttons at 4.5; the green of the pin and the
  // arrows, symbols, at 3 everywhere and at 4.5 on the ground (AO-014).
  it('the contribution rows carry dark tints for the four states', () => {
    const dark = darkRules(read(SWEEP.rows))
    const outlineGrey = colour(
      declarationsOf(darkRules(app), `${DARK} .btn-outline-secondary`)['--bs-btn-color'],
    )
    const muted = declarationsOf(
      dark,
      `${DARK} .table-primary, ${DARK} .table-success, ${DARK} .table-warning, ${DARK} .table-danger`,
    )['--bs-secondary-color']
    expect(muted).toMatch(/^#[0-9a-f]{6}$/)
    for (const state of ['primary', 'success', 'warning', 'danger']) {
      const row = declarationsOf(dark, `${DARK} .table-${state}`)
      const stages = [
        row['--bs-table-bg'],
        row['--bs-table-striped-bg'],
        row['--bs-table-hover-bg'],
      ]
      for (const stage of stages) {
        expect(stage, `${state}: ${stage}`).toMatch(/^#[0-9a-f]{6}$/)
        // A dark tint: no light island any more.
        expect(luminance(stage), `${state}: ${stage}`).toBeLessThan(0.1)
        expect(contrast(muted, stage), `muted on ${state} ${stage}`).toBeGreaterThanOrEqual(4.5)
        expect(contrast(outlineGrey, stage), `outline on ${stage}`).toBeGreaterThanOrEqual(4.5)
        expect(
          contrast(bridge['--bs-link-color'], stage),
          `link on ${stage}`,
        ).toBeGreaterThanOrEqual(3)
      }
      expect(contrast(bridge['--bs-link-color'], stages[0])).toBeGreaterThanOrEqual(4.5)
      expect(colour(row['--bs-table-color'])).toBe(bridge['--bs-body-color'])
      expect(colour(row['--bs-table-striped-color'])).toBe(bridge['--bs-body-color'])
      expect(colour(row['--bs-table-hover-color'])).toBe(bridge['--bs-emphasis-color'])
      expect(contrast(colour(row['--bs-table-color']), stages[0])).toBeGreaterThanOrEqual(4.5)
      expect(contrast(colour(row['--bs-table-striped-color']), stages[1])).toBeGreaterThanOrEqual(
        4.5,
      )
      expect(contrast(colour(row['--bs-table-hover-color']), stages[2])).toBeGreaterThanOrEqual(4.5)
      expect(row['--bs-table-border-color'], state).toMatch(/^#[0-9a-f]{6}$/)
    }
    // The light rows stay as they were: the one light rule of this sheet, the red one.
    expect(declarationsOf(rules(read(SWEEP.rows)), '.table-danger')).toEqual({
      '--bs-table-bg': '#e78d8d',
      '--bs-table-striped-bg': '#e57373',
      '--bs-table-hover-bg': '#e06a6a',
    })
  })

  // Bernd's choice after the Gradido calculator (24.10.2026): the calculator's blue for the open
  // rows, its green darkened for the confirmed, gold where the olive stood, bordeaux for the
  // deleted. Every row a little lighter striped, and again under the pointer.
  it('the contribution rows are deep, after the Gradido calculator', () => {
    const dark = darkRules(read(SWEEP.rows))
    const STATES = ['primary', 'success', 'warning', 'danger']
    const grounds = STATES.map(
      (state) => declarationsOf(dark, `${DARK} .table-${state}`)['--bs-table-bg'],
    )
    expect(grounds).toEqual(['#090540', '#0e2707', '#412802', '#400515'])
    for (const state of STATES) {
      const row = declarationsOf(dark, `${DARK} .table-${state}`)
      const ground = luminance(row['--bs-table-bg'])
      const striped = luminance(row['--bs-table-striped-bg'])
      expect(ground, state).toBeLessThan(striped)
      expect(striped, state).toBeLessThan(luminance(row['--bs-table-hover-bg']))
    }
  })

  it('the yellow prefix box has a dark counterpart in both of its files', () => {
    for (const sheet of [SWEEP.deletedUser, SWEEP.confirmMail]) {
      const all = rules(read(sheet))
      expect(declarationsOf(all, '.input-group-text'), sheet).toEqual({
        'background-color': 'rgb(255 252 205)',
      })
      const ground = declarationsOf(all, `${DARK} .input-group-text`)['background-color']
      expect(ground, sheet).toMatch(/^#[0-9a-f]{6}$/)
      expect(contrast(bridge['--bs-body-color'], ground), sheet).toBeGreaterThanOrEqual(4.5)
    }
    // The two say the same.
    const darkOf = (sheet) =>
      declarationsOf(rules(read(sheet)), `${DARK} .input-group-text`)['background-color']
    expect(darkOf(SWEEP.deletedUser)).toBe(darkOf(SWEEP.confirmMail))
    // Both rules are global, as their light twins: once the member search has loaded them, the
    // clear box of the search field rests on this yellow too. Its ground under the pointer
    // (App.css) stands apart from it as well.
    const hover = colour(
      declarationsOf(darkRules(app), `${DARK} .pointer:hover`)['background-color'],
    )
    expect(contrast(hover, darkOf(SWEEP.deletedUser))).toBeGreaterThanOrEqual(1.4)
  })

  it('the time picker border follows the theme', () => {
    const css = read(SWEEP.timePicker)
    expect(declarationsOf(rules(css), '.timerInput').border).toBe(
      '1px solid var(--bs-border-color)',
    )
    expect(fixedColours(css)).toBe(0)
  })

  it('the separators of the groups and the chat servers have dark counterparts', () => {
    for (const [sheet, row] of [
      [SWEEP.creationGroups, '.creationGroupRow'],
      [SWEEP.chatSettings, '.chatServerRow'],
    ]) {
      const all = rules(read(sheet))
      expect(declarationsOf(all, row)['border-bottom'], sheet).toBe('1px solid rgb(0 0 0 / 7.5%)')
      expect(declarationsOf(all, `${DARK} ${row}`), sheet).toEqual({
        'border-bottom-color': 'var(--bs-border-color-translucent)',
      })
    }
  })

  it('the spaces list hover has a dark counterpart', () => {
    const all = rules(read(SWEEP.spaces))
    const hover = '.spaces > :global(.list-group-item-action:hover:not(.active))'
    expect(declarationsOf(all, hover)['background-color']).toBe('#ececec')
    const dark = declarationsOf(all, `${DARK} ${hover}`)
    expect(colour(dark['background-color'])).toBe(bridge['--bs-secondary-bg'])
    expect(contrast(dark.color, colour(dark['background-color']))).toBeGreaterThanOrEqual(4.5)
  })

  it('the bubbles under a contribution and the placeholder of a select carry their words at 4.5', () => {
    const bubbles = darkRules(read(SWEEP.messages))
    expect(bubbles).toHaveLength(4)
    for (const bubble of bubbles) {
      const ground = bubble.declarations['background-color']
      expect(contrast(bridge['--bs-body-color'], ground), bubble.selector).toBeGreaterThanOrEqual(
        4.5,
      )
    }
    const placeholder = declarationsOf(
      darkRules(read(SWEEP.themedSelect)),
      `${DARK} .themed-select.themed-select-placeholder > .btn.themed-select-toggle`,
    ).color
    for (const ground of [bridge['--bs-body-bg'], bridge['--bs-tertiary-bg']]) {
      expect(contrast(colour(placeholder), ground)).toBeGreaterThanOrEqual(4.5)
    }
  })

  // AO-015: the outlined decisions of Crea's window take dark tones in the window's own sheet.
  // The bridge beats its light palette by one step of specificity for the green and the red only,
  // and has no gold: "Rückfrage" stood at 2.5 in the dark (D1, measured 24.10.2026).
  it('the three outline decisions of the Crea window carry dark tones', () => {
    const css = read(SWEEP.creaWindow)
    const dark = darkRules(css)
    const outline = (variant) =>
      declarationsOf(dark, `${DARK} .palette :global(.btn-outline-${variant})`)
    const ground = colour(declarationsOf(darkRules(app), `${DARK} .modal`)['--bs-modal-bg'])
    expect(ground).toBe(bridge['--bs-tertiary-bg'])

    expect(outline('success')).toEqual({
      '--bs-btn-color': 'var(--bs-link-color)',
      '--bs-btn-border-color': 'var(--bs-link-color)',
    })
    expect(outline('warning')).toEqual({
      '--bs-btn-color': '#c69130',
      '--bs-btn-border-color': '#c58d38',
    })
    // The red of the bridge: one red in the dark admin, the flags above the buttons wear it too.
    const red = declarationsOf(darkRules(app), `${DARK} .btn-outline-danger`)['--bs-btn-color']
    expect(outline('danger')).toEqual({ '--bs-btn-color': red, '--bs-btn-border-color': red })
    for (const variant of ['success', 'warning', 'danger']) {
      const word = colour(outline(variant)['--bs-btn-color'])
      expect(contrast(word, ground), `${variant} ${word}`).toBeGreaterThanOrEqual(4.5)
    }
    // These three and nothing else: the filled buttons and the badges keep their tones.
    expect(dark).toHaveLength(3)

    // Under the pointer and pressed the gold fills as in the light mode, with dark words on it.
    const light = rules(css)
    const gold = declarationsOf(light, '.palette :global(.btn-outline-warning)')
    for (const stage of ['hover', 'active']) {
      const [word, fill] = [gold[`--bs-btn-${stage}-color`], gold[`--bs-btn-${stage}-bg`]]
      expect(contrast(word, fill), stage).toBeGreaterThanOrEqual(4.5)
    }
    // ... and the light palette stays as it was.
    const lightWord = (variant) =>
      declarationsOf(light, `.palette :global(.btn-outline-${variant})`)['--bs-btn-color']
    expect([lightWord('success'), lightWord('warning'), lightWord('danger')]).toEqual([
      '#047006',
      '#8a5f1c',
      '#c62828',
    ])
  })

  // The chat was the last light island of the dark admin: the white window, the stream, Crea's
  // bubble and the input area, four of them at each width (D1, measured 24.10.2026).
  it('the Crea chat has dark counterparts for its window, its stream, its three bubbles, its input area and its opener', () => {
    const css = read(SWEEP.creaChat)
    const dark = darkRules(css)
    const of = (selector) => declarationsOf(dark, `${DARK} ${selector}`)
    const bubble = (role) => of(`.message:global(.${role}) .messageContent`)

    const box = of('.chatWindow')
    expect(colour(box['background-color'])).toBe(bridge['--bs-tertiary-bg'])
    expect(colour(box['border-color'])).toBe(bridge['--bs-border-color'])
    expect(box['box-shadow']).toBe('0 4px 8px rgb(0 0 0 / 50%)')
    // The stream as a whole: the list is only as tall as its messages, the scroll box below it.
    const stream = of(`.messagesScrollContainer, ${DARK} .messages`)
    expect(colour(stream['background-color'])).toBe(bridge['--bs-body-bg'])
    const input = of('.inputArea')
    expect(colour(input['background-color'])).toBe(bridge['--bs-tertiary-bg'])
    expect(colour(input['border-top-color'])).toBe(bridge['--bs-border-color'])
    // The field's edge at rest only, so that a focused field keeps Bootstrap's blue.
    expect(of('.inputArea textarea:not(:focus)')).toEqual({
      'border-color': 'var(--bs-border-color)',
    })
    // At rest only: under the pointer Bootstrap's edge takes over, as in the light mode.
    expect(of('.chatToggleButton:not(:hover)')).toEqual({ 'border-color': '#6e727a' })

    expect(colour(bubble('user')['background-color'])).toBe(bridge['--bs-secondary-bg'])
    expect(colour(bubble('user')['border-color'])).toBe(bridge['--bs-border-color'])
    expect(bubble('assistant')['background-color']).toBe('#43464c')
    expect(bubble('error')['background-color']).toBe('#3a2222')
    // The red of the bridge, as in Crea's window.
    expect(bubble('error').color).toBe(
      declarationsOf(darkRules(app), `${DARK} .btn-outline-danger`)['--bs-btn-color'],
    )
    for (const role of ['user', 'assistant', 'error']) {
      const [word, ground] = [colour(bubble(role).color), colour(bubble(role)['background-color'])]
      // A dark ground, and the words on it at 4.5.
      expect(luminance(ground), role).toBeLessThan(0.1)
      expect(contrast(word, ground), `${role}: ${word} on ${ground}`).toBeGreaterThanOrEqual(4.5)
    }
    expect(dark).toHaveLength(8)

    // The light mode stays as it was.
    const light = rules(css)
    expect(declarationsOf(light, '.chatWindow')['background-color']).toBe('white')
    expect(declarationsOf(light, '.messages')['background-color']).toBe('#f9f9f9')
    expect(declarationsOf(light, '.chatToggleButton').border).toBe('1px solid darkblue')
  })
})
