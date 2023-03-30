import { Event as DbEvent } from '@entity/Event'
import { User as DbUser } from '@entity/User'

import { Event, EventType } from './Event'

export const EVENT_EMAIL_ADMIN_CONFIRMATION = async (
  user: DbUser,
  moderator: DbUser,
): Promise<DbEvent> => Event(EventType.EMAIL_ADMIN_CONFIRMATION, user, moderator).save()
