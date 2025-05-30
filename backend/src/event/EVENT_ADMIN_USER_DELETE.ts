import { Event as DbEvent, User as DbUser } from 'database'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_ADMIN_USER_DELETE = async (user: DbUser, moderator: DbUser): Promise<DbEvent> =>
  Event(EventType.ADMIN_USER_DELETE, user, moderator).save()
