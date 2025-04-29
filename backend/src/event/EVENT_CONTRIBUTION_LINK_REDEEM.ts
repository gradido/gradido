import {
  Contribution as DbContribution,
  ContributionLink as DbContributionLink,
  Event as DbEvent,
  Transaction as DbTransaction,
  User as DbUser,
} from 'database'
import { Decimal } from 'decimal.js-light'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_CONTRIBUTION_LINK_REDEEM = async (
  user: DbUser,
  transaction: DbTransaction,
  contribution: DbContribution,
  contributionLink: DbContributionLink,
  amount: Decimal,
): Promise<DbEvent> =>
  Event(
    EventType.CONTRIBUTION_LINK_REDEEM,
    user,
    user,
    null,
    transaction,
    contribution,
    null,
    null,
    contributionLink,
    amount,
  ).save()
