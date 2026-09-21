// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/**
 * ⛔ The page edge below the desk layout, and the three files that have to agree on it.
 *
 * Every page on a phone stood 30px in from the edge: App.vue's `#app` rule reached both
 * #app elements -- index.html's mount point and App.vue's root -- and the sign-in card added
 * 16 + 24 + 12 of its own, so a 375px phone gave an e-mail address 211px. The edge is 6px
 * now, the measure the map had already found for itself (Bernd, 21.09.2026), and it holds
 * only for as long as nobody adds a margin back somewhere else.
 *
 * jsdom lays nothing out, so this reads the sources -- with the comments stripped first.
 * Every file here explains the old measures in prose, and a search over the raw text would
 * find its own explanation and stay green.
 *
 * ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class and node rejects
 * an instance of it as coming from another realm.
 */
const here = dirname(fileURLToPath(import.meta.url))
const source = (...path) => readFileSync(join(here, ...path), 'utf8')
const live = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')
const styles = (sfc) =>
  live([...sfc.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(([, css]) => css).join('\n'))

/** The bodies of the `@media` blocks whose condition contains `condition`. */
const mediaBodies = (css, condition) => {
  const bodies = []
  const opener = /@media([^{]*)\{/g
  let match
  while ((match = opener.exec(css))) {
    let depth = 1
    let cursor = match.index + match[0].length
    const start = cursor
    while (depth > 0 && cursor < css.length) {
      if (css[cursor] === '{') depth += 1
      else if (css[cursor] === '}') depth -= 1
      cursor += 1
    }
    if (match[1].includes(condition)) bodies.push(css.slice(start, cursor - 1))
    opener.lastIndex = cursor
  }
  return bodies
}

/** The declarations of the rule written for exactly `selector`, or null. */
const rule = (css, selector) => {
  for (const [, written, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (written.trim() === selector) return body.replace(/\s+/g, ' ').trim()
  }
  return null
}

describe('the page edge on a phone', () => {
  const app = styles(source('App.vue'))
  const phone = mediaBodies(app, '1024.98px').join('\n')

  it('finds the block it is about to measure', () => {
    // The fixture proves itself: without it every assertion below would describe nothing.
    expect(phone).toContain('#app')
  })

  it('is 6px, on App.vue root', () => {
    const root = rule(phone, '#app > #app')
    expect(root).toContain('padding-left: 6px')
    expect(root).toContain('padding-right: 6px')
  })

  it('is not given to the mount point as well', () => {
    // A bare `#app` reaches index.html's mount point too -- that was the 30px. The font rule
    // is one such bare rule, which is what shows the search reads the file.
    const bare = [...app.matchAll(/(?:^|[{},])\s*#app\s*\{([^{}]*)\}/g)].map(([, body]) => body)
    expect(bare.length).toBeGreaterThan(0)
    expect(bare.filter((body) => /padding/.test(body))).toEqual([])
  })

  it('clips the grid rather than letting the page be pushed sideways', () => {
    // Rows reach half a gutter (12px) past their parent; with a 6px edge that is 6px off
    // the screen, empty but scrollable.
    expect(rule(phone, '#app > #app')).toContain('overflow-x: clip')
  })

  it('puts text that stands on the page where the text inside a box starts', () => {
    expect(rule(phone, '#app > #app')).toContain('--page-text-inset: 24px')
    expect(rule(phone, '.page-text')).toContain('padding-left: var(--page-text-inset)')
    expect(rule(phone, '.page-text')).toContain('padding-right: var(--page-text-inset)')
    // Once, and only for the phone: above that width there is no edge to make up for.
    expect(app.match(/\.page-text\s*\{/g)).toHaveLength(1)
  })

  it('lets the map stand on it rather than break out past it', () => {
    // The map used to reach a gutter past the page to get to 6px. On a 6px edge the same
    // break-out would put it 18px beyond the screen, cut off by the clip above.
    const map = styles(source('pages', 'MatchingMap.vue'))
    expect(map).toContain('.map-shell')
    expect(map).not.toMatch(/margin-(?:left|right)\s*:\s*calc\([^;]*\*\s*-1\)/)
  })

  it('gives the sign-in card no margin of its own below md', () => {
    const layout = source('layouts', 'AuthLayout.vue')
    const template = live(layout.match(/<template>([\s\S]*)<\/template>/)[1])
    expect(template).toContain('<div class="mx-0 mx-md-4">')
    // ... and no second one inside it: the pages wrap their form in a BContainer.
    const narrow = mediaBodies(styles(layout), '767.98px').join('\n')
    expect(rule(narrow, '.card-body :deep(.container)')).toContain('padding-left: 0')
    expect(rule(narrow, '.card-body :deep(.container)')).toContain('padding-right: 0')
  })
})

describe('what the wider page changed around it', () => {
  it('puts the word under the icon in all three matching tabs on a phone', () => {
    // 24px more tab bar let "Zuhause" fit beside its icon at 375px while the other two words
    // still wrapped under theirs. On a phone all three go under, whatever the language.
    const narrow = mediaBodies(styles(source('pages', 'Matching.vue')), '575.98px').join('\n')
    expect(rule(narrow, '.matching-nav-label')).toContain('display: block')
  })
})
