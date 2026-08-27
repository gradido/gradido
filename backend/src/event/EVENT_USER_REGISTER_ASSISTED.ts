// AI-GENERATED — not an architecture reference
import { Event as DbEvent, User as DbUser } from 'database'

import { Event } from './Event'
import { EventType } from './EventType'

// An account created through the doorbell flow (EM-013): the guest is the affected
// user, the member whose mailbox rang — and who clicked the helper button — is the
// acting one. That keeps "who helped whom" answerable from the events alone.
export const EVENT_USER_REGISTER_ASSISTED = async (user: DbUser, host: DbUser): Promise<DbEvent> =>
  Event(EventType.USER_REGISTER_ASSISTED, user, host).save()
