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
})
