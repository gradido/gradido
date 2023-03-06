import { User as DbUser } from '@entity/User'
import { Event as DbEvent } from '@entity/Event'
import { Event, EventType } from './Event'

export const EVENT_SEND_ACCOUNT_MULTIREGISTRATION_EMAIL = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.SEND_ACCOUNT_MULTIREGISTRATION_EMAIL, user, { id: 0 } as DbUser).save()
