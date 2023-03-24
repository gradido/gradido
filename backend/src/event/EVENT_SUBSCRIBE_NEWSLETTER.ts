import { User as DbUser } from '@entity/User'
import { Event as DbEvent } from '@entity/Event'
import { Event, EventType } from './Event'

export const EVENT_SUBSCRIBE_NEWSLETTER = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.SUBSCRIBE_NEWSLETTER, user, user).save()
