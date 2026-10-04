// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Kind, parse } from 'graphql'

/**
 * The bubble of a transfer with a picture, and the opened row of the booking list, read the
 * picture off the booking (ZE-016): its motif, or that it is a photo. Every spec of the thread,
 * the bubble and the row hands in a made-up booking that HAS a picture, so none of them can see
 * whether the list is asked for it: with the field gone from the document they all stay green,
 * and every picture is gone from every conversation.
 *
 * So this holds the files against each other, as transactionGreetingFields.spec.js does for the
 * greeting: what the wallet reads of the picture is what the document asks for, and the
 * document asks no more of it.
 */

const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')

const document = parse(read('./transactions.graphql'))

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

const ofThePicture = (paths) => paths.filter((path) => path.startsWith('picture.')).sort()

/** Source without its comments: a field named in a comment is not a field that is read. */
const code = (relativePath) =>
  read(relativePath)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '')

describe('the picture of a transfer, as the wallet asks for it', () => {
  const asked = bookingFieldsOf('transactionsQuery')

  // `hasPicture`: THAT the picture is a photo. The photo itself is no field of a booking: its
  // place asks for it by the id of the booking, once it is in sight.
  it('asks the booking list for the motif and whether the picture is a photo', () => {
    expect(ofThePicture(asked)).toEqual(['picture.hasPicture', 'picture.motif'])
  })

  it('asks for the id of the booking, which the photo is asked for by', () => {
    expect(asked).toContain('id')
  })

  it('asks for everything the wallet reads off the picture', () => {
    const reader = code('../utils/transactionPicture.js')
    const readOffThePicture = [...reader.matchAll(/picture\.(\w+)/g)].map(
      (match) => `picture.${match[1]}`,
    )

    // The reader does read it -- otherwise the comparison below holds for nothing at all.
    expect([...new Set(readOffThePicture)].sort()).toEqual(['picture.hasPicture', 'picture.motif'])
    expect(asked).toEqual(expect.arrayContaining(readOffThePicture))
  })

  it('reaches the bubble: the thread hands the booking’s picture and its id on', () => {
    const thread = code('../components/Chat/ChatThread.vue')

    expect(thread).toMatch(/picture: booking\.picture \?\? null/)
    expect(thread).toMatch(/transactionId: booking\.id/)
  })

  it('is read by the bubble and by the opened row through the one reader', () => {
    expect(code('../components/Chat/ChatBubble.vue')).toMatch(
      /transactionPictureShown\(props\.message\.picture, t\)/,
    )
    expect(code('../components/Transactions/GddTransaction.vue')).toMatch(
      /transactionPictureShown\(props\.transaction\.picture, t\)/,
    )
  })

  // The column beside the overview takes its bookings from the same fragment and draws nothing
  // of the picture; one fragment, so that a booking is one entry of the cache for both.
  it('is the same for the bookings beside the overview', () => {
    expect(ofThePicture(bookingFieldsOf('transactionsUserCountQuery'))).toEqual(ofThePicture(asked))
  })
})
