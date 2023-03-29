import { User as DbUser } from '@entity/User'
import { Event as DbEvent } from '@entity/Event'
import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_ADMIN_USER_UNDELETE = async (
  user: DbUser,
  moderator: DbUser,
): Promise<DbEvent> => Event(EventType.ADMIN_USER_UNDELETE, user, moderator).save()
