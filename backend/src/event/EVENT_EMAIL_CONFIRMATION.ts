import { Event as DbEvent, User as DbUser } from 'database'
import { EntityManager } from 'typeorm'

import { Event } from './Event'
import { EventType } from './EventType'

// Inside the caller's transaction when a manager is given. registerAccount holds its own
// connection until it commits; a write over a second one from the pool meanwhile let
// simultaneous registrations use up the pool, each holding one and waiting for another.
export const EVENT_EMAIL_CONFIRMATION = async (
  user: DbUser,
  manager?: EntityManager,
): Promise<DbEvent> => {
  const event = Event(EventType.EMAIL_CONFIRMATION, user, user)
  return manager ? manager.save(event) : event.save()
}
