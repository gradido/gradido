// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { LG_BREAKPOINT_PX } from '@/constants'

/**
 * ⛔ One boundary, declared twice, held together by a measurement.
 *
 * `$grid-breakpoints` in `assets/scss/custom/gradido-custom/_grid-breakpoint.scss` decides
 * where every `d-none d-lg-block` and `d-block d-lg-none` in the tree switches, and the
 * bundle compiles that number away -- JavaScript cannot read it. So `useViewport` carries a
 * copy, and this checks the copy against the declaration.
 *
 * It is written because the two HAD parted company: the copy said Bootstrap's default 992
 * while this wallet switches at 1025, and in the 33-pixel band between them JavaScript
 * unmounted the phone column while CSS still hid the desk one -- no column at all, on an
 * iPad in landscape among others. A comment claiming the number came from Bootstrap was
 * what made it look right.
 *
 * ⚠️ The SOURCE is what is measured, not the compiled stylesheet. `src/assets/css/gradido.css`
 * is a build artefact and is gitignored, so a spec that read it passed on a machine that had
 * built the styles and failed on a fresh checkout and in CI -- which is exactly what a first
 * version of this file did. The compiled file is checked too, but only where it exists.
 *
 * ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class and node rejects
 * an instance of it as coming from another realm.
 */
const here = dirname(fileURLToPath(import.meta.url))
const scssPath = join(
  here,
  '..',
  'assets',
  'scss',
  'custom',
  'gradido-custom',
  '_grid-breakpoint.scss',
)
const cssPath = join(here, '..', 'assets', 'css', 'gradido.css')

/** The `@media` condition of the block that carries a given class. */
const mediaCarrying = (css, className) => {
  let index = 0
  while (index < css.length) {
    const opener = /@media([^{]*)\{/g
    opener.lastIndex = index
    const match = opener.exec(css)
    if (!match) return null
    let depth = 1
    let cursor = match.index + match[0].length
    const start = cursor
    while (depth > 0 && cursor < css.length) {
      if (css[cursor] === '{') depth += 1
      else if (css[cursor] === '}') depth -= 1
      cursor += 1
    }
    if (css.slice(start, cursor - 1).includes(className)) {
      return match[1].trim()
    }
    index = cursor
  }
  return null
}

describe('the layout boundary in JavaScript and in the stylesheet', () => {
  const scss = readFileSync(scssPath, 'utf8')

  it('finds the breakpoint map it is about to measure', () => {
    // The fixture proves itself: a file without the map would make the assertion below
    // pass by describing nothing.
    expect(scss).toContain('$grid-breakpoints')
  })

  it('carries the same number the stylesheet declares for lg', () => {
    const declared = scss.match(/\blg:\s*(\d+)px/)

    expect(declared, '$grid-breakpoints no longer declares lg in pixels').not.toBeNull()
    expect(Number(declared[1])).toBe(LG_BREAKPOINT_PX)
  })

  /**
   * ⛔ And the number it must NOT be. Named on its own, because 992 is the value a reader
   * reaches for from memory -- it is Bootstrap's own default, and this wallet overrides it.
   */
  it('is not Bootstrap default, which this wallet overrides', () => {
    expect(scss).not.toMatch(/\blg:\s*992px/)
  })

  /**
   * The compiled stylesheet, where one has been built. It is gitignored, so this cannot be
   * the only check -- but where it is present it is the strongest one, because it is what
   * the browser actually receives.
   */
  it.runIf(existsSync(cssPath))('switches the lg display utilities there too', () => {
    const css = readFileSync(cssPath, 'utf8')

    expect(css).toContain('.d-lg-block')
    expect(mediaCarrying(css, '.d-lg-block')).toContain(`${LG_BREAKPOINT_PX}px`)
    expect(mediaCarrying(css, '.d-lg-none')).toContain(`${LG_BREAKPOINT_PX}px`)
  })
})
