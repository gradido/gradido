// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Kind, parse } from 'graphql'

/**
 * The line under a name on "Kontakte & Chat" (E-083) reads `mine`, `excerpt`, `hasImage`, `amount`
 * and, in a group, `senderUser` off a ChatPreview (utils/chatPreview.js, ChatPreviewLine, the two
 * rows). Every spec of those hands in a made-up preview that HAS them, so none can see whether the
 * lists ask for them: with a field gone from a document they all stay green, and the line would
 * say "Du" for nobody, or a booking would turn into a message.
 *
 * So this holds the files against each other, as transactionGreetingFields.spec.js does for the
 * greeting: what is read is what the two documents ask for, and they ask no more of it.
 */

const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')

/** Every field a selection asks for, as a path ("chatPreview.mine"), fragments spread out. */
const pathsIn = (document) => {
  const fragments = new Map(
    document.definitions
      .filter((definition) => definition.kind === Kind.FRAGMENT_DEFINITION)
      .map((definition) => [definition.name.value, definition]),
  )
  const pathsOf = (selectionSet, prefix = '') =>
    selectionSet.selections.flatMap((selection) => {
      if (selection.kind === Kind.FRAGMENT_SPREAD) {
        return pathsOf(fragments.get(selection.name.value).selectionSet, prefix)
      }
      const path = `${prefix}${selection.name.value}`
      return selection.selectionSet ? pathsOf(selection.selectionSet, `${path}.`) : [path]
    })
  return { fragments, pathsOf }
}

const ofThePreview = (paths) => paths.filter((path) => path.startsWith('chatPreview.')).sort()

const contacts = parse(read('./contacts.graphql'))
const contactsPaths = pathsIn(contacts)
/** The fields of a contact in the operation called `name`. */
const contactFieldsOf = (name) => {
  const operation = contacts.definitions.find(
    (definition) => definition.kind === Kind.OPERATION_DEFINITION && definition.name.value === name,
  )
  const list = operation.selectionSet.selections.find(
    (selection) => selection.name.value === 'contactList',
  )
  const people = list.selectionSet.selections.find(
    (selection) => selection.name.value === 'contacts',
  )
  return contactsPaths.pathsOf(people.selectionSet)
}

const groups = parse(read('./chatGroups.graphql'))
const groupsPaths = pathsIn(groups)
/** The fields of a group in the answer of the operation called `name` (its one root field). */
const groupFieldsOf = (name) => {
  const operation = groups.definitions.find(
    (definition) => definition.kind === Kind.OPERATION_DEFINITION && definition.name.value === name,
  )
  return groupsPaths.pathsOf(operation.selectionSet.selections[0].selectionSet)
}

/** What the line reads off a preview, as `preview.<field>` and, for a group's writer, `writer.<field>`. */
const readOff = (source, name) => [
  ...new Set([...source.matchAll(new RegExp(`\\b${name}\\??\\.(\\w+)`, 'g'))].map((m) => m[1])),
]

describe('the line under a name, as the lists ask for it (E-083)', () => {
  const helper = read('../utils/chatPreview.js')

  it('reads these fields off a preview -- otherwise the comparisons below hold for nothing', () => {
    expect(readOff(helper, 'preview').sort()).toEqual([
      'amount',
      'excerpt',
      'hasImage',
      'mine',
      'senderUser',
    ])
    expect(readOff(helper, 'writer').sort()).toEqual(['alias', 'gradidoID'])
  })

  // A person's line names no writer: between two, the list knows both. Everything else it reads,
  // the list asks for, and nothing more.
  it('asks the contact list for everything the line reads of a person', () => {
    expect(ofThePreview(contactFieldsOf('contactListQuery'))).toEqual([
      'chatPreview.amount',
      'chatPreview.excerpt',
      'chatPreview.hasImage',
      'chatPreview.mine',
    ])
  })

  // Through the fragment both contact documents send (contactFields.spec.js): a contact is known
  // the same way wherever it comes from.
  it('asks the single lookup behind a contact window the same', () => {
    expect(ofThePreview(contactFieldsOf('contactByMemberQuery'))).toEqual(
      ofThePreview(contactFieldsOf('contactListQuery')),
    )
  })

  // The answers a group row is drawn from: the list, and the answer a new group enters the list
  // with (Contacts.vue, groupCreated). Renaming or taking members in asks the list again.
  it.each(['chatGroupsQuery', 'createChatGroup'])(
    'asks %s for everything the line reads of a group, its writer too',
    (name) => {
      expect(ofThePreview(groupFieldsOf(name))).toEqual([
        'chatPreview.amount',
        'chatPreview.excerpt',
        'chatPreview.hasImage',
        'chatPreview.mine',
        'chatPreview.senderUser.alias',
        'chatPreview.senderUser.gradidoID',
      ])
    },
  )

  it('asks for what the rows read of the preview themselves', () => {
    const contactRow = read('../components/Contacts/ContactRow.vue')
    const groupRow = read('../components/ChatGroups/ChatGroupRow.vue')
    expect(readOff(contactRow, 'preview').sort()).toEqual(['amount', 'mine'])
    expect(readOff(groupRow, 'chatPreview').sort()).toEqual(['mine'])
  })
})
