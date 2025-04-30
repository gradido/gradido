import type { Event as DbEvent } from '@entity/Event'
import type { User as DbUser } from '@entity/User'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_EMAIL_ADMIN_CONFIRMATION = async (
  user: DbUser,
  moderator: DbUser,
): Promise<DbEvent> => Event(EventType.EMAIL_ADMIN_CONFIRMATION, user, moderator).save()
