import { Event as DbEvent, User as DbUser } from 'database'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_EMAIL_CONFIRMATION = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.EMAIL_CONFIRMATION, user, user).save()
