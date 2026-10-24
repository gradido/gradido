// AI-GENERATED — not an architecture reference

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Some specs of the admin hold a file of the wallet against the admin's own copy or tokens (the
// dark tones, the face colours, the cheque, the font). The admin's workflow runs on changes under
// admin/ -- and on those wallet files, listed in its paths, so that a change there is checked in
// the pull request that makes it, not as a stranger's failure in the next admin one.
const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')
const workflow = readFileSync(
  join(root, '.github', 'workflows', 'test_admin_interface.yml'),
  'utf8',
)
const paths = [...workflow.matchAll(/^\s*-\s*'([^']+)'\s*$/gm)].map(([, path]) => path)

/** Every spec below a folder, by a walk of its own (`recursive` is ignored before Node 18.17). */
const specsBelow = (folder) =>
  readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name)
    if (entry.isDirectory()) {
      return specsBelow(path)
    }
    return /\.(spec|test)\.js$/.test(entry.name) ? [path] : []
  })

describe('the workflow of the admin', () => {
  it('runs on every wallet file a spec of the admin reads', () => {
    const read = new Set()
    for (const spec of specsBelow(here)) {
      const text = readFileSync(spec, 'utf8')
      for (const [, path] of text.matchAll(/['"]((?:\.\.\/)+frontend\/[^'"]+)['"]/g)) {
        read.add(relative(root, resolve(dirname(spec), path)))
      }
    }
    // The search proves itself: it finds the four of 24.10.2026, and the workflow was read.
    expect(read.size).toBeGreaterThanOrEqual(4)
    expect(paths).toContain('admin/**')
    for (const file of read) {
      expect(paths, file).toContain(file)
    }
  })
})
