import { Event } from '@/event/Event'
import { backendLogger as logger } from '@/server/logger'
import { EventProtocol } from '@entity/EventProtocol'
import CONFIG from '@/config'

class EventProtocolEmitter {
  /* }extends EventEmitter { */
  private events: Event[]

  public addEvent(event: Event) {
    this.events.push(event)
  }

  public getEvents(): Event[] {
    return this.events
  }

  public isEnabled() {
    logger.info(`EventProtocol - isEnabled=${CONFIG.EVENT_PROTOCOL_ENABLED}`)
    return CONFIG.EVENT_PROTOCOL_ENABLED === true
  }

  public async writeEvent(event: Event): Promise<void> {
    if (eventProtocol.isEnabled()) {
      logger.info(`writeEvent(${JSON.stringify(event)})`)
      const dbEvent = new EventProtocol()
      dbEvent.type = event.type
      dbEvent.createdAt = event.createdAt
      dbEvent.userId = event.userId
      if (event.xUserId) dbEvent.xUserId = event.xUserId
      if (event.xCommunityId) dbEvent.xCommunityId = event.xCommunityId
      if (event.contributionId) dbEvent.contributionId = event.contributionId
      if (event.transactionId) dbEvent.transactionId = event.transactionId
      if (event.amount) dbEvent.amount = event.amount
      await dbEvent.save()
    }
  }
}
export const eventProtocol = new EventProtocolEmitter()
