import { User as DbUser } from '@entity/User'
import { Event as DbEvent } from '@entity/Event'
import { Event, EventType } from './Event'

export const EVENT_ADMIN_SEND_CONFIRMATION_EMAIL = async (
  user: DbUser,
  moderator: DbUser,
): Promise<DbEvent> => Event(EventType.ADMIN_SEND_CONFIRMATION_EMAIL, user, moderator).save()
