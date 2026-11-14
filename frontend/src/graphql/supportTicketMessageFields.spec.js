// AI-GENERATED — not an architecture reference

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// The thread of a support request is drawn by the contribution thread's own item, which says in
// its type `ContributionMessage` what it draws. A field missing from the question arrives as
// `undefined`, and nothing fails, because the tests hand the components made-up messages; a field
// more would carry something to the member the thread does not draw (a row number). So the
// fragment asks for exactly the fields of that type -- read from the files, not from a spec.

const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')

const fieldsOf = (block) =>
  block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('//'))
    .map((line) => line.split(':')[0].trim())

describe('supportTicketMessageFields', () => {
  it('asks for exactly the fields the thread draws, and so for no row number', () => {
    const drawn = fieldsOf(
      read('../components/ContributionMessages/ContributionMessagesListItem.tsx').match(
        /export type ContributionMessage = \{([^}]*)\}/,
      )[1],
    )
    const requested = fieldsOf(
      read('./supportTickets.graphql').match(
        /fragment supportTicketMessageFields on SupportTicketMessage \{([^}]*)\}/,
      )[1],
    )

    // The search proves itself: nine fields, the author's among them.
    expect(drawn).toHaveLength(9)
    expect(drawn).toContain('userGradidoID')
    expect([...requested].sort()).toEqual([...drawn].sort())
    expect(requested).not.toContain('userId')
  })
})
