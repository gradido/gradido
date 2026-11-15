// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import * as v from 'valibot'
import { supportIsTheirs } from './Moderator.logic'
import { type Moderator, moderatorSchema } from './Moderator.schema'

const signedIn = (more: Partial<Moderator>): Moderator => ({
  firstName: 'Peter',
  lastName: 'Lustig',
  alias: 'peter',
  role: 'MODERATOR',
  gradidoID: 'a6c9b4a2-0f2b-4b8e-9f43-3c3c1b1e9d01',
  communityUuid: '2d7f7a1e-6b8e-4a0a-9c3e-8f1f6a2b9c11',
  language: 'de',
  avatar: null,
  avatarColorIndex: null,
  visibleCreationGroups: [],
  seesAllCreationGroups: true,
  seesUntagged: true,
  handlesSupportTickets: false,
  ...more,
})

describe('supportIsTheirs', () => {
  it('is yes for a moderator or KI-moderator with the tick, no without it', () => {
    expect(supportIsTheirs(signedIn({ handlesSupportTickets: true }))).toBe(true)
    expect(supportIsTheirs(signedIn({ role: 'MODERATOR_AI', handlesSupportTickets: true }))).toBe(
      true,
    )
    expect(supportIsTheirs(signedIn({}))).toBe(false)
    expect(supportIsTheirs(signedIn({ role: 'MODERATOR_AI' }))).toBe(false)
  })

  it('is yes for an administrator, with the tick and without', () => {
    expect(supportIsTheirs(signedIn({ role: 'ADMIN' }))).toBe(true)
    expect(supportIsTheirs(signedIn({ role: 'ADMIN', handlesSupportTickets: true }))).toBe(true)
  })

  it('is no where nobody is signed in', () => {
    expect(supportIsTheirs(null)).toBe(false)
  })

  // what the admin kept before K6: no tick at all -- an administrator keeps the support, a
  // moderator has none until they come in through the wallet again
  it('reads a state kept from before the tick: yes for an administrator, no for a moderator', () => {
    const { handlesSupportTickets: _left, ...before } = signedIn({})
    expect(supportIsTheirs(v.parse(moderatorSchema, { ...before, role: 'ADMIN' }))).toBe(true)
    expect(supportIsTheirs(v.parse(moderatorSchema, before))).toBe(false)
  })
})
