import { User as DbUser } from '@entity/User'
import { Event as DbEvent } from '@entity/Event'

import { Event, EventType } from './Event'

export const EVENT_USER_LOGIN = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.USER_LOGIN, user, user).save()
