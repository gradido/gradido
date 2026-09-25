// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// A field the contact list reads off a contact but never asks for comes back undefined, and for
// the gold dot that is silence rather than a crash: `undefined > 0` is false, no dot is drawn,
// and every spec that hands a component a made-up row stays green. So the files are held
// against the fragment both contact documents send -- as balanceFields.spec.js does for the
// balance.

const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')

/** Everything that draws a contact from contactListQuery or contactByMemberQuery. */
const READERS = [
  '../components/Contacts/ContactRow.vue',
  '../components/Contacts/ContactTiles.vue',
  '../components/Contacts/contactDisplay.js',
  '../components/Contacts/ContactWindow.vue',
  '../components/Template/RightSide/ContactsPanel.vue',
  '../components/Template/RightSide/ContactsStrip.vue',
  '../pages/Contacts.vue',
]

describe('contactFields', () => {
  const documents = read('./contacts.graphql')
  const fragment = documents.match(/fragment contactFields on Contact \{([\s\S]*?)\n\}/)[1]
  const requested = fragment
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split(/[\s{]/)[0])

  it('asks for every field the list, the column and the window read off a contact', () => {
    const source = READERS.map(read).join('\n')
    const readOff = [
      ...new Set([...source.matchAll(/\bcontact\??\.([a-zA-Z]+)/g)].map((m) => m[1])),
    ]

    expect(readOff).toContain('unreadChatMessages')
    expect(requested).toEqual(expect.arrayContaining(readOff))
  })

  // One fragment for both documents, so a window opened from a booking row cannot come to know
  // a contact differently from one opened from the list.
  it('is the fragment both contact documents send', () => {
    for (const name of ['contactListQuery', 'contactByMemberQuery']) {
      const body = documents.split(`query ${name}`)[1].split(/\n(?:query|mutation) /)[0]
      expect(body).toContain('...contactFields')
    }
  })
})
