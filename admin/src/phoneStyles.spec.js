// AI-GENERATED — not an architecture reference

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PHONE_BREAKPOINT_PX } from '@/constants'

/**
 * The phone rules of the contribution page, read from the stylesheets.
 *
 * Vitest hands every stylesheet to the tests as an empty string, and jsdom lays nothing out:
 * no test can see a rule work. So the rules are read where they are written. Comments come out
 * first -- every file here explains its rules in prose, and a search over the raw text would
 * find the explanation of a rule that is gone.
 *
 * ⛔ Every phone rule stands under `(width < 768px)` and nowhere else: one boundary, the one
 * where the tables stack (composables/useViewport.ts). And no stylesheet of the delivery holds
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
}
// Upper bounds, counted on 23.10.2026 before the delivery (CreationConfirm.css had one: the
// backdrop of the overlay the dialog replaced). NavBar.scss is not touched by it; it is held
// here because the dark mode will meet it first.
const FIXED_COLOURS_AT_MOST = {
  [STYLES.table]: 9,
  [STYLES.page]: 0,
  [STYLES.app]: 1,
  [STYLES.messages]: 4,
  [join(here, 'components', 'NavBar.scss')]: 3,
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

describe('the phone rules of the contribution page', () => {
  it('reads the four stylesheets, and each holds a phone block', () => {
    for (const path of Object.values(STYLES)) {
      const css = read(path)
      expect(css.length, path).toBeGreaterThan(50)
      expect(phoneRules(css).length, path).toBeGreaterThan(0)
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

  it('draws the card in OpenCreationsTable.css, on a phone only', () => {
    const css = read(STYLES.table)
    const phone = phoneRules(css)

    expect(ruleFor(phone, '.open-creations-table .phone-actions .btn')?.declarations).toEqual({
      'min-height': '2.75rem',
      'padding-inline': '0.5rem',
      'column-gap': '0.25rem',
    })
    // A square of 44px that no neighbour squeezes: without `flex: none` the words beside it took
    // half of it at 320px.
    expect(
      ruleFor(phone, '.open-creations-table .phone-actions .phone-icon-btn')?.declarations,
    ).toMatchObject({
      flex: 'none',
      width: '2.75rem',
      height: '2.75rem',
      padding: '0',
    })
    // The inner margin of the card on its cells, so that the row's colour fills the card; the
    // lines between the cells go, the 3px line above the first one stays.
    expect(
      ruleFor(phone, '.open-creations-table .b-table-stacked-md > tbody > tr > td')?.declarations,
    ).toEqual({ padding: '0.125rem 0.375rem', 'border-bottom-width': '0' })
    expect(ruleFor(phone, '.open-creations-table .group-select')?.declarations).toEqual({
      'max-width': '100%',
    })
    // An opened row gives its side margins to the messages: the card's (over Bootstrap's
    // ps-3/pe-3, which carry !important), its body's and the container's.
    expect(ruleFor(phone, '.open-creations-table .row-details-card')?.declarations).toEqual({
      'padding-inline': '0 !important',
    })
    expect(
      ruleFor(phone, '.open-creations-table .row-details-card > .card-body')?.declarations,
    ).toEqual({ 'padding-inline': '0.5rem' })
    expect(
      ruleFor(phone, '.open-creations-table .contribution-messages-list .container')?.declarations,
    ).toEqual({ 'padding-inline': '0' })
    // The tabs of the form in an opened row: buttons as well, so 44px.
    expect(
      ruleFor(phone, '.open-creations-table .contribution-messages-formular .nav-link')
        ?.declarations,
    ).toEqual({ display: 'flex', 'align-items': 'center', 'min-height': '2.75rem' })

    const desk = outsideMedia(css)
    expect(desk).not.toContain('phone-')
    expect(desk).not.toContain('b-table-stacked-md')
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
    // The pager keeps all three of its numbers below 576px.
    expect(
      ruleFor(phone, '.creation-confirm .b-pagination-pills .page-item.bv-d-sm-down-none')
        ?.declarations,
    ).toEqual({ display: 'list-item !important' })

    expect(css).not.toContain('#overlay')
    expect(outsideMedia(css)).not.toMatch(/nav-link|tab-badge|pagination/)
  })

  it('lets a message take 90% of the width on a phone', () => {
    const phone = phoneRules(read(STYLES.messages))
    expect(ruleFor(phone, '.is-moderator, .is-user')?.declarations).toEqual({ width: '90%' })
  })

  it('holds no fixed colour more than before', () => {
    const counted = Object.fromEntries(
      Object.keys(FIXED_COLOURS_AT_MOST).map((path) => {
        const css = read(path)
        // The file was read: a missing one must not pass as a file without colours.
        expect(css.length, path).toBeGreaterThan(50)
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
