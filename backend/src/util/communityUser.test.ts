// AI-GENERATED — not an architecture reference

import { CONFIG } from '@/config'

import { communityDbUser, communityUser } from './communityUser'

/**
 * The stand-in a CREATION booking is linked to.
 *
 * ⛔ Written because the creation line had NO test, and that is how it came to be read as
 * "the moderator's alias": `TransactionResolver` puts this stand-in into the linkedUser
 * slot for every CREATION unconditionally, so whatever stands here is what the wallet
 * prints on the creation line. It renders `alias || gradidoID` (see
 * `Transactions/GddTransaction.vue`), which is why the alias -- not the name fields --
 * is the value that has to be right.
 */
describe('communityUser', () => {
  it('carries the configured community name, not a placeholder', () => {
    expect(communityDbUser.alias).toBe(CONFIG.COMMUNITY_NAME)
  })

  it('gives the wallet a name to print rather than an identifier', () => {
    // `alias || gradidoID` is the wallet's rule; an empty alias would silently fall
    // through to the raw UUID on every creation row.
    expect(communityUser.alias).toBeTruthy()
    expect(communityUser.alias || communityUser.gradidoID).toBe(CONFIG.COMMUNITY_NAME)
  })

  /**
   * ⛔ The stand-in is an object LITERAL cast to the entity type -- it is never built
   * through the entity's constructor, so `communityDbUser instanceof User` is false. The
   * model's constructor has to tell the two user shapes apart all the same, and while it
   * did so with `instanceof` this stand-in was read as a Drizzle row: `gradidoId` instead
   * of `gradidoID`, and nothing is there, so the field came out undefined.
   *
   * That is not a cosmetic loss. `TransactionResolver` puts this stand-in into the
   * linkedUser slot of every CREATION row, the wallet's transaction list asks for
   * `linkedUser { gradidoID }`, and the field is `String!` -- so one member's booking
   * list with one creation in it takes the whole query down with a non-nullable-field
   * error, and the test above stays green because the alias is what it checks.
   *
   * The assertion is deliberately on the constructed model, not on the literal: the
   * literal never had the problem.
   */
  it('carries its identifier through the model, not only in the literal', () => {
    expect(communityUser.gradidoID).toBe(communityDbUser.gradidoID)
    expect(communityUser.gradidoID).toBeTruthy()
  })

  // Same branch, same reason: read off the wrong spelling these silently became the
  // Drizzle branch's fallbacks instead of what the literal says.
  it('keeps the settings the literal spells out', () => {
    expect(communityUser.avatarVisibleToMembers).toBe(false)
    expect(communityUser.creationAllowed).toBe(false)
    expect(communityUser.role).toBeNull()
  })
})
