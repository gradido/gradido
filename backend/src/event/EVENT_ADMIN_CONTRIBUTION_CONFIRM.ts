import Decimal from 'decimal.js-light'
import { User as DbUser } from '@entity/User'
import { Contribution as DbContribution } from '@entity/Contribution'
import { Event as DbEvent } from '@entity/Event'
import { Event, EventType } from './Event'

export const EVENT_ADMIN_CONTRIBUTION_CONFIRM = async (
  user: DbUser,
  moderator: DbUser,
  contribution: DbContribution,
  amount: Decimal,
): Promise<DbEvent> =>
  Event(
    EventType.ADMIN_CONTRIBUTION_CONFIRM,
    user,
    moderator,
    null,
    null,
    contribution,
    null,
    amount,
  ).save()
