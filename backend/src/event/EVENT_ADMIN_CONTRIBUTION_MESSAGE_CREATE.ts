import { User as DbUser } from '@entity/User'
import { Contribution as DbContribution } from '@entity/Contribution'
import { ContributionMessage as DbContributionMessage } from '@entity/ContributionMessage'
import { Event as DbEvent } from '@entity/Event'
import { Event, EventType } from './Event'

export const EVENT_ADMIN_CONTRIBUTION_MESSAGE_CREATE = async (
  user: DbUser,
  moderator: DbUser,
  contribution: DbContribution,
  contributionMessage: DbContributionMessage,
): Promise<DbEvent> =>
  Event(
    EventType.ADMIN_CONTRIBUTION_MESSAGE_CREATE,
    user,
    moderator,
    null,
    null,
    contribution,
    contributionMessage,
    null,
    null,
  ).save()
