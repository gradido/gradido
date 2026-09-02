// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'bun:test'

import { isAliasEraName } from './storedUserName'

/**
 * The gate that keeps a legacy stored name out of the unguarded `User.alias` field -- and
 * out of the contact search, which reads the same column.
 *
 * ⛔ Which change should make this red: anything that lets an assembled "Firstname
 * Lastname" through. That is the whole point -- `alias` is the field the real-name guard
 * does NOT cover, so a yes here is a real name in front of every reader.
 */
describe('isAliasEraName', () => {
  describe('says yes to what an alias can be', () => {
    it.each(['bob', 'peterl', 'bibi_bloxberg', 'a-team', 'j_doe', 'garrick', 'user123'])(
      '%s',
      (name) => {
        expect(isAliasEraName(name)).toBe(true)
      },
    )
  })

  describe('says no to a legacy assembled name', () => {
    // Every one of these carries the space that TransactionResolver's split relies on,
    // which is exactly why the shape can tell the two eras apart.
    it.each([
      'Bob der Baumeister',
      'Peter Lustig',
      'Bibi Bloxberg',
      ' Lustig',
      'Anna van Dijk',
      'José de la Cruz',
    ])('%s', (name) => {
      expect(isAliasEraName(name)).toBe(false)
    })
  })

  describe('says no to what is not a name at all', () => {
    it.each([null, undefined, '', '  '])('%s', (value) => {
      expect(isAliasEraName(value)).toBe(false)
    })

    // The alias rules themselves: under three characters, over twenty, or characters an
    // alias may not carry. Each of these could only be a legacy value.
    it.each(['ab', 'a', 'a'.repeat(21), 'bob@baumeister.de', 'Bob!', '_bob', 'bob__baum'])(
      '%s',
      (value) => {
        expect(isAliasEraName(value)).toBe(false)
      },
    )
  })

  // The residue, named so nobody reads the gate as watertight: a legacy first name that
  // happens to be one alias-shaped word cannot be told from an alias by shape alone.
  it('cannot tell a single-word legacy name from an alias, and says so here', () => {
    expect(isAliasEraName('Bernd')).toBe(true)
  })
})
