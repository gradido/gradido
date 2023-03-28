import Decimal from 'decimal.js-light'
import { User as DbUser } from '@entity/User'
import { Transaction as DbTransaction } from '@entity/Transaction'
import { Contribution as DbContribution } from '@entity/Contribution'
import { ContributionLink as DbContributionLink } from '@entity/ContributionLink'
import { Event as DbEvent } from '@entity/Event'
import { Event, EventType } from './Event'

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
