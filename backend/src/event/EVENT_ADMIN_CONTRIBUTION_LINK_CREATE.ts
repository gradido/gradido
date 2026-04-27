import { ContributionLink as DbContributionLink, Event as DbEvent, User as DbUser } from 'database'
import { GradidoUnit } from 'shared'
import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_ADMIN_CONTRIBUTION_LINK_CREATE = async (
  moderator: DbUser,
  contributionLink: DbContributionLink,
  amount: GradidoUnit,
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
