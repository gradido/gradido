import { ContributionLink as DbContributionLink, Event as DbEvent, User as DbUser } from 'database'

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
