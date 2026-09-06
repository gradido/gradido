// AI-GENERATED — not an architecture reference
import { RIGHTS } from './RIGHTS'

/**
 * What a PROJECT account may not do (ES-021): an account whose holder declared that it
 * belongs to an association, a project or a shop does not create Gradido — it receives
 * thanks. Everything that files or edits a creation is refused; receiving, sending,
 * viewing and self-management stay untouched.
 *
 * A deny-list rather than an allow-list, for the same reason as RESTRICTED_WHILE_UNCONFIRMED
 * next door: the person locked out here is the account's own holder, who asked for exactly
 * this. A forgotten entry leaves one creation path open a little longer; a forgotten entry
 * on an allow-list would break a harmless display. The missing "Create" menu item in the
 * wallet is the visible half; this list is what makes the blockade hold against a bare
 * API call ("so that nobody creates through the back door").
 *
 * OPEN_CREATIONS is on the list because the quota it shows would describe a month the
 * account can never spend. REDEEM_TRANSACTION_LINK is deliberately NOT here: the same right
 * covers receiving a thank-you card and redeeming a plain transfer link, and a project
 * account receives. Only the CONTRIBUTION-link branch of that resolver ("CL-" codes, which
 * file a creation) refuses a project account, with a guard of its own in the resolver.
 */
export const RESTRICTED_FOR_PROJECT_ACCOUNT = [
  RIGHTS.CREATE_CONTRIBUTION,
  RIGHTS.UPDATE_CONTRIBUTION,
  // The first creation books through its own interaction, not through createContribution.
  RIGHTS.FIRST_CREATION,
  RIGHTS.OPEN_CREATIONS,
]
