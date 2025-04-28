import { Contribution as DbContribution } from 'database'
import { ContributionLink as DbContributionLink } from 'database'
import { Event as DbEvent } from 'database'
import { Transaction as DbTransaction } from 'database'
import { User as DbUser } from 'database'
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
