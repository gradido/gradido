// AI-GENERATED — not an architecture reference
import { Event as DbEvent, User as DbUser } from 'database'

import { Event } from './Event'
import { EventType } from './EventType'

// An account opened with a table code (E-017): the guest is the affected user, the member
// who showed the code is the acting one. It is what makes the table registrations countable
// on their own, apart from every other registration with a referrer.
export const EVENT_USER_REGISTER_PRESENCE = async (user: DbUser, host: DbUser): Promise<DbEvent> =>
  Event(EventType.USER_REGISTER_PRESENCE, user, host).save()
