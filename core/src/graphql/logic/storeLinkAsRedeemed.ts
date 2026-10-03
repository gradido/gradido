import { TransactionLink as DbTransactionLink, User as DbUser } from 'database'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'
import { removeLargeThankYouGreetingPicture } from '../../logic/ThankYouGreetingPicture.logic'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.logic.storeLinkAsRedeemed`)

export async function storeLinkAsRedeemed(
  dbTransactionLink: DbTransactionLink,
  foreignUser: DbUser,
  creationDate: Date,
): Promise<boolean> {
  try {
    dbTransactionLink.redeemedBy = foreignUser.id
    dbTransactionLink.redeemedAt = creationDate
    await DbTransactionLink.save(dbTransactionLink)
  } catch (err) {
    logger.error('error: ', err)
    return false
  }
  // The thank-you is accepted: the large rendition of a greeting's own picture has served the
  // page the link opened as, and goes -- on this way of accepting, from another community, as
  // on redeemTransactionLink's. After the mark is written, and it never throws; most links have
  // no picture.
  await removeLargeThankYouGreetingPicture(dbTransactionLink.code)
  return true
}
