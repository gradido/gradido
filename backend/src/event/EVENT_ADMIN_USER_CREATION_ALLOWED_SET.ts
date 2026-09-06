// AI-GENERATED — not an architecture reference
import { Event as DbEvent, User as DbUser } from 'database'

import { Event } from './Event'
import { EventType } from './EventType'

/**
 * An administrator switched a member's creation right on or off (ES-021). The member is
 * the affected user, the administrator the acting one — same shape as ADMIN_USER_ROLE_SET.
 * The direction is not on the row: the users table says where the switch stands now, and
 * the sequence of these rows says how it got there.
 */
export const EVENT_ADMIN_USER_CREATION_ALLOWED_SET = async (
  user: DbUser,
  moderator: DbUser,
): Promise<DbEvent> => Event(EventType.ADMIN_USER_CREATION_ALLOWED_SET, user, moderator).save()
