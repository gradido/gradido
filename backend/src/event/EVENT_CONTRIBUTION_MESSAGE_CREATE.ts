import { User as DbUser } from '@entity/User'
import { Contribution as DbContribution } from '@entity/Contribution'
import { ContributionMessage as DbContributionMessage } from '@entity/ContributionMessage'
import { Event as DbEvent } from '@entity/Event'
import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_CONTRIBUTION_MESSAGE_CREATE = async (
  user: DbUser,
  contribution: DbContribution,
  contributionMessage: DbContributionMessage,
): Promise<DbEvent> =>
  Event(
    EventType.CONTRIBUTION_MESSAGE_CREATE,
    user,
    user,
    null,
    null,
    contribution,
    contributionMessage,
    null,
    null,
  ).save()
