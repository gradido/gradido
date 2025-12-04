import { TransactionLink as DbTransactionLink, User as DbUser } from 'database'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'

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
    return true
  } catch (err) {
    logger.error('error: ', err)
    return false
  }
}
