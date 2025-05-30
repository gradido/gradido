import { CONFIG } from '@/config'
import { federationLogger as logger } from '@/server/logger'
import { Community as DbCommunity } from 'database'
import { Decimal } from 'decimal.js-light'

export async function checkTradingLevel(homeCom: DbCommunity, amount: Decimal): Promise<boolean> {
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
