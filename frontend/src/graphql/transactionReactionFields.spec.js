// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Kind, parse } from 'graphql'

/**
 * The reaction to a transfer (Bernd, 11.10.2026) is read off the booking: the emoji, and whether
 * the member may set one. Every spec of the row, the thread and the bubble hands in a made-up
 * booking that HAS the two fields, so none of them can see whether the list is asked for them:
 * with a field gone from the document they all stay green, and no reaction is shown anywhere --
 * or nobody is offered one.
 *
 * So this holds the files against each other, as transactionPictureFields.spec.js does for the
 * picture: what the wallet reads of a booking's reaction is what the document asks for, and
 * what it sends is what the document names.
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

const operation = (name) =>
  document.definitions.find(
    (definition) => definition.kind === Kind.OPERATION_DEFINITION && definition.name.value === name,
  )

/** The fields of a booking in the operation called `name`. */
const bookingFieldsOf = (name) => {
  const list = operation(name).selectionSet.selections.find(
    (selection) => selection.name.value === 'transactionList',
  )
  const bookings = list.selectionSet.selections.find(
    (selection) => selection.name.value === 'transactions',
  )
  return pathsOf(bookings.selectionSet)
}

/** Source without its comments: a field named in a comment is not a field that is read. */
const code = (relativePath) =>
  read(relativePath)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '')

describe('the reaction to a transfer, as the wallet asks for it', () => {
  const asked = bookingFieldsOf('transactionsQuery')

  it('asks the booking list for the emoji, and for whether the member may react', () => {
    expect(asked).toContain('reaction')
    expect(asked).toContain('canReact')
  })

  // What a reaction is sent by, and which side of the transfer a row is.
  it('asks for the id of the booking and for its kind', () => {
    expect(asked).toContain('id')
    expect(asked).toContain('typeId')
  })

  it('asks for everything the shared rules read off a booking', () => {
    const rules = code('../composables/useTransactionReactions.js')
    const readOffTheBooking = [
      ...new Set([...rules.matchAll(/booking\??\.(\w+)/g)].map((m) => m[1])),
    ]

    // The rules do read them -- otherwise the comparison below holds for nothing at all.
    expect(readOffTheBooking.sort()).toEqual(['canReact', 'id', 'reaction', 'typeId'])
    expect(asked).toEqual(expect.arrayContaining(readOffTheBooking))
  })

  it('reaches the row: it reads the reaction, and whether the member may, off the booking', () => {
    const row = code('../components/Transactions/GddTransaction.vue')

    expect(row).toMatch(/props\.transaction\.reaction \?\? null/)
    expect(row).toMatch(/props\.transaction\.canReact/)
  })

  it('reaches the bubble: the thread hands the booking’s reaction and the server’s word on', () => {
    const thread = code('../components/Chat/ChatThread.vue')

    expect(thread).toMatch(/reactions: transferReactions\(booking\)/)
    expect(thread).toMatch(/canReact: booking\.canReact === true/)
    expect(code('../components/Chat/ChatBubble.vue')).toMatch(/props\.message\.canReact === true/)
  })

  // The column beside the overview takes its bookings from the same fragment and draws nothing
  // of the reaction; one fragment, so that a booking is one entry of the cache for both.
  it('is the same for the bookings beside the overview', () => {
    const beside = bookingFieldsOf('transactionsUserCountQuery')

    expect(beside).toContain('reaction')
    expect(beside).toContain('canReact')
  })
})

describe('the reaction to a transfer, as the wallet sends it', () => {
  const mutation = operation('setTransactionReaction')

  it('is a mutation that names the booking and the emoji, the emoji not required', () => {
    expect(mutation.operation).toBe('mutation')
    const variables = Object.fromEntries(
      mutation.variableDefinitions.map((definition) => [
        definition.variable.name.value,
        definition.type.kind === Kind.NON_NULL_TYPE
          ? `${definition.type.type.name.value}!`
          : definition.type.name.value,
      ]),
    )
    // No emoji takes the reaction back: the variable must be allowed to be null.
    expect(variables).toEqual({ transactionId: 'Int!', emoji: 'String' })
  })

  it('hands both on to the field, and asks nothing of the answer: it is the emoji', () => {
    const [field] = mutation.selectionSet.selections
    expect(field.name.value).toBe('setTransactionReaction')
    expect(
      Object.fromEntries(
        field.arguments.map((argument) => [argument.name.value, argument.value.name.value]),
      ),
    ).toEqual({ transactionId: 'transactionId', emoji: 'emoji' })
    expect(field.selectionSet).toBeUndefined()
  })

  // ⛔ The server's request log leaves a variable called `emoji` out (filterVariables in the
  // backend's plugins): under another name the reaction would stand in the log with the booking.
  it('names the emoji `emoji`, the name the server’s request log leaves out', () => {
    expect(mutation.variableDefinitions.map((d) => d.variable.name.value)).toContain('emoji')
    expect(code('../composables/useTransactionReactions.js')).toMatch(
      /variables: \{ transactionId, emoji: wanted \}/,
    )
  })
})
