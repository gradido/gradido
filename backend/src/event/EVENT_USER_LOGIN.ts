import { Event as DbEvent } from 'database'
import { User as DbUser } from 'database'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_USER_LOGIN = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.USER_LOGIN, user, user).save()
