import type { Event as DbEvent } from '@entity/Event'
import type { User as DbUser } from '@entity/User'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_EMAIL_FORGOT_PASSWORD = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.EMAIL_FORGOT_PASSWORD, user, { id: 0 } as DbUser).save()
