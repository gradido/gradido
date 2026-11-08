import { dbTransactionLinkRedeemed } from 'database'
import { removeLargeThankYouGreetingPicture } from './ThankYouGreetingPicture.logic'

export async function storeLinkAsRedeemed(
  transactionLink: { id: number; code: string },
  redeemedBy: number,
  redeemedAt: Date,
): Promise<boolean> {
  dbTransactionLinkRedeemed(transactionLink.id, redeemedBy, redeemedAt)
  // The thank-you is accepted: the large rendition of a greeting's own picture has served the
  // page the link opened as, and goes -- on this way of accepting, from another community, as
  // on redeemTransactionLink's. After the mark is written, and it never throws; most links have
  // no picture.
  await removeLargeThankYouGreetingPicture(transactionLink.code)
  return true
}
