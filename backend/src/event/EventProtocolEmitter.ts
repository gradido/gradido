import { Event } from '@/event/Event'
import { backendLogger as logger } from '@/server/logger'
import { EventProtocol } from '@entity/EventProtocol'
import CONFIG from '@/config'

export const writeEvent = async (event: Event): Promise<EventProtocol | null> => {
  if (CONFIG.EVENT_PROTOCOL_DISABLED) {
    logger.info('EventProtocol is disabled', CONFIG.EVENT_PROTOCOL_DISABLED)
    return null
  }

  logger.info('writeEvent', event)
  const dbEvent = new EventProtocol()
  dbEvent.type = event.type
  dbEvent.createdAt = event.createdAt
  dbEvent.userId = event.userId
  dbEvent.xUserId = event.xUserId || null
  dbEvent.xCommunityId = event.xCommunityId || null
  dbEvent.contributionId = event.contributionId || null
  dbEvent.transactionId = event.transactionId || null
  dbEvent.amount = event.amount || null
  return dbEvent.save()
}
