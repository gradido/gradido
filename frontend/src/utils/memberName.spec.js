// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { memberAlias } from './memberName'

describe('memberAlias', () => {
  it('names a member by their alias', () => {
    expect(memberAlias({ alias: 'bibi', gradidoID: 'abc-123' })).toBe('bibi')
  })

  // The FULL identifier, not a shortened one: it is what can be pasted back into the send
  // form and resolved.
  it('falls back to the whole identifier when there is no alias', () => {
    expect(memberAlias({ alias: null, gradidoID: 'abc-123' })).toBe('abc-123')
    expect(memberAlias({ alias: '', gradidoID: 'abc-123' })).toBe('abc-123')
  })

  // Callers pass what an optional field handed them; a screen must not print "undefined".
  it('returns an empty string rather than nothing at all', () => {
    expect(memberAlias(undefined)).toBe('')
    expect(memberAlias(null)).toBe('')
    expect(memberAlias({})).toBe('')
  })
})
