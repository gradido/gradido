import { Event as DbEvent } from '@entity/Event'
import { User as DbUser } from '@entity/User'

import { Event, EventType } from './Event'

export const EVENT_NEWSLETTER_SUBSCRIBE = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.NEWSLETTER_SUBSCRIBE, user, user).save()
