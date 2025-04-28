import { Event as DbEvent } from 'database'
import { User as DbUser } from 'database'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_NEWSLETTER_SUBSCRIBE = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.NEWSLETTER_SUBSCRIBE, user, user).save()
