import type { ContributionLink as DbContributionLink } from '@entity/ContributionLink'
import type { Event as DbEvent } from '@entity/Event'
import type { User as DbUser } from '@entity/User'
import type { Decimal } from 'decimal.js-light'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_ADMIN_CONTRIBUTION_LINK_UPDATE = async (
  moderator: DbUser,
  contributionLink: DbContributionLink,
  amount: Decimal,
): Promise<DbEvent> =>
  Event(
    EventType.ADMIN_CONTRIBUTION_LINK_UPDATE,
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
