// AI-GENERATED — not an architecture reference

import { describe, it, expect, vi } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { updateUserInfos } from './mutations'
import { mutations as storeMutations } from '../store/store'

// The store is only read for its mutation names, but importing it runs the module, and
// that reaches i18n. Mocked the way store.test.js does it -- vi.mock is hoisted above the
// imports, so this takes effect even though it is written below them.
vi.mock('../i18n', () => ({
  default: { global: { locale: { value: 'en' } } },
}))

// UserSettingsSwitch and UserNamingFormat are handed an attribute NAME and use it blind,
// in two places at once: it becomes the variable of updateUserInfos, and it becomes the
// store mutation that is committed after a successful save. Each half fails silently on
// its own, which is why neither can be left to a component test:
//
//   * a GraphQL document carries only the variables it DECLARES. An undeclared one is
//     dropped on the way out without an error -- the switch flips, says "saved", and
//     nothing reaches the server.
//   * Vuex answers an unknown mutation type with a console line, not an exception, so the
//     save succeeds, the success toast fires, and only the screen goes stale.
//
// A component test cannot see either: it mocks the mutation and builds its own store, so
// the two layers that would have dropped the name are exactly the two that were replaced.
// So this holds the pages against the real document and the real store.
//
// Read from the document's syntax tree, never from the text of mutations.js. That file
// holds two dozen documents, and a name declared by ANY of them satisfies a text search.
// That is not hypothetical: updateUserInfos renames one of its own arguments (language:
// $locale) while $language is declared by createUser, so a text-matching guard waves
// `language` through -- the precise bug this file exists to catch. Measured before this
// was rewritten: 21 names passed that updateUserInfos does not declare.
//
// Declaring is the whole contract on the GraphQL side. A variable that is declared but
// never used makes the server reject the entire document (spec 5.8.4, "All Variables
// Used"), which is loud and total -- the opposite of the silent per-field drop above.
//
// Path handling deliberately goes through fileURLToPath: jsdom brings its own URL class,
// and node rejects an instance of it as coming from a foreign realm.

const here = dirname(fileURLToPath(import.meta.url))
const srcDir = resolve(here, '..')

const vueFilesIn = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = join(directory, entry.name)
    if (entry.isDirectory()) return vueFilesIn(full)
    return entry.name.endsWith('.vue') ? [full] : []
  })

// The leading colon is the whole difference, and it is easy to read past: with it the
// attribute is a JavaScript expression, so only a quoted string names something this
// guard can follow; without it the attribute IS the name. Both spellings are in use --
// :attr-name="'gmsAllowed'" on the settings page, attr-name="gmsAllowed" on the matching
// page -- and :attr-name="gmsAllowed" would be a third thing entirely, a variable that
// merely looks like the second.
const ATTR_NAME = /(:?)attr-name="([^"]*)"/g
// Every spelling the prop can take, so a form this file does not parse is counted rather
// than passed over. Vue accepts the camelCase prop name just as happily.
const ANY_ATTR_NAME = /:?attr-?[Nn]ame\s*=/g

const nameFrom = (colon, raw) =>
  colon ? /^'([A-Za-z]\w*)'$/.exec(raw)?.[1] : /^[A-Za-z]\w*$/.exec(raw)?.[0]

const collectAttrNames = () => {
  const literal = []
  const unreadable = []
  for (const file of vueFilesIn(srcDir)) {
    const source = readFileSync(file, 'utf8')
    const where = file.slice(srcDir.length + 1)
    const parsed = [...source.matchAll(ATTR_NAME)]
    for (const [, colon, raw] of parsed) {
      const name = nameFrom(colon, raw)
      if (name) literal.push(name)
      else unreadable.push(`${where}: attr-name="${raw}" is not a literal name`)
    }
    const spellings = [...source.matchAll(ANY_ATTR_NAME)].length
    if (parsed.length < spellings) {
      unreadable.push(
        `${where}: ${spellings - parsed.length} attr-name(s) in a form this guard cannot read`,
      )
    }
  }
  return { literal: [...new Set(literal)], unreadable }
}

const operation = updateUserInfos.definitions.find(
  (definition) => definition.kind === 'OperationDefinition',
)
const declared = operation.variableDefinitions.map((definition) => definition.variable.name.value)

const { literal, unreadable } = collectAttrNames()

describe('the attr-names the pages hand to the self-saving components', () => {
  // The whole tree is scanned rather than a list of pages, so a new page cannot slip past
  // this guard by not being listed. The two checks below then say what the sweep found:
  // an attr-name written as anything but a literal cannot be followed statically, and a
  // sweep that finds nothing at all would pass every remaining assertion vacuously.
  it('are all written as a literal string, so this guard can follow them', () => {
    expect(unreadable).toEqual([])
  })

  it('are found at all', () => {
    expect(literal.length).toBeGreaterThan(0)
  })

  it.each(literal)('%s is declared as a variable of updateUserInfos', (attrName) => {
    expect(declared).toContain(attrName)
  })

  it.each(literal)('%s has a store mutation of the same name', (attrName) => {
    expect(Object.keys(storeMutations)).toContain(attrName)
  })
})
