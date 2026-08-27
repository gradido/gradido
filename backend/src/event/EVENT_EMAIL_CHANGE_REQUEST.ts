// AI-GENERATED — not an architecture reference
import { Event as DbEvent, User as DbUser } from 'database'
import { EntityManager } from 'typeorm'

import { Event } from './Event'
import { EventType } from './EventType'

// Written when a member asks for a new address. Besides the record, it is the rate limit:
// the pending row can be cancelled and recreated at will, this event cannot. Inside the
// caller's transaction when a manager is given, so the limit is read and written under
// the same lock.
export const EVENT_EMAIL_CHANGE_REQUEST = async (
  user: DbUser,
  manager?: EntityManager,
): Promise<DbEvent> => {
  const event = Event(EventType.EMAIL_CHANGE_REQUEST, user, user)
  return manager ? manager.save(event) : event.save()
}
