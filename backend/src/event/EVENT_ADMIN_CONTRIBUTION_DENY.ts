import { Contribution as DbContribution } from 'database'
import { Event as DbEvent } from 'database'
import { User as DbUser } from 'database'
import { Decimal } from 'decimal.js-light'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_ADMIN_CONTRIBUTION_DENY = async (
  user: DbUser,
  moderator: DbUser,
  contribution: DbContribution,
  amount: Decimal,
): Promise<DbEvent> =>
  Event(
    EventType.ADMIN_CONTRIBUTION_DENY,
    user,
    moderator,
    null,
    null,
    contribution,
    null,
    null,
    null,
    amount,
  ).save()
