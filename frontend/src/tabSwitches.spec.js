// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/**
 * ⛔ The two tab switches -- send page and contribution pages -- are one style in two files.
 *
 * Each tab is a third of the bar. With 20px of padding at each side and an icon that was
 * free to shrink, a phone showed the icons squeezed to a few pixels or not at all, in every
 * language. Three things hold the form now, and they only work together: 8px of side
 * padding, icons that do not shrink, and on a phone the word under the icon, as the tab bar
 * of the matching page has it (pages/Matching.vue, held in pageEdge.spec.js).
 *
 * jsdom lays nothing out, so this reads the sources -- with the comments stripped first:
 * both files explain the measures in prose, and a search over the raw text would find its
 * own explanation and stay green.
 *
 * ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class and node rejects
 * an instance of it as coming from another realm.
 */
const here = dirname(fileURLToPath(import.meta.url))
const source = (...path) => readFileSync(join(here, ...path), 'utf8')
const live = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')

/** The style of a switch: from the rule of its frame to the end of that style block. */
const switchStyle = (sfc, frame) => {
  const start = sfc.indexOf(`.${frame} {`)
  if (start === -1) return null
  return live(sfc.slice(start, sfc.indexOf('</style>', start)))
    .replaceAll(frame, 'FRAME')
    .replace(/\s+/g, ' ')
    .trim()
}

/** The body of the `@media` block whose condition contains `condition`, or ''. */
const mediaBody = (css, condition) => {
  const opener = css.indexOf('@media')
  if (opener === -1 || !css.slice(opener, css.indexOf('{', opener)).includes(condition)) return ''
  return css.slice(css.indexOf('{', opener) + 1, css.lastIndexOf('}'))
}

/** The declarations of the rule written for exactly `selector` in `css`, or null. */
const rule = (css, selector) => {
  for (const [, written, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (written.trim() === selector) return body.trim()
  }
  return null
}

const SWITCHES = [
  ['the send page', ['components', 'GddSend', 'TransactionForm.vue'], 'nav-send-btn-wrapper'],
  [
    'the contribution pages',
    ['components', 'Contributions', 'NavContributions.vue'],
    'nav-contributions-btn-wrapper',
  ],
]

describe('the two tab switches', () => {
  const styles = SWITCHES.map(([, path, frame]) => switchStyle(source(...path), frame))

  it('finds the two styles it is about to compare', () => {
    // The fixture proves itself: without it every assertion below would describe nothing.
    for (const css of styles) {
      expect(css).not.toBeNull()
      expect(css.startsWith('.FRAME {')).toBe(true)
      expect(css).toContain('> :deep(*) {')
      expect(css).toContain(':deep(.router-link-active)')
    }
  })

  it('reads code, not the comments beside it', () => {
    const raw = source(...SWITCHES[1][1])
    expect(raw).toContain('As the switch of the send page')
    expect(styles[1]).not.toContain('As the switch of the send page')
  })

  it('are the same style, but for the name of the frame', () => {
    expect(styles[0]).toBe(styles[1])
  })

  describe.each(SWITCHES.map(([name], index) => [name, index]))('of %s', (name, index) => {
    const css = () => styles[index]
    const everyWidth = () => css().slice(0, css().indexOf('@media'))

    it('gives every tab 8px at each side, the active one too', () => {
      const tab = everyWidth().match(/> :deep\(\*\) \{([^{}]*)\}/)[1]
      expect(tab).toContain('padding-right: 8px;')
      expect(tab).toContain('padding-left: 8px;')
      expect(rule(everyWidth(), ':deep(.router-link-active)')).toContain('padding: 0.625rem 8px;')
      expect(everyWidth()).not.toContain('1.25rem')
    })

    it('does not let an icon shrink', () => {
      const icon = everyWidth().match(/FRAME \{.*?[;}] :deep\(\.svg-icon\) \{([^{}]*)\}/)[1]
      expect(icon).toContain('flex-shrink: 0;')
    })

    it('puts the word under the icon on a phone, and the icon in the middle', () => {
      const phone = mediaBody(css(), '(width <= 575.98px)')
      expect(phone).toContain('FRAME {')
      expect(phone.match(/> :deep\(\*\) \{([^{}]*)\}/)[1]).toContain('flex-direction: column;')
      expect(phone.match(/:deep\(\.svg-icon\) \{([^{}]*)\}/)[1]).toContain('margin-right: 0;')
    })

    it('keeps the font size it had', () => {
      expect(css().match(/font-size:[^;]*;/g)).toEqual(['font-size: 14px;'])
    })
  })

  it('carries the gap beside an icon in the style, not as a margin on the element', () => {
    const sfc = live(source(...SWITCHES[0][1]))
    expect(sfc.split('<script')[0]).not.toMatch(/style="margin-right/)
    expect(rule(sfc, '.nav-send-btn-wrapper > :deep(:first-child)')).toBe('--tab-icon-gap: 5px;')
    expect(rule(sfc, '.nav-send-btn-wrapper > :deep(:last-child)')).toBe('--tab-icon-gap: 3px;')
    for (const css of styles) {
      const icon = css.match(/FRAME \{.*?[;}] :deep\(\.svg-icon\) \{([^{}]*)\}/)[1]
      expect(icon).toContain('margin-right: var(--tab-icon-gap, 0);')
    }
  })
})
