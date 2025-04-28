import { Event as DbEvent } from 'database'
import { User as DbUser } from 'database'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_EMAIL_ACCOUNT_MULTIREGISTRATION = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.EMAIL_ACCOUNT_MULTIREGISTRATION, user, { id: 0 } as DbUser).save()
