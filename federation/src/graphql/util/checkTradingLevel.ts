import { Community as DbCommunity } from 'database'
import { getLogger } from 'log4js'
import { GradidoUnit } from 'shared'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

export async function checkTradingLevel(
  homeCom: DbCommunity,
  amount: GradidoUnit,
): Promise<boolean> {
  const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.util.checkTradingLevel`)

  const tradingLevel = CONFIG.FEDERATION_TRADING_LEVEL
  if (homeCom.url !== tradingLevel.RECEIVER_COMMUNITY_URL) {
    logger.warn(
      `X-Com: tradingLevel allows to receive coins only with url ${tradingLevel.RECEIVER_COMMUNITY_URL}`,
    )
    return false
  }
  if (!tradingLevel.SEND_COINS) {
    logger.warn(`X-Com: tradingLevel disable general x-com sendcoin actions!`)
    return false
  }
  if (GradidoUnit.fromNumber(tradingLevel.AMOUNT).comparedTo(amount) < 0) {
    logger.warn(
      `X-Com: tradingLevel only allows to receive coins lower than amount of ${tradingLevel.AMOUNT}`,
    )
    return false
  }
  return true
}
