import type { Contribution as DbContribution } from '@entity/Contribution'
import type { Event as DbEvent } from '@entity/Event'
import type { User as DbUser } from '@entity/User'
import type { Decimal } from 'decimal.js-light'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_ADMIN_CONTRIBUTION_CREATE = async (
  user: DbUser,
  moderator: DbUser,
  contribution: DbContribution,
  amount: Decimal,
): Promise<DbEvent> =>
  Event(
    EventType.ADMIN_CONTRIBUTION_CREATE,
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
