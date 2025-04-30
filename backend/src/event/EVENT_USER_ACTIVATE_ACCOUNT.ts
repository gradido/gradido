import { Event as DbEvent } from '@entity/Event'
import { User as DbUser } from '@entity/User'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_USER_ACTIVATE_ACCOUNT = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.USER_ACTIVATE_ACCOUNT, user, user).save()
