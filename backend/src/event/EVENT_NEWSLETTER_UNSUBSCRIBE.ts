import { Event as DbEvent } from '@entity/Event'
import { User as DbUser } from '@entity/User'

import { Event, EventType } from './Event'

export const EVENT_NEWSLETTER_UNSUBSCRIBE = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.NEWSLETTER_UNSUBSCRIBE, user, user).save()
