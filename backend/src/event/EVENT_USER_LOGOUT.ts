import { Event as DbEvent } from '@entity/Event'
import { User as DbUser } from '@entity/User'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_USER_LOGOUT = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.USER_LOGOUT, user, user).save()
