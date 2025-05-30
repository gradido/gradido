import { Event as DbEvent, User as DbUser } from 'database'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_USER_INFO_UPDATE = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.USER_INFO_UPDATE, user, user).save()
