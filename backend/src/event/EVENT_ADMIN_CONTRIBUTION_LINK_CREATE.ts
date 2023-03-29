import { Decimal } from 'decimal.js-light'
import { User as DbUser } from '@entity/User'
import { ContributionLink as DbContributionLink } from '@entity/ContributionLink'
import { Event as DbEvent } from '@entity/Event'
import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_ADMIN_CONTRIBUTION_LINK_CREATE = async (
  moderator: DbUser,
  contributionLink: DbContributionLink,
  amount: Decimal,
): Promise<DbEvent> =>
  Event(
    EventType.ADMIN_CONTRIBUTION_LINK_CREATE,
    { id: 0 } as DbUser,
    moderator,
    null,
    null,
    null,
    null,
    null,
    contributionLink,
    amount,
  ).save()
