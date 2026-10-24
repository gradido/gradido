// AI-GENERATED — not an architecture reference

import { readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PHONE_BREAKPOINT_PX } from '@/constants'

/**
 * The phone rules of the contribution page and the member search, read from the stylesheets.
 *
 * Vitest hands every stylesheet to the tests as an empty string, and jsdom lays nothing out:
 * no test can see a rule work. So the rules are read where they are written. Comments come out
 * first -- every file here explains its rules in prose, and a search over the raw text would
 * find the explanation of a rule that is gone.
 *
 * ⛔ Every phone rule stands under `(width < 992px)` and nowhere else: one boundary, the one
 * where the tables stack and the top bar folds up (composables/useViewport.ts, AO-010). And no stylesheet of the delivery holds
 * a fixed colour more than it did before it -- a dark mode comes through `data-bs-theme` later,
 * and every colour written by hand would have to be done again (AO-008).
 */
const here = dirname(fileURLToPath(import.meta.url))
const STYLES = {
  app: join(here, 'App.css'),
  page: join(here, 'pages', 'CreationConfirm.css'),
  table: join(here, 'components', 'Tables', 'OpenCreationsTable.css'),
  messages: join(
    here,
    'components',
    'ContributionMessages',
    'slots',
    'ContributionMessagesListItem.css',
  ),
  // The member search (S2)
  memberTable: join(here, 'components', 'Tables', 'SearchUserTable.css'),
  creationForm: join(here, 'components', 'CreationFormular.module.css'),
  mailForm: join(here, 'components', 'ConfirmRegisterMailFormular.css'),
  walletLink: join(here, 'components', 'MemberWalletLink.module.css'),
  // The Crea helpers of the moderation (S3)
  creaWindow: join(here, 'components', 'CreaEvaluationModal.module.css'),
  creaChat: join(here, 'components', 'AiChat.module.css'),
  // The remaining pages (S3)
  creationGroups: join(here, 'pages', 'CreationGroups.module.css'),
}
// The role form has no phone block: its one rule holds on every width.
const ROLE_FORM = join(here, 'components', 'ChangeUserRoleFormular.css')
// Upper bounds, counted on 23.10.2026 before the delivery (CreationConfirm.css had one: the
// backdrop of the overlay the dialog replaced). NavBar.scss is not touched by it; it is held
// here because the dark mode will meet it first. The yellow of ConfirmRegisterMailFormular.css
// is its own, from before; it goes with the dark mode.
const FIXED_COLOURS_AT_MOST = {
  [STYLES.table]: 9,
  [STYLES.page]: 0,
  [STYLES.app]: 1,
  [STYLES.messages]: 4,
  [join(here, 'components', 'NavBar.scss')]: 3,
  [STYLES.memberTable]: 0,
  [STYLES.creationForm]: 0,
  [STYLES.mailForm]: 1,
  [STYLES.walletLink]: 0,
  [ROLE_FORM]: 0,
  // Counted on 23.10.2026 before S3, as this spec counts, without the comments (the window's
  // comment names three of its colours once more): the Crea palette of the window, and the
  // chat's greys and the red of an error. Both go with the dark mode.
  [STYLES.creaWindow]: 52,
  [STYLES.creaChat]: 9,
  // The line below a row of the creation groups.
  [STYLES.creationGroups]: 1,
}

// Who loads each stylesheet. A sheet that nobody imports holds its rules for no page, and the
// tests here would not notice: they read the sheets, not the components.
const LOADED_BY = {
  [STYLES.app]: join(here, 'App.tsx'),
  [STYLES.page]: join(here, 'pages', 'CreationConfirm.tsx'),
  [STYLES.table]: join(here, 'components', 'Tables', 'OpenCreationsTable.tsx'),
  [STYLES.messages]: join(
    here,
    'components',
    'ContributionMessages',
    'slots',
    'ContributionMessagesListItem.tsx',
  ),
  [STYLES.memberTable]: join(here, 'components', 'Tables', 'SearchUserTable.tsx'),
  [STYLES.creationForm]: join(here, 'components', 'CreationFormular.tsx'),
  [STYLES.mailForm]: join(here, 'components', 'ConfirmRegisterMailFormular.tsx'),
  [STYLES.walletLink]: join(here, 'components', 'MemberWalletLink.tsx'),
  [ROLE_FORM]: join(here, 'components', 'ChangeUserRoleFormular.tsx'),
  [STYLES.creaWindow]: join(here, 'components', 'CreaEvaluationModal.tsx'),
  [STYLES.creaChat]: join(here, 'components', 'AiChat.tsx'),
  [STYLES.creationGroups]: join(here, 'pages', 'CreationGroups.tsx'),
}

