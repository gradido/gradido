// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { bookingsWithMemberRoute, memberFromQuery, memberQueryKey } from './bookingsRoute'

const MARGRET = { gradidoID: 'margret-id', communityUuid: 'home-uuid' }

describe('bookingsRoute', () => {
  // The one test that ties the two ends: whatever the window builds, the page reads back.
  it('reads back the member the window sent', () => {
    const { path, query } = bookingsWithMemberRoute(MARGRET)
    expect(path).toBe('/transactions')
    expect(memberFromQuery(query)).toEqual(MARGRET)
  })

  it('sends the id alone for a member without a community, and reads it back so', () => {
    const { query } = bookingsWithMemberRoute({ gradidoID: 'x', communityUuid: null })
    expect(memberFromQuery(query)).toEqual({ gradidoID: 'x', communityUuid: null })
  })

  it('reads no narrowing from a plain address', () => {
    expect(memberFromQuery({})).toBeNull()
    expect(memberFromQuery(undefined)).toBeNull()
  })

  // What a hand-edited address can carry, and what the server would refuse.
  it('reads no narrowing from an array, an empty value or an over-long id', () => {
    expect(memberFromQuery({ with: ['a', 'b'], community: 'home-uuid' })).toBeNull()
    expect(memberFromQuery({ with: '', community: 'home-uuid' })).toBeNull()
    expect(memberFromQuery({ with: 'x'.repeat(37), community: 'home-uuid' })).toBeNull()
    // An over-long community is dropped, the id stays: the server fills in its own.
    expect(memberFromQuery({ with: 'margret-id', community: 'x'.repeat(37) })).toEqual({
      gradidoID: 'margret-id',
      communityUuid: null,
    })
  })

  it('keys the same pair to the same string, and nobody to nothing', () => {
    expect(memberQueryKey(memberFromQuery(bookingsWithMemberRoute(MARGRET).query))).toBe(
      memberQueryKey(MARGRET),
    )
    expect(memberQueryKey({ gradidoID: 'x', communityUuid: null })).toBe('x/')
    expect(memberQueryKey(null)).toBe('')
  })
})
