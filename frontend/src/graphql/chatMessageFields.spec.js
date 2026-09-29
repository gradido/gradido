// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Kind, parse } from 'graphql'

/**
 * The chat's beat (newChatMessagesSince) hands its messages into the thread with a person AND into
 * a group's thread (P5): the thread writes them into the answer of its own query in the cache. A
 * field that query asks for and the beat does not bring leaves a hole there -- Apollo writes what
 * it is given, reads the answer back as incomplete, and the thread is left with a page it cannot
 * trust. Every spec hands the thread made-up messages, so none of them can see it: this one holds
 * the documents against each other.
 */

const here = dirname(fileURLToPath(import.meta.url))
const documentOf = (file) => parse(readFileSync(resolve(here, file), 'utf8'))

const chat = documentOf('./chat.graphql')
const groups = documentOf('./chatGroups.graphql')

const fragmentsOf = (document) =>
  new Map(
    document.definitions
      .filter((definition) => definition.kind === Kind.FRAGMENT_DEFINITION)
      .map((definition) => [definition.name.value, definition]),
  )

/** Every field a selection asks for, as a path ("sender.gradidoID"), fragments spread out. */
const pathsOf = (selectionSet, fragments, prefix = '') =>
  selectionSet.selections.flatMap((selection) => {
    if (selection.kind === Kind.FRAGMENT_SPREAD) {
      return pathsOf(fragments.get(selection.name.value).selectionSet, fragments, prefix)
    }
    const path = `${prefix}${selection.name.value}`
    return selection.selectionSet ? pathsOf(selection.selectionSet, fragments, `${path}.`) : [path]
  })

/** The fields of `messages` in the operation called `name`. */
const messageFieldsOf = (document, name) => {
  const operation = document.definitions.find(
    (definition) => definition.kind === Kind.OPERATION_DEFINITION && definition.name.value === name,
  )
  const root = operation.selectionSet.selections[0]
  const messages = root.selectionSet.selections.find(
    (selection) => selection.kind === Kind.FIELD && selection.name.value === 'messages',
  )
  return pathsOf(messages.selectionSet, fragmentsOf(document))
}

describe('the fields of a chat message', () => {
  const beat = messageFieldsOf(chat, 'newChatMessagesSince')

  /** The fields one's own copy is asked with, in the operation called `name`. */
  const copyFieldsOf = (document, name) => {
    const operation = document.definitions.find((definition) => definition.name?.value === name)
    return pathsOf(operation.selectionSet.selections[0].selectionSet, fragmentsOf(document))
  }

  // ⛔ One shape, in the same order, wherever a message is asked for: the beat's arrivals and
  // one's own copies go into the page of either thread.
  it('is one shape in every document that asks for messages', () => {
    const shapes = {
      page: messageFieldsOf(chat, 'chatMessagesWithMemberQuery'),
      copy: copyFieldsOf(chat, 'sendChatMessage'),
      groupPage: messageFieldsOf(groups, 'chatGroupMessagesQuery'),
      groupCopy: copyFieldsOf(groups, 'sendChatGroupMessage'),
    }
    for (const [name, fields] of Object.entries(shapes)) {
      expect({ [name]: fields }).toEqual({ [name]: beat })
    }
  })

  // Gegenprobe: the shape carries what the group adds and what the thread of two needs.
  it('carries the group, the writer and the mark, and what became of the mail', () => {
    expect(beat).toEqual(
      expect.arrayContaining([
        'groupUuid',
        'senderUser.alias',
        'senderUser.avatarUpdatedAt',
        'announcement',
        'mailState',
        'images.imageUuid',
      ]),
    )
  })
})