const PHONE = `(width < ${PHONE_BREAKPOINT_PX}px)`

const withoutComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const read = (path) => withoutComments(readFileSync(path, 'utf8'))

/** Every `@media` block: its condition and what stands inside it. */
const mediaBlocks = (css) => {
  const blocks = []
  const opener = /@media([^{]*)\{/g
  let match = opener.exec(css)
  while (match) {
    let depth = 1
    let cursor = match.index + match[0].length
    const start = cursor
    while (depth > 0 && cursor < css.length) {
      if (css[cursor] === '{') {
        depth += 1
      } else if (css[cursor] === '}') {
        depth -= 1
      }
      cursor += 1
    }
    blocks.push({
      condition: match[1].trim(),
      body: css.slice(start, cursor - 1),
      from: match.index,
      to: cursor,
    })
    opener.lastIndex = cursor
    match = opener.exec(css)
  }
  return blocks
}

/** The text of a stylesheet with its `@media` blocks cut out. */
const outsideMedia = (css) => {
  let rest = ''
  let at = 0
  for (const block of mediaBlocks(css)) {
    rest += css.slice(at, block.from)
    at = block.to
  }
  return rest + css.slice(at)
}

/** The rules of a flat stretch of CSS: each selector with its declarations. */
const rules = (css) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, declarations]) => ({
    selector: selector.trim().replace(/\s+/g, ' '),
    declarations: Object.fromEntries(
      declarations
        .split(';')
        .map((declaration) => declaration.split(':'))
        .filter((parts) => parts.length >= 2)
        .map(([property, ...value]) => [property.trim(), value.join(':').trim()]),
    ),
  }))

/** The phone rules of a stylesheet. */
const phoneRules = (css) =>
  mediaBlocks(css)
    .filter((block) => block.condition === PHONE)
    .flatMap((block) => rules(block.body))

const ruleFor = (list, selector) => list.find((rule) => rule.selector === selector)

/** Every stylesheet below a folder, by a walk of its own: `readdirSync`'s `recursive` option is
 *  ignored without a word before Node 18.17. */
const stylesheetsBelow = (folder) =>
  readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name)
    if (entry.isDirectory()) {
      return stylesheetsBelow(path)
    }
    return /\.s?css$/.test(entry.name) ? [path] : []
  })

