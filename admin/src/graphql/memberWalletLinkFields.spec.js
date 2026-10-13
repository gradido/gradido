// AI-GENERATED — not an architecture reference

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * ⛔ What stands behind a member's name -- the pin onto the wallet's map, or the arrow into its
 * send form -- reads a handful of things off the member: the pair it addresses the wallet by,
 * whether the member stands on the map, whether the account was deleted, and the member's
 * number. A field a document never asks for arrives as `undefined` -- and the answer to that
 * is to stay away. No pin and no arrow for anybody, nothing crashes, and no component spec
 * notices, because each of them invents its own rows. So this holds the documents against the
 * component instead, in both places it stands: the member search and the member under a
 * contribution.
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
      ...withoutComments(read('../components/MemberWalletLink.vue')).matchAll(
        /\bmember\??\.(\w+)/g,
      ),
    ].map((match) => match[1]),
  ),
]

const fieldsOf = (block) => withoutComments(block).split(/\s+/).filter(Boolean)

// The member's number has two names: `userId` on a row of the member search (UserAdmin), `id`
// with the member of a contribution (User). The component reads whichever is there.
const NUMBER_IN_THE_SEARCH = 'userId'
const NUMBER_WITH_A_CONTRIBUTION = 'id'

describe('what stands behind a member reads, and what the documents ask for', () => {
  it('reads the pair, the yes or no, the deletion and the number, and nothing else', () => {
    expect(readOffTheMember().sort()).toEqual([
      'communityUuid',
      'deletedAt',
      'findableOnMap',
      'gradidoID',
      NUMBER_WITH_A_CONTRIBUTION,
      NUMBER_IN_THE_SEARCH,
    ])
  })

  it('is asked for on every row of the member search', () => {
    const rows = read('./searchUsers.js').match(/userList \{([^}]*)\}/)[1]

    // The search proves itself: this is the block that carries the row.
    expect(fieldsOf(rows)).toContain('alias')
    for (const field of readOffTheMember().filter((f) => f !== NUMBER_WITH_A_CONTRIBUTION)) {
      expect(fieldsOf(rows)).toContain(field)
    }
  })

  it('is asked for with the member of a contribution', () => {
    const fragment = read('./fragments.graphql').match(
      /fragment UserCommonFields on User \{([^}]*)\}/,
    )[1]

    expect(fieldsOf(fragment)).toContain('alias')
    for (const field of readOffTheMember().filter((f) => f !== NUMBER_IN_THE_SEARCH)) {
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
