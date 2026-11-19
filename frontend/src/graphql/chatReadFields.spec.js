// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Kind, parse, print } from 'graphql'

/**
 * How far the other member has read (Chat E-093) comes in two fields: `partnerReadUpTo` on the
 * thread's page, and `readUpTo` on the beat's answer, asked with `readBy`. Every spec of the thread
 * and of the beat hands in a made-up answer that HAS them, so none can see whether the documents
 * ask for them: with a field gone from a document they all stay green, and no tick would ever
 * show. So this holds the documents against the code that reads them, as chatPreviewFields.spec.js
 * does for the line under a name.
 */

const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')
/** The code alone: the comments of both files name the fields too. */
const codeOf = (relativePath) =>
  read(relativePath)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const chat = parse(read('./chat.graphql'))
const operation = (name) =>
  chat.definitions.find(
    (definition) => definition.kind === Kind.OPERATION_DEFINITION && definition.name.value === name,
  )
/** The fields asked on the one root field of the operation called `name`. */
const fieldsOf = (name) =>
  operation(name).selectionSet.selections[0].selectionSet.selections.map(
    (selection) => selection.name.value,
  )
/** What `.<field>` is read off in `source`: the names in front of it. */
const readOff = (source, field) =>
  [...source.matchAll(new RegExp(`(\\w+)\\??\\.${field}\\b`, 'g'))].map((match) => match[1])

describe('how far the other member has read, as the documents ask it (E-093)', () => {
  it("is asked on the thread's page", () => {
    expect(fieldsOf('chatMessagesWithMemberQuery')).toContain('partnerReadUpTo')
  })

  it("is asked on the beat's answer, with the members named", () => {
    expect(fieldsOf('newChatMessagesSince')).toContain('readUpTo')
    const beat = operation('newChatMessagesSince')
    const variable = beat.variableDefinitions.find(
      (definition) => definition.variable.name.value === 'readBy',
    )
    expect(print(variable.type)).toBe('[MemberAvatarRefInput!]')
    const argument = beat.selectionSet.selections[0].arguments.find(
      (arg) => arg.name.value === 'readBy',
    )
    expect(argument.value.kind).toBe(Kind.VARIABLE)
    expect(argument.value.name.value).toBe('readBy')
  })

  it('is read by the thread off its first page, and by the beat off its answer -- and only there', () => {
    expect(readOff(codeOf('../components/Chat/ChatThread.tsx'), 'partnerReadUpTo')).toEqual([
      'firstPage',
      'firstPage',
    ])
    const beat = codeOf('../composables/useChatUpdates.js')
    expect(readOff(beat, 'readUpTo')).toEqual(['update'])
    expect(beat).toMatch(/variables: \{[^}]*\breadBy\b[^}]*\}/)
    // Gegenprobe on the stripping: the comments name the fields as well, and are gone.
    expect(read('../composables/useChatUpdates.js')).toMatch(/`readUpTo`/)
  })
})
