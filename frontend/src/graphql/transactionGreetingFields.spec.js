// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Kind, parse } from 'graphql'

/**
 * The bubble of an accepted thank-you greeting reads the motif, the line and whether it carries
 * a photo off its booking (ZE-019), and the booking comes from the narrowed booking list (useChatTransfers sends
 * `transactionsQuery`; its spec holds that). Every spec of the thread and of the bubble hands in
 * a made-up booking that HAS a greeting, so none of them can see whether the list is asked for
 * it: with the field gone from the document they all stay green, and every greeting in every
 * conversation is a plain transfer again.
 *
 * So this holds the files against each other: what the bubble reads of the greeting is what the
 * document asks for, and the document asks no more of it. Whom the greeting was written "for"
 * stays out -- a conversation is with that person.
 */

const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')

const document = parse(read('./transactions.graphql'))

const fragments = new Map(
  document.definitions
    .filter((definition) => definition.kind === Kind.FRAGMENT_DEFINITION)
    .map((definition) => [definition.name.value, definition]),
)

/** Every field a selection asks for, as a path ("greeting.line"), fragments spread out. */
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

const ofTheGreeting = (paths) => paths.filter((path) => path.startsWith('greeting.')).sort()

describe('the greeting of a booking, as the conversation asks for it', () => {
  const asked = bookingFieldsOf('transactionsQuery')

  // `hasPicture`: THAT the greeting carries a photo. The photo itself is no field of a booking:
  // the bubble asks for it by the id of the link, once it is in sight.
  it('asks the booking list for the motif, the line and whether there is a photo', () => {
    expect(ofTheGreeting(asked)).toEqual(['greeting.hasPicture', 'greeting.line', 'greeting.motif'])
  })

  it('asks for the id of the link, which the photo is asked for by', () => {
    expect(asked).toContain('linkId')
  })

  it('asks for everything the bubble reads off the greeting', () => {
    const bubble = read('../components/Chat/ChatBubble.vue')
    const readOffTheGreeting = [...bubble.matchAll(/greeting\.value\?\.(\w+)/g)].map(
      (match) => `greeting.${match[1]}`,
    )

    // The bubble does read it -- otherwise the comparison below holds for nothing at all.
    expect([...new Set(readOffTheGreeting)].sort()).toEqual([
      'greeting.hasPicture',
      'greeting.line',
      'greeting.motif',
    ])
    expect(asked).toEqual(expect.arrayContaining(readOffTheGreeting))
  })

  // The column beside the overview takes its bookings from the same fragment and draws nothing
  // of the greeting; one fragment, so that a booking is one entry of the cache for both.
  it('is the same for the bookings beside the overview', () => {
    expect(ofTheGreeting(bookingFieldsOf('transactionsUserCountQuery'))).toEqual(
      ofTheGreeting(asked),
    )
  })
})
