import { Contribution as DbContribution, Event as DbEvent, User as DbUser } from 'database'
import { Decimal } from 'decimal.js-light'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_CONTRIBUTION_CREATE = async (
  user: DbUser,
  contribution: DbContribution,
  amount: Decimal,
): Promise<DbEvent> =>
  Event(
    EventType.CONTRIBUTION_CREATE,
    user,
    user,
    null,
    null,
    contribution,
    null,
    null,
    null,
    amount,
  ).save()
