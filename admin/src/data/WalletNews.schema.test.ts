// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { Kind, type OperationDefinitionNode, parse } from 'graphql'
import * as v from 'valibot'
import { walletNewsSchema } from './WalletNews.schema'

// The schema is the reader of the answer, by the aliases the document gives its fields: a key it
// reads that the document does not ask for throws in v.parse, and the number at the face would
// never come. The tests of the bar make their answers up, so this holds the two files against
// each other, in both directions.
const document = parse(
  readFileSync(new URL('../graphql/moderatorWalletNews.graphql', import.meta.url), 'utf8'),
)
const [operation] = document.definitions as OperationDefinitionNode[]
const asked = operation.selectionSet.selections.flatMap((selection) =>
  selection.kind === Kind.FIELD
    ? [
        {
          key: (selection.alias ?? selection.name).value,
          fields: (selection.selectionSet?.selections ?? []).flatMap((inner) =>
            inner.kind === Kind.FIELD ? [inner.name.value] : [],
          ),
        },
      ]
    : [],
)
const read = Object.entries(walletNewsSchema.entries).map(([key, entry]) => {
  const inner = 'wrapped' in entry ? entry.wrapped : entry
  return { key, fields: 'entries' in inner ? Object.keys(inner.entries) : [] }
})

describe('moderatorWalletNews and its reader', () => {
  it('ask for what the reader reads, and read what they ask for', () => {
    expect(asked).toEqual(read)
  })

  // supportTicketsMenu and countContributionsInProgress answer null where the server could not
  // count: the reader takes that, or the number at the face would stop for good
  it('read an answer whose support and contributions the server could not count', () => {
    const answer = {
      walletChat: { unreadConversations: 1 },
      walletSupport: null,
      walletContributions: null,
    }
    expect(v.parse(walletNewsSchema, answer)).toEqual(answer)
  })

  it('ask the three marks of the wallet, under aliases of their own', () => {
    expect(
      operation.selectionSet.selections.map((selection) =>
        selection.kind === Kind.FIELD ? selection.name.value : '',
      ),
    ).toEqual(['newChatMessagesSince', 'supportTicketsMenu', 'countContributionsInProgress'])
    expect(asked.map(({ key }) => key)).toEqual([
      'walletChat',
      'walletSupport',
      'walletContributions',
    ])
  })
})
