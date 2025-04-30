import type { ContributionLink as DbContributionLink } from '@entity/ContributionLink'
import type { Event as DbEvent } from '@entity/Event'
import type { User as DbUser } from '@entity/User'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_ADMIN_CONTRIBUTION_LINK_DELETE = async (
  moderator: DbUser,
  contributionLink: DbContributionLink,
): Promise<DbEvent> =>
  Event(
    EventType.ADMIN_CONTRIBUTION_LINK_DELETE,
    { id: 0 } as DbUser,
    moderator,
    null,
    null,
    null,
    null,
    null,
    contributionLink,
  ).save()
