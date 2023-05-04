import { Event as DbEvent } from '@entity/Event'
import { User as DbUser } from '@entity/User'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_NEWSLETTER_UNSUBSCRIBE = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.NEWSLETTER_UNSUBSCRIBE, user, user).save()
