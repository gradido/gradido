import type { Event as DbEvent } from '@entity/Event'
import type { User as DbUser } from '@entity/User'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_ADMIN_USER_ROLE_SET = async (
  user: DbUser,
  moderator: DbUser,
): Promise<DbEvent> => Event(EventType.ADMIN_USER_ROLE_SET, user, moderator).save()
