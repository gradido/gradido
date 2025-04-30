import { Contribution as DbContribution } from '@entity/Contribution'
import { Event as DbEvent } from '@entity/Event'
import { User as DbUser } from '@entity/User'
import { Decimal } from 'decimal.js-light'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_CONTRIBUTION_UPDATE = async (
  user: DbUser,
  contribution: DbContribution,
  amount: Decimal,
): Promise<DbEvent> =>
  Event(
    EventType.CONTRIBUTION_UPDATE,
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
