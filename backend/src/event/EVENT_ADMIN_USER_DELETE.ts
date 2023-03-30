import { User as DbUser } from '@entity/User'
import { Event as DbEvent } from '@entity/Event'

import { Event, EventType } from './Event'

export const EVENT_ADMIN_USER_DELETE = async (user: DbUser, moderator: DbUser): Promise<DbEvent> =>
  Event(EventType.ADMIN_USER_DELETE, user, moderator).save()
