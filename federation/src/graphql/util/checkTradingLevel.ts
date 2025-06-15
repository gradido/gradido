import { CONFIG } from '@/config'
import { LOG4JS_GRAPHQL_UTIL_CATEGORY_NAME } from '@/graphql/util'
import { Community as DbCommunity } from 'database'
import { Decimal } from 'decimal.js-light'
import { getLogger } from 'log4js'

export async function checkTradingLevel(homeCom: DbCommunity, amount: Decimal): Promise<boolean> {
  const logger = getLogger(`${LOG4JS_GRAPHQL_UTIL_CATEGORY_NAME}.checkTradingLevel`)

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
  if (new Decimal(tradingLevel.AMOUNT) < amount) {
    logger.warn(
      `X-Com: tradingLevel only allows to receive coins lower than amount of ${tradingLevel.AMOUNT}`,
    )
    return false
  }
  return true
}
