// AI-GENERATED — not an architecture reference

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * ⛔ The pin behind a member's name reads three things off the member: the pair it addresses
 * the wallet's map by, and whether the member stands on that map. A field a document never
 * asks for arrives as `undefined` -- and the pin's answer to that is to stay away. No pin for
 * anybody, nothing crashes, and no component spec notices, because each of them invents its
 * own rows. So this holds the documents against the component instead, in both places the
 * pin stands: the member search and the member under a contribution.
 */
const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')

// Without the comments: a field named in an explanation is not a field that is asked for, and
// both the component and the fragment explain themselves.
const withoutComments = (source) =>
  source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*(\/\/|#).*$/gm, '')

const readOffTheMember = () => [
  ...new Set(
    [
      ...withoutComments(read('../components/MemberMapPin.vue')).matchAll(/\bmember\??\.(\w+)/g),
    ].map((match) => match[1]),
  ),
]

const fieldsOf = (block) => withoutComments(block).split(/\s+/).filter(Boolean)

describe('what the pin behind a member reads, and what the documents ask for', () => {
  it('reads the pair and the yes or no, and nothing else', () => {
    expect(readOffTheMember().sort()).toEqual(['communityUuid', 'findableOnMap', 'gradidoID'])
  })

  it('is asked for on every row of the member search', () => {
    const rows = read('./searchUsers.js').match(/userList \{([^}]*)\}/)[1]

    // The search proves itself: this is the block that carries the row.
    expect(fieldsOf(rows)).toContain('alias')
    for (const field of readOffTheMember()) {
      expect(fieldsOf(rows)).toContain(field)
    }
  })

  it('is asked for with the member of a contribution', () => {
    const fragment = read('./fragments.graphql').match(
      /fragment UserCommonFields on User \{([^}]*)\}/,
    )[1]

    expect(fieldsOf(fragment)).toContain('alias')
    for (const field of readOffTheMember()) {
      expect(fieldsOf(fragment)).toContain(field)
    }
  })

  // The list and the one row that replaces a row of it after the moderator acted: both hand
  // the member to the same component, so both spread the fragment. (That it is spread on a
  // member is the schema's to say, and backend/src/graphql/documents.test.ts asks it.)
  it.each(['./adminListContributions.graphql', './getContribution.graphql'])(
    'travels with the member in %s',
    (document) => {
      expect(withoutComments(read(document))).toContain('...UserCommonFields')
    },
  )
})
