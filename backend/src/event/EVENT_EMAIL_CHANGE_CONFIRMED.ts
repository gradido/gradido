// AI-GENERATED — not an architecture reference
import { Event as DbEvent, User as DbUser } from 'database'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_EMAIL_CHANGE_CONFIRMED = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.EMAIL_CHANGE_CONFIRMED, user, user).save()
