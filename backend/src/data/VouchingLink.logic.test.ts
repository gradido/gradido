// AI-GENERATED — not an architecture reference
import { TransactionLinkWithOwner } from 'database'
import { linkVouches } from './VouchingLink.logic'

const NOW = new Date('2026-10-03T10:00:00.000Z')
const HOUR_MS = 60 * 60 * 1000
const OWNER_ID = 5

// An open link of a confirmed member of this community: the one case in which it vouches.
const link = (changed: Partial<TransactionLinkWithOwner> = {}): TransactionLinkWithOwner => ({
  userId: OWNER_ID,
  validUntil: new Date(NOW.getTime() + 13 * 24 * HOUR_MS),
  redeemedAt: null,
  redeemedBy: null,
  deletedAt: null,
  ownerDeletedAt: null,
  ownerForeign: false,
  ownerEmailChecked: true,
  ...changed,
})

describe('linkVouches', () => {
  it('vouches with an open link of a confirmed member', () => {
    expect(linkVouches(link(), OWNER_ID, NOW)).toBe(true)
  })

  // Each line takes one thing away from the link above, and only that.
  it.each<[string, Partial<TransactionLinkWithOwner>]>([
    ['the link was deleted', { deletedAt: new Date(NOW.getTime() - HOUR_MS) }],
    ['the thank-you was accepted, by its date', { redeemedAt: new Date(NOW.getTime() - HOUR_MS) }],
    ['the thank-you was accepted, by who took it', { redeemedBy: 9 }],
    ['the link has run out', { validUntil: new Date(NOW.getTime() - 1) }],
    ['the member who made it is deleted', { ownerDeletedAt: new Date(NOW.getTime() - HOUR_MS) }],
    ['the member who made it has not confirmed their address', { ownerEmailChecked: false }],
    ['its maker is a member of another community', { ownerForeign: true }],
  ])('does not vouch when %s', (_what, changed) => {
    expect(linkVouches(link(changed), OWNER_ID, NOW)).toBe(false)
  })

  it('does not vouch without a link, or without a member behind it', () => {
    expect(linkVouches(null, OWNER_ID, NOW)).toBe(false)
  })

  // The caller holds the lock of one member's row: the link has to be that member's.
  it('does not vouch for a member other than the one who made the link', () => {
    expect(linkVouches(link(), OWNER_ID + 1, NOW)).toBe(false)
  })

  // The same last moment redeemTransactionLink still takes the link at.
  it('still vouches at the very moment the link runs out, and no longer after it', () => {
    expect(linkVouches(link({ validUntil: NOW }), OWNER_ID, NOW)).toBe(true)
    expect(linkVouches(link({ validUntil: NOW }), OWNER_ID, new Date(NOW.getTime() + 1))).toBe(
      false,
    )
  })
})
