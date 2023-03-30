import { User as DbUser } from '@entity/User'
import { Event as DbEvent } from '@entity/Event'

import { Event, EventType } from './Event'

export const EVENT_EMAIL_CONFIRMATION = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.EMAIL_CONFIRMATION, user, user).save()
