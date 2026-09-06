// AI-GENERATED — not an architecture reference
import { Event as DbEvent, User as DbUser } from 'database'

import { Event } from './Event'
import { EventType } from './EventType'

/**
 * The holder declared their account a project account (ES-021): creation is off from now
 * on. Affected and acting user are the same account — nobody acts on somebody else here.
 * Its timestamp is what the support mail later names as "declared at".
 */
export const EVENT_PROJECT_ACCOUNT_DECLARE = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.PROJECT_ACCOUNT_DECLARE, user, user).save()

/**
 * The holder asked for the creation right back (ES-021). Besides the record, this is the
 * rate limit: the mail to the support goes out at most once a day, and "when was the last
 * one" is read from here — there is no other row that could carry it.
 */
export const EVENT_CREATION_RIGHT_REQUEST = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.CREATION_RIGHT_REQUEST, user, user).save()
