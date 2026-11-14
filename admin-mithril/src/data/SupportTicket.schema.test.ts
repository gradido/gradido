// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { Kind, type OperationDefinitionNode, parse, type SelectionSetNode } from 'graphql'
import type * as v from 'valibot'
import { supportThreadSchema, supportTicketListSchema } from './SupportTicket.schema'

// The schema is the reader of an answer: a key it asks for that the document does not ask the
// server for throws in v.parse, and the page stands empty without a word. The tests of the pages
// make their answers up, so this holds the two files against each other.
const document = parse(
  readFileSync(
    new URL('../../../admin/src/graphql/supportTickets.graphql', import.meta.url),
    'utf8',
  ),
)

const operation = (name: string) => {
  const found = document.definitions.find(
    (definition): definition is OperationDefinitionNode =>
      definition.kind === Kind.OPERATION_DEFINITION && definition.name?.value === name,
  )
  if (!found) {
    throw new Error(`no operation ${name}`)
  }
  return found.selectionSet
}

type Schema = v.GenericSchema & {
  entries?: Record<string, Schema>
  wrapped?: Schema
  item?: Schema
}

// the object a key reads, through nullable and array
const objectOf = (schema: Schema): Schema | undefined => {
  if (schema.entries) {
    return schema
  }
  const inner = schema.wrapped ?? schema.item
  return inner ? objectOf(inner) : undefined
}

// every key the schema reads that the selection does not ask for, with its path
const notAsked = (schema: Schema, selection: SelectionSetNode | undefined, path = ''): string[] =>
  Object.entries(schema.entries ?? {}).flatMap(([key, entry]) => {
    const field = selection?.selections.find(
      (node) => node.kind === Kind.FIELD && node.name.value === key,
    )
    if (!field || field.kind !== Kind.FIELD) {
      return [`${path}${key}`]
    }
    const inner = objectOf(entry)
    return inner ? notAsked(inner, field.selectionSet, `${path}${key}.`) : []
  })

describe('the support documents and the schemas that read their answers', () => {
  it('asks for everything the list schema reads, the member included', () => {
    expect(notAsked(supportTicketListSchema, operation('adminListSupportTickets'))).toEqual([])
  })

  it('asks for everything the thread schema reads, the remark included', () => {
    expect(notAsked(supportThreadSchema, operation('adminListSupportTicketMessages'))).toEqual([])
  })

  it('notices a key the document does not ask for', () => {
    const narrower = parse('query { adminListSupportTickets { count } }')
    const selection = (narrower.definitions[0] as OperationDefinitionNode).selectionSet
    expect(notAsked(supportTicketListSchema, selection)).toEqual([
      'adminListSupportTickets.tickets',
    ])
  })
})
