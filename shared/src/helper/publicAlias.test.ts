// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'bun:test'

import { publicAlias } from './publicAlias'

const ID = '3a2f6f1e-6c1a-4e1a-9d3e-2f1b7c8d9e01'

/**
 * The one rule three packages use to decide what a member may be called in front of
 * anybody else: the backend answers the wallet with it, `core` writes it into the mails
 * a third party reads, the federation carries it across a community border.
 *
 * ⛔ Which change should make this red: anything that lets a real name through, or that
 * hands a caller nothing where a name was expected. Both have happened -- the second one
 * as a crash, when `Profile.firstname` reached a `.length` check as undefined.
 */
describe('publicAlias', () => {
  it('names a member by their alias', () => {
    expect(publicAlias('bibi', ID)).toBe('bibi')
    expect(publicAlias('bibi_bloxberg', ID)).toBe('bibi_bloxberg')
    expect(publicAlias('a-team', ID)).toBe('a-team')
  })

  // The FULL identifier, not a shortened one: findUserByIdentifier resolves a UUID as
  // readily as an alias, so this is a working address rather than a placeholder.
  it('falls back to the whole identifier when there is no alias', () => {
    expect(publicAlias(null, ID)).toBe(ID)
    expect(publicAlias(undefined, ID)).toBe(ID)
    expect(publicAlias('', ID)).toBe(ID)
  })

  /**
   * The case that separates this rule from a bare `alias || gradidoID`, and the reason
   * it exists at all: a stored alias of one or two characters predates the rule and is
   * not one. The till's receipt used to let those through while every other screen
   * showed the identifier, so the same member read two different ways.
   */
  it('rejects a legacy alias that is too short to be one', () => {
    expect(publicAlias('a', ID)).toBe(ID)
    expect(publicAlias('ab', ID)).toBe(ID)
    expect(publicAlias('abc', ID)).toBe('abc')
  })

  /**
   * ⚠️ The type says `gradidoID` is required, and every persisted user has one -- but
   * TypeScript's guarantee stops at the type boundary and this is called from three
   * packages. `Profile` puts the result straight into a `.length` check, where undefined
   * is a crash rather than a blank name.
   */
  it('never hands back nothing at all', () => {
    expect(publicAlias(null, undefined as unknown as string)).toBe('')
    expect(publicAlias('ab', undefined as unknown as string)).toBe('')
    expect(publicAlias('', '')).toBe('')
  })
})