describe('the phone rules of the contribution page and the member search', () => {
  it('reads the stylesheets, and each holds a phone block', () => {
    for (const path of Object.values(STYLES)) {
      const css = read(path)
      expect(css.length, path).toBeGreaterThan(50)
      expect(phoneRules(css).length, path).toBeGreaterThan(0)
    }
  })

  it('has each of these stylesheets loaded by its component', () => {
    expect(Object.keys(LOADED_BY)).toEqual(expect.arrayContaining(Object.values(STYLES)))
    for (const [sheet, component] of Object.entries(LOADED_BY)) {
      const source = readFileSync(component, 'utf8')
      const name = basename(sheet).replaceAll('.', '\\.')
      expect(source, component).toMatch(new RegExp(`^import (\\w+ from )?'\\./${name}'$`, 'm'))
    }
  })

  // AO-010: the cards of S1 and S2 reach up to the boundary of the top bar. A rule still
  // switching at 768 would be a second boundary, a band in which half a phone is drawn.
  it('no stylesheet of the admin names 768 any more', () => {
    const sheets = stylesheetsBelow(here)
    // The walk proves itself: it reached the sheets of the pages and of the components, and it
    // finds a width where there is one (the top bar's, in a SCSS file two folders down).
    expect(sheets.length).toBeGreaterThan(20)
    expect(sheets).toEqual(expect.arrayContaining(Object.values(STYLES)))
    expect(read(join(here, 'components', 'NavBar.scss'))).toContain('992px')
    for (const sheet of sheets) {
      expect(read(sheet), sheet).not.toMatch(/\b768/)
    }
  })

  it('switches only at the phone boundary', () => {
    for (const path of Object.values(STYLES)) {
      expect(
        mediaBlocks(read(path)).map((block) => block.condition),
        path,
      ).toEqual(mediaBlocks(read(path)).map(() => PHONE))
    }
  })

  // The native controls (an opened select, a date picker, the scrollbars) in the admin's mode:
  // light, and dark while composables/useTheme.ts marks the document dark. On the root, and with
  // the root's weight: Bootstrap's own dark rule ties with `:root` and loses to the light one.
  it("App.css switches color-scheme with the document's theme", () => {
    const flat = rules(outsideMedia(read(STYLES.app)))
    expect(ruleFor(flat, ':root')?.declarations).toEqual({ 'color-scheme': 'light' })
    const dark = flat.filter((rule) => rule.selector === ":root[data-bs-theme='dark']")
    expect(dark.map((rule) => rule.declarations['color-scheme'])).toContain('dark')
  })

  it('makes every button and every field 44px tall on a phone, in App.css', () => {
    const css = read(STYLES.app)
    const tall = ruleFor(phoneRules(css), '.btn, .form-control, .form-select')
    expect(tall?.declarations['min-height']).toBe('2.75rem')
    // ... and keeps the words of a button that grew in its middle.
    const centred = ruleFor(phoneRules(css), '.btn')
    expect(centred?.declarations).toMatchObject({
      display: 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
    })
    // At the desk nothing of it.
    expect(outsideMedia(css)).not.toMatch(/min-height|inline-flex/)
  })

  // What the contribution page and the member search share: both open a row into a card with
  // tabs, both have buttons that are a symbol alone, both have a pager of three numbers.
  it('holds the rules of an opened row, of a symbol button and of a pager in App.css', () => {
    const css = read(STYLES.app)
    const phone = phoneRules(css)

    // A square of 44px that no neighbour squeezes: without `flex: none` the words beside it took
    // half of it at 320px. Two classes: `.crea-logo-btn` brings a padding of its own, from a
    // stylesheet loaded after this one.
    expect(ruleFor(phone, '.btn.phone-icon-btn')?.declarations).toMatchObject({
      flex: 'none',
      width: '2.75rem',
      height: '2.75rem',
      padding: '0',
    })
    // An opened row gives its side margins to what it holds: the card's (over Bootstrap's
    // ps-3/pe-3, which carry !important) and its body's.
    expect(ruleFor(phone, '.card.row-details-card')?.declarations).toEqual({
      'padding-inline': '0 !important',
    })
    expect(ruleFor(phone, '.row-details-card > .card-body')?.declarations).toEqual({
      'padding-inline': '0.5rem',
    })
    // The tabs in an opened row: buttons as well, so 44px.
    expect(ruleFor(phone, '.row-details-card .nav-link')?.declarations).toEqual({
      display: 'flex',
      'align-items': 'center',
      'min-height': '2.75rem',
    })
    // The pager keeps all three of its numbers below 576px.
    expect(ruleFor(phone, '.phone-pager .page-item.bv-d-sm-down-none')?.declarations).toEqual({
      display: 'list-item !important',
    })
    expect(ruleFor(phone, '.phone-pager.b-pagination-pills.pagination-lg')?.declarations).toEqual({
      '--bs-pagination-padding-x': '1rem',
    })

    const desk = outsideMedia(css)
    expect(desk).not.toMatch(/phone-|row-details-card|nav-link|pagination/)
  })

  it('draws the card in OpenCreationsTable.css, on a phone only', () => {
    const css = read(STYLES.table)
    const phone = phoneRules(css)

    // The words of a decision with a little less room around them; a symbol button stays the
    // square App.css makes of it.
    expect(
      ruleFor(phone, '.open-creations-table .phone-actions .btn:not(.phone-icon-btn)')
        ?.declarations,
    ).toEqual({
      'min-height': '2.75rem',
      'padding-inline': '0.5rem',
      'column-gap': '0.25rem',
    })
    // The inner margin of the card on its cells, so that the row's colour fills the card; the
    // lines between the cells go, the 3px line above the first one stays.
    expect(
      ruleFor(phone, '.open-creations-table .b-table-stacked-lg > tbody > tr > td')?.declarations,
    ).toEqual({ padding: '0.125rem 0.375rem', 'border-bottom-width': '0' })
    expect(ruleFor(phone, '.open-creations-table .group-select')?.declarations).toEqual({
      'max-width': '100%',
    })
    // The container of the messages gives its side margin as well.
    expect(
      ruleFor(phone, '.open-creations-table .contribution-messages-list .container')?.declarations,
    ).toEqual({ 'padding-inline': '0' })

    const desk = outsideMedia(css)
    expect(desk).not.toContain('phone-')
    expect(desk).not.toContain('b-table-stacked-lg')
    expect(desk).not.toContain('row-details-card')
  })

  it('sets the tab symbols above their words in CreationConfirm.css, and has no overlay any more', () => {
    const css = read(STYLES.page)
    const phone = phoneRules(css)

    expect(
      ruleFor(phone, '.creation-confirm .creation-tabs .nav-link')?.declarations,
    ).toMatchObject({
      display: 'flex',
      'flex-direction': 'column',
      'align-items': 'center',
    })
    expect(ruleFor(phone, '.creation-confirm .tab-badge')?.declarations).toMatchObject({
      position: 'absolute',
    })
    expect(ruleFor(phone, '.creation-confirm .hide-resubmission-row')?.declarations).toEqual({
      'min-height': '2.75rem',
    })

    expect(css).not.toContain('#overlay')
    expect(outsideMedia(css)).not.toMatch(/nav-link|tab-badge|pagination/)
  })

  it('lets a message take 90% of the width on a phone', () => {
    const phone = phoneRules(read(STYLES.messages))
    expect(ruleFor(phone, '.is-moderator, .is-user')?.declarations).toEqual({ width: '90%' })
  })

  it('draws the card of a member in SearchUserTable.css, on a phone only', () => {
    const css = read(STYLES.memberTable)
    // One cell to a card: its inner margin on it, the line below it gone, the 3px line above it
    // the edge between two cards.
    expect(
      ruleFor(phoneRules(css), '.search-user-table .b-table-stacked-lg > tbody > tr > td')
        ?.declarations,
    ).toEqual({ padding: '0.625rem 0.375rem 0.875rem', 'border-bottom-width': '0' })
    expect(outsideMedia(css).trim()).toBe('')
  })

  it('lets the creation form take the width of its card on a phone, its buttons under each other', () => {
    const css = read(STYLES.creationForm)
    const phone = phoneRules(css)

    expect(ruleFor(phone, '.block')?.declarations).toEqual({ margin: '0.25rem 0' })
    expect(ruleFor(phone, '.amountRow')?.declarations).toEqual({
      'flex-direction': 'column',
      gap: '0.5rem',
    })
    // Reversed: the submission, which comes second, stands on top.
    expect(ruleFor(phone, '.buttonsWrapper')?.declarations).toEqual({
      'flex-direction': 'column-reverse',
      gap: '0.5rem',
      margin: '1rem 0',
    })
    expect(ruleFor(phone, '.buttonsWrapper :global(.btn)')?.declarations).toEqual({
      width: '100%',
    })
    // At the desk the room Bootstrap's m-4 gave, and the buttons as before.
    const desk = rules(outsideMedia(css))
    expect(ruleFor(desk, '.block')?.declarations).toEqual({ margin: '1.5rem' })
    expect(ruleFor(desk, '.buttonsWrapper')?.declarations).toEqual({ margin: '1.5rem 2.4rem' })
  })

  it('keeps the selects of the role form inside their card', () => {
    const css = read(ROLE_FORM)
    expect(ruleFor(rules(css), '.role-select')?.declarations).toEqual({
      width: 'min(300pt, 100%)',
    })
    // No 300pt that the card does not hold.
    expect(css.replaceAll('min(300pt, 100%)', '')).not.toContain('300pt')
  })

  it('lets the words before the address break on a phone, and keeps their yellow', () => {
    const css = read(STYLES.mailForm)
    expect(
      ruleFor(phoneRules(css), '.component-confirm-register-mail .input-group-text')?.declarations,
    ).toEqual({ 'white-space': 'normal' })
    expect(ruleFor(rules(outsideMedia(css)), '.input-group-text')?.declarations).toEqual({
      'background-color': 'rgb(255 252 205)',
    })
  })

  it('makes the pin, the bubble and the arrow squares of 44px on a phone, 24px at the desk', () => {
    const css = read(STYLES.walletLink)
    // A line counts the square as 18px (44 less 2 x 13): measured in the built bundle, it grows
    // neither the member line of an opened contribution nor the username line of a card. Lifted
    // above the line below it, so that all of it can be pressed.
    expect(ruleFor(phoneRules(css), '.memberWalletLink')?.declarations).toEqual({
      width: '2.75rem',
      height: '2.75rem',
      position: 'relative',
      'z-index': '1',
      margin: '-0.8125rem -0.125rem -0.8125rem 0',
    })
    expect(ruleFor(rules(outsideMedia(css)), '.memberWalletLink')?.declarations).toMatchObject({
      width: '1.5rem',
      height: '1.5rem',
    })
  })

  it('lets the foot of the Crea window break on a phone, and nothing else of it', () => {
    const css = read(STYLES.creaWindow)
    expect(ruleFor(phoneRules(css), '.creaFooter')?.declarations).toEqual({ 'flex-wrap': 'wrap' })
    expect(ruleFor(rules(outsideMedia(css)), '.creaFooter')?.declarations).not.toHaveProperty(
      'flex-wrap',
    )
  })

  it('makes the open Crea chat a sheet over the whole width on a phone, and keeps the box at the desk', () => {
    const css = read(STYLES.creaChat)
    const phone = phoneRules(css)
    expect(ruleFor(phone, '.chatContainer')?.declarations).toEqual({
      left: '0',
      right: '0',
      bottom: '0',
      'font-size': '0.875rem',
    })
    // The button that opens it keeps its place, 20px from the corner.
    expect(ruleFor(phone, '.chatToggleButton')?.declarations).toEqual({
      bottom: '20px',
      right: '20px',
    })
    expect(ruleFor(phone, '.chatWindow')?.declarations).toMatchObject({
      width: '100%',
      'border-radius': '0.5rem 0.5rem 0 0',
    })
    // vh first, dvh second: an engine without dvh drops the second line and keeps the first.
    const sheet = mediaBlocks(css).find((block) => block.condition === PHONE).body
    expect(sheet.replace(/\s+/g, ' ')).toContain(
      'height: min(480px, 80vh); height: min(480px, 80dvh);',
    )
    expect(ruleFor(phone, '.chatClearButton')?.declarations).toEqual({ 'font-size': '0.875rem' })
    // The copy button, a square of 44px there, beside its bubble rather than over its text.
    expect(ruleFor(phone, '.copyClipboardButton')?.declarations).toEqual({
      right: 'auto',
      left: 'calc(100% - 4px)',
    })

    // At the desk the box of before: 550 × 480, 20px from the corner, 12px.
    const desk = rules(outsideMedia(css))
    expect(ruleFor(desk, '.chatContainer')?.declarations).toMatchObject({
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      'font-size': '12px',
    })
    // The button that opens it stands absolutely, at every width: the container, which spans the
    // whole width on a phone, is then no taller than what it shows -- 0px while the chat is
    // closed, so that it lies over nothing of the page.
    expect(ruleFor(desk, '.chatToggleButton')?.declarations).toMatchObject({
      position: 'absolute',
      bottom: '0',
      right: '0',
    })
    expect(ruleFor(desk, '.chatWindow')?.declarations).toMatchObject({
      width: '550px',
      height: '480px',
    })
    expect(ruleFor(desk, '.chatClearButton')?.declarations).toEqual({ 'font-size': '12px' })
    expect(ruleFor(desk, '.copyClipboardButton')?.declarations).toMatchObject({
      position: 'absolute',
      top: '20%',
      right: '-12%',
    })
  })

  it('lets a row of the creation groups wrap on a phone, and keeps the row of before at the desk', () => {
    const css = read(STYLES.creationGroups)
    const phone = phoneRules(css)
    expect(ruleFor(phone, '.creationGroupRow')?.declarations).toEqual({ 'flex-wrap': 'wrap' })
    // The two fields of an edited row, each in the whole width.
    expect(ruleFor(phone, '.creationGroupInput')?.declarations).toEqual({
      flex: '1 1 100%',
      'max-width': 'none',
    })
    // The line its buttons start below.
    expect(ruleFor(phone, '.creationGroupBreak')?.declarations).toEqual({
      display: 'block',
      'flex-basis': '100%',
      height: '0',
    })
    // The tag is one word.
    expect(ruleFor(phone, '.creationGroup')?.declarations).toEqual({ 'overflow-wrap': 'anywhere' })

    // At the desk the row does not wrap, the line is not there, the fields are as narrow as
    // before.
    const desk = rules(outsideMedia(css))
    expect(ruleFor(desk, '.creationGroupRow')?.declarations).not.toHaveProperty('flex-wrap')
    expect(ruleFor(desk, '.creationGroupBreak')?.declarations).toEqual({ display: 'none' })
    expect(ruleFor(desk, '.creationGroupInput')?.declarations).toEqual({ 'max-width': '220px' })
    expect(ruleFor(desk, '.creationGroup')?.declarations).not.toHaveProperty('overflow-wrap')
  })

  it('holds no fixed colour more than before', () => {
    const counted = Object.fromEntries(
      Object.keys(FIXED_COLOURS_AT_MOST).map((path) => {
        const css = read(path)
        // The file was read: an emptied one must not pass as a file without colours. (The
        // stylesheet of the role form holds one rule of 45 characters.)
        expect(css.length, path).toBeGreaterThan(40)
        const fixed =
          (css.match(/#[0-9a-f]{3,8}\b/gi) ?? []).length + (css.match(/\brgba?\(/gi) ?? []).length
        return [path, fixed]
      }),
    )
    for (const [path, most] of Object.entries(FIXED_COLOURS_AT_MOST)) {
      expect(counted[path], path).toBeLessThanOrEqual(most)
    }
    // The count sees a colour where there is one.
    expect(counted[STYLES.table]).toBeGreaterThan(0)
  })
})
