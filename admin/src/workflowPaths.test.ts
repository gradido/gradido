// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Some tests of the admin hold a file of the wallet against the admin's own copy (the face
// colours, the cheque, the font). The admin's workflow runs on changes under
// admin/ -- and on those wallet files, listed in its paths, so that a change there is checked in
// the pull request that makes it, not as a stranger's failure in the next admin one.
const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')
const workflow = readFileSync(
  join(root, '.github', 'workflows', 'test_admin_interface.yml'),
  'utf8',
)
const paths = [...workflow.matchAll(/^\s*-\s*'([^']+)'\s*$/gm)].map(([, path]) => path)

/** Every test below a folder. */
const specsBelow = (folder: string): string[] =>
  readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name)
    if (entry.isDirectory()) {
      return specsBelow(path)
    }
    return /\.test\.ts$/.test(entry.name) ? [path] : []
  })

describe('the workflow of the admin', () => {
  it('runs on every wallet file a spec of the admin reads', () => {
    const read = new Set<string>()
    for (const spec of specsBelow(here)) {
      const text = readFileSync(spec, 'utf8')
      for (const [, path] of text.matchAll(/['"]((?:\.\.\/)+frontend\/[^'"]+)['"]/g)) {
        read.add(relative(root, resolve(dirname(spec), path)))
      }
    }
    // The search proves itself: it finds the font, the face colours and the cheque, and the
    // workflow was read.
    expect(read.size).toBeGreaterThanOrEqual(3)
    expect(paths).toContain('admin/**')
    for (const file of read) {
      expect(paths, file).toContain(file)
    }
  })
})
