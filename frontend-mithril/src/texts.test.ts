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

// A key put together at run time is one this test cannot read: the first argument is one
// literal, and nothing more (`'form.' + name` begins with a literal too).
const NO_LITERAL_KEY = /\bt\((?!\s*'[^']*'\s*[,)])/

it('every t() names its key as a literal', () => {
  const unreadable = sources.filter(({ code }) => NO_LITERAL_KEY.test(code)).map(({ file }) => file)
  expect(unreadable).toEqual([])
})

it('tells a literal key from one put together', () => {
  for (const literal of ["t('form.amount')", "t('a.b', { n: 1 }, 2)", "t(\n  'a.b',\n)"]) {
    expect(NO_LITERAL_KEY.test(literal)).toBe(false)
  }
  for (const made of ["t('form.' + name)", "t('a.b' + suffix, {}, 2)", 't(key)', 't(`a.${b}`)']) {
    expect(NO_LITERAL_KEY.test(made)).toBe(true)
  }
})
