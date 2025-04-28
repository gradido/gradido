import { Event as DbEvent } from 'database'
import { User as DbUser } from 'database'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_EMAIL_ADMIN_CONFIRMATION = async (
  user: DbUser,
  moderator: DbUser,
): Promise<DbEvent> => Event(EventType.EMAIL_ADMIN_CONFIRMATION, user, moderator).save()
