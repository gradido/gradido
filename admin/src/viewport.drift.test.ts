// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PHONE_BREAKPOINT_PX } from '@/constants'

/**
 * ⛔ One boundary, held in four places, and this measures them against each other.
 *
 * A table of the class `b-table-stacked-lg` stacks below the number written into the admin's own
 * stylesheet of it (components/bootstrap/table.css, as bootstrap-vue-next drew it); every table
 * of the admin that stacks names that width in its source; `viewport.ts` carries a copy of it to
 * choose the cells of a card; and the phone rules switch in stylesheets of their own. A card
 * drawn into a table that does not stack, or rules for a phone in a window that is none, is what
 * a gap between them would cost -- the wallet had such a gap once, 33 pixels wide, with no column
 * at all in it (frontend/src/composables/useViewport.drift.spec.js).
 */
const src = dirname(fileURLToPath(import.meta.url))
const libraryCss = join(src, 'components', 'bootstrap', 'table.css')

const PHONE_STYLES = [
  join(src, 'App.css'),
  join(src, 'pages', 'CreationConfirm.css'),
  join(src, 'components', 'Tables', 'OpenCreationsTable.css'),
  join(src, 'components', 'ContributionMessages', 'slots', 'ContributionMessagesListItem.css'),
  join(src, 'components', 'Tables', 'SearchUserTable.css'),
  join(src, 'components', 'CreationFormular.module.css'),
  join(src, 'components', 'ConfirmRegisterMailFormular.css'),
  join(src, 'components', 'MemberWalletLink.module.css'),
  // The other side of the same width: where the figures table of the statistic page stops
  // stacking, a label of the weeks below it keeps to one line.
  join(src, 'pages', 'Statistic.module.css'),
]

// Every table of the admin that stacks, and the width below which it does. Each names its width
// in its source. All stack at the phone boundary but one: the starting-credit list, whose eight
// columns stood 13.6px past a 1024px window even with its four buttons in one column, stacks
// below 1200px (measured in the built admin, 23.10.2026).
const STACKING_TABLES = {
  [join(src, 'components', 'creationConfirm', 'OpenCreationsTable.ts')]: PHONE_BREAKPOINT_PX,
  [join(src, 'components', 'SearchUserTable.ts')]: PHONE_BREAKPOINT_PX,
  [join(src, 'components', 'userSearch', 'CreationTransactionList.ts')]: PHONE_BREAKPOINT_PX,
  [join(src, 'components', 'userSearch', 'TransactionLinkList.ts')]: PHONE_BREAKPOINT_PX,
  [join(src, 'components', 'support', 'SupportTicketsTable.ts')]: PHONE_BREAKPOINT_PX,
  [join(src, 'pages', 'Statistic.ts')]: PHONE_BREAKPOINT_PX,
  [join(src, 'components', 'contributionLink', 'ContributionLinkList.ts')]: 1200,
}

// Bootstrap's names of its widths, as the classes spell them.
const BOOTSTRAP_WIDTHS: Record<string, number> = { sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1400 }

const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

/** The `@media` condition of the block that carries a given class. */
const mediaCarrying = (css: string, className: string) => {
  let index = 0
  while (index < css.length) {
    const opener = /@media([^{]*)\{/g
    opener.lastIndex = index
    const match = opener.exec(css)
    if (!match) {
      return null
    }
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
    if (css.slice(start, cursor - 1).includes(className)) {
      return match[1].trim()
    }
    index = cursor
  }
  return null
}

describe('the phone boundary in JavaScript and in the stylesheets', () => {
  // Bernd, 23.10.2026 (AO-010): "Ja, die Karten-Grenze wandert auf 992 px."
  it("the one boundary is 992 and matches the stylesheet's stacked-lg rule", () => {
    expect(PHONE_BREAKPOINT_PX).toBe(992)
    const css = withoutComments(readFileSync(libraryCss, 'utf8'))
    // The search proves itself: the stylesheet is there, and it has the class.
    expect(css).toContain('.b-table-stacked-lg')
    expect(mediaCarrying(css, '.b-table-stacked-lg')).toBe(
      `(width <= ${PHONE_BREAKPOINT_PX - 0.02}px)`,
    )
    // what chooses the cells of a card asks for the same number
    expect(readFileSync(join(src, 'viewport.ts'), 'utf8')).toContain(
      'matchMedia(`(min-width: ${PHONE_BREAKPOINT_PX}px)`)',
    )
  })

  it('every table that stacks, stacks at that boundary', () => {
    for (const [path, expected] of Object.entries(STACKING_TABLES)) {
      // Comments out first: a comment that names the width must not stand in for the class.
      const code = withoutComments(readFileSync(path, 'utf8')).replace(/\/\/[^\n]*/g, '')
      const widths = [...code.matchAll(/\bb-table-stacked-(\w+)/g)].map(([, width]) => width)
      // Each file was read and names a width: one that stopped stacking would pass silently.
      expect(widths.length, path).toBeGreaterThan(0)
      expect(
        widths.map((width) => BOOTSTRAP_WIDTHS[width]),
        path,
      ).toEqual(widths.map(() => expected))
    }
    // The one exception is one, and the stylesheet stacks it where the list expects it.
    const css = withoutComments(readFileSync(libraryCss, 'utf8'))
    expect(mediaCarrying(css, '.b-table-stacked-xl')).toBe('(width <= 1199.98px)')
  })

  it('is the one width every phone rule switches at', () => {
    const widths = PHONE_STYLES.flatMap((path) =>
      [...withoutComments(readFileSync(path, 'utf8')).matchAll(/@media([^{]*)\{/g)].flatMap(
        ([, condition]) => [...condition.matchAll(/(\d+(?:\.\d+)?)px/g)].map(([, px]) => px),
      ),
    )
    // Each of them switches at least once -- a search that found nothing would pass.
    expect(widths.length).toBeGreaterThanOrEqual(PHONE_STYLES.length)
    expect(new Set(widths)).toEqual(new Set([String(PHONE_BREAKPOINT_PX)]))
  })
})
