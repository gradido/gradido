// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Kind, parse } from 'graphql'

/**
 * Whether a thank-you was answered since it came (F E-046) is read off the booking: the server's
 * word. Every spec of the tile "Dein Dank ist da." and of its rule hands in a made-up booking that
 * has the field or lacks it, so none of them can see whether the booking list is asked for it --
 * and a booking without it counts as "not answered" on purpose, for a server that does not say it
 * yet. With the field gone from the document they would all stay green, while the tile showed
 * every answered thank-you again.
 *
 * So this holds the files against each other, as transactionReactionFields.spec.js does for the
 * reaction: both questions for the booking list ask for it, the tile's rule reads it, and nothing
 * else in the wallet does.
 */

const here = dirname(fileURLToPath(import.meta.url))
const src = resolve(here, '..')

const document = parse(readFileSync(resolve(here, './transactions.graphql'), 'utf8'))

const fragments = new Map(
  document.definitions
    .filter((definition) => definition.kind === Kind.FRAGMENT_DEFINITION)
    .map((definition) => [definition.name.value, definition]),
)

/** Every field a selection asks for, as a path ("picture.motif"), fragments spread out. */
const pathsOf = (selectionSet, prefix = '') =>
  selectionSet.selections.flatMap((selection) => {
    if (selection.kind === Kind.FRAGMENT_SPREAD) {
      return pathsOf(fragments.get(selection.name.value).selectionSet, prefix)
    }
    const path = `${prefix}${selection.name.value}`
    return selection.selectionSet ? pathsOf(selection.selectionSet, `${path}.`) : [path]
  })

/** The fields of a booking in the operation called `name`. */
const bookingFieldsOf = (name) => {
  const operation = document.definitions.find(
    (definition) => definition.kind === Kind.OPERATION_DEFINITION && definition.name.value === name,
  )
  const list = operation.selectionSet.selections.find(
    (selection) => selection.name.value === 'transactionList',
  )
  const bookings = list.selectionSet.selections.find(
    (selection) => selection.name.value === 'transactions',
  )
  return pathsOf(bookings.selectionSet)
}

/** A file without its comments: a field named in a comment is not a field that is read. */
const code = (path) =>
  readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '')

/** Every script and component of the wallet, its specs left out. By hand: Node 18.16 has no `recursive`. */
const sourceFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.(js|vue)$/.test(entry.name) && !entry.name.endsWith('.spec.js') ? [path] : []
  })

describe('whether a thank-you was answered, as the wallet asks for it', () => {
  it('asks the booking list for it', () => {
    expect(bookingFieldsOf('transactionsQuery')).toContain('answered')
  })

  // The column beside the overview takes its bookings from the same fragment; one fragment, so
  // that a booking is one entry of the cache for both.
  it('is the same for the bookings beside the overview', () => {
    expect(bookingFieldsOf('transactionsUserCountQuery')).toContain('answered')
  })

  it('is read by the tile’s rule', () => {
    expect(code(resolve(src, 'utils/thanksNudge.js'))).toMatch(/!booking\.answered\b/)
  })

  it('is read by nothing else in the wallet', () => {
    const files = sourceFiles(src)
    // The walk reads the wallet: a search that read no file would find no reader either.
    expect(files.length).toBeGreaterThan(100)
    const readers = files
      .filter((path) => /\.answered\b/.test(code(path)))
      .map((path) => relative(src, path))
    expect(readers).toEqual(['utils/thanksNudge.js'])
  })
})
