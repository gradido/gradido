// AI-GENERATED — not an architecture reference
import { Event as DbEvent, User as DbUser } from 'database'
import { EntityManager } from 'typeorm'

import { Event } from './Event'
import { EventType } from './EventType'

/** Inside the caller's transaction when a manager is given: the change and its record commit together. */
export const EVENT_EMAIL_CHANGE_CONFIRMED = async (
  user: DbUser,
  manager?: EntityManager,
): Promise<DbEvent> => {
  const event = Event(EventType.EMAIL_CHANGE_CONFIRMED, user, user)
  return manager ? manager.save(event) : event.save()
}
