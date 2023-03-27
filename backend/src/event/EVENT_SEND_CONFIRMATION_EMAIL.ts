import { User as DbUser } from '@entity/User'
import { Event as DbEvent } from '@entity/Event'
/* eslint-disable-next-line import/no-cycle */
import { Event, EventType } from './Event'

export const EVENT_SEND_CONFIRMATION_EMAIL = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.SEND_CONFIRMATION_EMAIL, user, user).save()