// AI-GENERATED — not an architecture reference
import { expect, it } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'

// Safari before 16.4 (iOS 15 and the first of 16) refuses a regular expression that looks
// behind, as it is read: the whole file then fails, not only the line. The build does not
// rewrite it.
it('no regular expression looks behind', () => {
  const src = `${import.meta.dir}/..`
  const lookingBehind = readdirSync(src, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
    .filter((file) => /\(\?<[=!]/.test(readFileSync(`${src}/${file}`, 'utf8')))
  expect(lookingBehind).toEqual([])
})
