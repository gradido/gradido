// AI-GENERATED — not an architecture reference
import { expect, it } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

// PurgeCSS (vite.config.ts) keeps a rule only where the sources name its class whole. A class put
// together (`btn-${variant}`) is not found, its rule is cut from the build, and nothing fails:
// the page is just drawn without it. Ids and the like are put together freely.
const PIECED = /[\w-]-\$\{|\}-[\w-]/
const NOT_A_CLASS = /\bid\b|\bid:|Id\b|aria-|data-test/

it('puts no class name together from pieces', () => {
  const pieced = readdirSync(import.meta.dir, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
    .flatMap((file) =>
      readFileSync(path.join(import.meta.dir, file), 'utf8')
        .split('\n')
        .map((line, index) => ({ at: `${file}:${index + 1}`, line: line.trim() }))
        .filter(({ line }) => PIECED.test(line) && !NOT_A_CLASS.test(line)),
    )
  expect(pieced).toEqual([])
})
