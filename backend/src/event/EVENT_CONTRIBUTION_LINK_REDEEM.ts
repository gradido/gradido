import type { Contribution as DbContribution } from '@entity/Contribution'
import type { ContributionLink as DbContributionLink } from '@entity/ContributionLink'
import type { Event as DbEvent } from '@entity/Event'
import type { Transaction as DbTransaction } from '@entity/Transaction'
import type { User as DbUser } from '@entity/User'
import type { Decimal } from 'decimal.js-light'

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
