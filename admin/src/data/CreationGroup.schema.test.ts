// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import * as v from 'valibot'
import { keptHandledCreationGroupsField } from './CreationGroup.schema'

// The field as the kept state of the admin holds it (admin.store.ts): a state is kept across
// deliveries, and one that the schema refused would be thrown away whole, the token with it.
const state = v.object({
  openCreations: v.optional(v.number(), 0),
  handled: keptHandledCreationGroupsField,
})
const read = (kept: unknown) => v.safeParse(state, kept)

describe('keptHandledCreationGroupsField', () => {
  it('reads a state kept from before "Meine Gruppen" as no choice, and keeps the rest', () => {
    expect(read({ openCreations: 4 })).toMatchObject({
      success: true,
      output: { openCreations: 4, handled: null },
    })
  })

  it('reads a choice it cannot read as no choice, and keeps the rest', () => {
    expect(read({ openCreations: 4, handled: { of: 1 } })).toMatchObject({
      success: true,
      output: { openCreations: 4, handled: null },
    })
  })

  it('keeps a choice and whose it is', () => {
    const handled = { of: 'a6c9b4a2-0f2b-4b8e-9f43-3c3c1b1e9d01', groupIds: [3], untagged: false }
    expect(read({ handled })).toMatchObject({ success: true, output: { handled } })
  })
})
