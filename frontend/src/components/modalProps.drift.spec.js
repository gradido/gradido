// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * bootstrap-vue-next's modal props are `no-header`, `no-footer` and `no-header-close`.
 * The Vue-2 names `hide-*` are NOT props of it -- and an unknown prop falls through as a
 * plain attribute and does NOTHING, silently. So a dialog written to have no header comes
 * up with one, and nobody finds out until somebody looks.
 *
 * ⛔ This has cost this house twice already: a repair pull request for the contact window
 * (#3891, an untranslated Cancel / OK pair under its own two buttons), and on 20.09.2026 a
 * sweep that found the same dead name in nine more places. Measured in the installed
 * package 0.26.8: `hideHeader`, `hideFooter` and `hideHeaderClose` occur **zero** times,
 * `noHeader` 15, `noFooter` 4, `noHeaderClose` 4.
 *
 * So the rule gets a guard instead of a third comment. It reads CODE: the comments come
 * out first, because three files explain this trap in prose beside the correct prop and
 * would otherwise keep the search green after somebody wrote the wrong name again.
 *
 * ⚠️ The camel forms are only rejected as an object KEY (`hideFooter:`), which is how they
 * reach a modal through `confirm({ props: … })`. `route.meta.hideFooter` is this house's
 * own flag and has nothing to do with the library.
 */
const here = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(here, '..')

const sourceFiles = (dir) => {
  const found = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      found.push(...sourceFiles(path))
    } else if (/\.(vue|js)$/.test(name) && !/\.spec\.js$/.test(name)) {
      found.push(path)
    }
  }
  return found
}

const withoutComments = (source) =>
  source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const DEAD = [
  /hide-header-close/,
  /hide-header/,
  /hide-footer/,
  /hideHeaderClose\s*:/,
  /hideHeader\s*:/,
  /hideFooter\s*:/,
]

describe('bootstrap-vue-next modal props', () => {
  const files = sourceFiles(ROOT)

  // The walk found the tree, and it reads code rather than notes: a file that explains the
  // trap in a comment must not count as an offender.
  it('reads this package and strips its comments', () => {
    expect(files.length).toBeGreaterThan(100)
    expect(files.some((f) => withoutComments(readFileSync(f, 'utf8')).includes('no-header'))).toBe(
      true,
    )
  })

  it('never uses the Vue-2 names the library does not have', () => {
    const offenders = []
    for (const file of files) {
      const code = withoutComments(readFileSync(file, 'utf8'))
      for (const dead of DEAD) {
        if (dead.test(code)) {
          offenders.push(`${file.slice(ROOT.length + 1)}  (${dead.source})`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
