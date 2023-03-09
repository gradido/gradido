import { User as DbUser } from '@entity/User'
import { Event as DbEvent } from '@entity/Event'
import { Event, EventType } from './Event'

export const EVENT_LOGOUT = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.LOGOUT, user, user).save()
