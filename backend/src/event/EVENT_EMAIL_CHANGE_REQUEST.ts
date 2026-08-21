// AI-GENERATED — not an architecture reference
import { Event as DbEvent, User as DbUser } from 'database'

import { Event } from './Event'
import { EventType } from './EventType'

// Written when a member asks for a new address. Besides the record, it is the rate limit:
// the pending row can be cancelled and recreated at will, this event cannot.
export const EVENT_EMAIL_CHANGE_REQUEST = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.EMAIL_CHANGE_REQUEST, user, user).save()
