import { User as DbUser } from '@entity/User'
import { ContributionLink as DbContributionLink } from '@entity/ContributionLink'
import { Event as DbEvent } from '@entity/Event'
import { Event, EventType } from './Event'

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
