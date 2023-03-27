import { User as DbUser } from '@entity/User'
import { Event as DbEvent } from '@entity/Event'
/* eslint-disable-next-line import/no-cycle */
import { Event, EventType } from './Event'

export const EVENT_REGISTER = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.REGISTER, user, user).save()