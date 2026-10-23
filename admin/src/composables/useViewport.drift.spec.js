// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PHONE_BREAKPOINT_PX } from '@/constants'

/**
 * ⛔ One boundary, held in three places, and this measures them against each other.
 *
 * bootstrap-vue-next stacks a table with `stacked='md'` below its own number, written into its
 * stylesheet; `useViewport` carries a copy of it to choose the cells of a card; and the phone
 * rules of the contribution page switch in four stylesheets of their own. A card drawn into a
 * table that does not stack, or rules for a phone in a window that is none, is what a gap
 * between them would cost -- the wallet had such a gap once, 33 pixels wide, with no column at
 * all in it (frontend/src/composables/useViewport.drift.spec.js).
 *
 * ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class and node rejects an
 * instance of it as coming from another realm.
 */
const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const libraryCss = require.resolve('bootstrap-vue-next/dist/bootstrap-vue-next.css')

const PHONE_STYLES = [
  join(here, '..', 'App.css'),
  join(here, '..', 'pages', 'CreationConfirm.css'),
  join(here, '..', 'components', 'Tables', 'OpenCreationsTable.css'),
  join(
    here,
    '..',
    'components',
    'ContributionMessages',
    'slots',
    'ContributionMessagesListItem.css',
  ),
]

const withoutComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')

/** The `@media` condition of the block that carries a given class. */
const mediaCarrying = (css, className) => {
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
  it('is where bootstrap-vue-next stacks a table of `stacked="md"`', () => {
    const css = readFileSync(libraryCss, 'utf8')
    // The search proves itself: the stylesheet is there, and it has the class.
    expect(css).toContain('.b-table-stacked-md')
    expect(mediaCarrying(css, '.b-table-stacked-md')).toBe(
      `(max-width: ${PHONE_BREAKPOINT_PX - 0.02}px)`,
    )
  })

  it('is the one width every phone rule of the contribution page switches at', () => {
    const widths = PHONE_STYLES.flatMap((path) =>
      [...withoutComments(readFileSync(path, 'utf8')).matchAll(/@media([^{]*)\{/g)].flatMap(
        ([, condition]) => [...condition.matchAll(/(\d+(?:\.\d+)?)px/g)].map(([, px]) => px),
      ),
    )
    // Each of the four switches at least once -- a search that found nothing would pass.
    expect(widths.length).toBeGreaterThanOrEqual(PHONE_STYLES.length)
    expect(new Set(widths)).toEqual(new Set([String(PHONE_BREAKPOINT_PX)]))
  })
})
