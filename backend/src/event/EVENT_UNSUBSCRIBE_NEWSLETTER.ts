import { User as DbUser } from '@entity/User'
import { Event as DbEvent } from '@entity/Event'
import { Event, EventType } from './Event'

export const EVENT_UNSUBSCRIBE_NEWSLETTER = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.UNSUBSCRIBE_NEWSLETTER, user, user).save()
