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

/** The fields of `messages` -- or of another list of messages -- in the operation called `name`. */
const messageFieldsOf = (document, name, list = 'messages') => {
  const operation = document.definitions.find(
    (definition) => definition.kind === Kind.OPERATION_DEFINITION && definition.name.value === name,
  )
  const root = operation.selectionSet.selections[0]
  const messages = root.selectionSet.selections.find(
    (selection) => selection.kind === Kind.FIELD && selection.name.value === list,
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
      // E-060: a changed message takes the place of the one a thread holds, whichever way it comes
      // -- with the beat, or as the answer to one's own change.
      edited: messageFieldsOf(chat, 'newChatMessagesSince', 'edited'),
      editedCopy: copyFieldsOf(chat, 'editChatMessage'),
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

  // E-060: when the text was changed last -- for the word "bearbeitet" beside the time, and for
  // the calendar file of a planned call, which counts its changes by it.
  it('carries when the text was changed', () => {
    expect(beat).toContain('editedAt')
    expect(beat.indexOf('editedAt')).toBe(beat.indexOf('createdAt') + 1)
  })

  // The beat asks for the changed messages with the cursor the last answer handed on, and takes
  // the next one.
  it('asks the beat for the changed messages by a cursor, and for the next cursor', () => {
    const operation = chat.definitions.find(
      (definition) => definition.name?.value === 'newChatMessagesSince',
    )
    expect(operation.variableDefinitions.map((variable) => variable.variable.name.value)).toEqual([
      'afterId',
      'limit',
      'editedCursor',
    ])
    const answer = operation.selectionSet.selections[0]
    expect(answer.arguments.map((argument) => argument.name.value)).toEqual([
      'afterId',
      'limit',
      'editedCursor',
    ])
    expect(answer.selectionSet.selections.map((selection) => selection.name.value)).toEqual([
      'latestId',
      'unreadConversations',
      'hasMore',
      'messages',
      'edited',
      'editedCursor',
    ])
  })

  // ⛔ The backend's request log masks a variable by its name (plugins.ts): `body` is written as
  // "***". Under any other name the changed text would stand in the log with every change.
  it('names the changed text `$body`, the name the request log masks', () => {
    const operation = chat.definitions.find(
      (definition) => definition.name?.value === 'editChatMessage',
    )
    expect(operation.variableDefinitions.map((variable) => variable.variable.name.value)).toEqual([
      'messageUuid',
      'body',
    ])
  })

  // E-059: whether a message is a forwarded copy, and whose words it carries -- for the line over it.
  it('carries whether a message was forwarded, and from whom', () => {
    expect(beat).toEqual(
      expect.arrayContaining(['forwarded', 'forwardedFrom.gradidoID', 'forwardedFrom.alias']),
    )
  })
})
