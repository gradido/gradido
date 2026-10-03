// AI-GENERATED — not an architecture reference
import { TransactionLinkWithOwner } from 'database'

/**
 * Whether a member's redeem link vouches for an account that is opened with a password
 * (ZE-017 F5): somebody accepts the thank-you of the link and gets the account right there, as
 * at a table with a guarantor code (E-017). The link is the member's word for it, so it counts
 * only while both stand:
 *
 * - the link is open - not deleted, not accepted, not run out. Once the thank-you is taken, or
 *   gone, it invites nobody.
 * - the member who made it is a member of this community, not deleted, and their address is
 *   confirmed (E-018). An unconfirmed account may make links during its first 24 hours;
 *   without this, a fresh account opened the next.
 *
 * `guarantorId` is the member whose row the caller holds locked: the link has to be theirs.
 *
 * Two more rules stand with the caller, because they count rows under that lock: the member's
 * limit (GUARANTOR_LIMIT), and one account per link (RegisterUserFromVouchingLinkRole).
 *
 * Everything read here is written by this community alone (dbFindTransactionLinkWithOwner).
 */
export const linkVouches = (
  link: TransactionLinkWithOwner | null,
  guarantorId: number,
  now: Date,
): boolean =>
  link !== null &&
  link.userId === guarantorId &&
  link.deletedAt === null &&
  link.redeemedAt === null &&
  link.redeemedBy === null &&
  // The last moment a link can be accepted is the one redeemTransactionLink still takes.
  link.validUntil.getTime() >= now.getTime() &&
  link.ownerDeletedAt === null &&
  !link.ownerForeign &&
  link.ownerEmailChecked
