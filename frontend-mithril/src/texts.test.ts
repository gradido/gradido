// AI-GENERATED — not an architecture reference
import { expect, it } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { t } from './i18n'

// In place of the ESLint plugin of the old wallet (`no-missing-keys`), which does not read this
// workspace. `t` gives the key itself where no text has it: this is where that is noticed.
const sources = readdirSync(import.meta.dir, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts') && file !== 'i18n.ts')
  .map((file) => ({ file, code: readFileSync(`${import.meta.dir}/${file}`, 'utf8') }))

it('every key a t() names has a text in en.json', () => {
  const missing = sources.flatMap(({ file, code }) =>
    [...code.matchAll(/\bt\(\s*'([^']+)'/g)]
      .filter(([, key]) => t(key) === key)
      .map(([, key]) => `${file}: ${key}`),
  )
  expect(missing).toEqual([])
})

// a key put together at run time is one this test cannot read
it('every t() names its key as a literal', () => {
  const unreadable = sources
    .filter(({ code }) => /\bt\((?!\s*')/.test(code))
    .map(({ file }) => file)
  expect(unreadable).toEqual([])
})
