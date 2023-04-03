import { Event as DbEvent } from '@entity/Event'
import { User as DbUser } from '@entity/User'

import { Event, EventType } from './Event'

export const EVENT_EMAIL_FORGOT_PASSWORD = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.EMAIL_FORGOT_PASSWORD, user, { id: 0 } as DbUser).save()