import { Contribution as DbContribution } from 'database'
import { ContributionMessage as DbContributionMessage } from 'database'
import { Event as DbEvent } from 'database'
import { User as DbUser } from 'database'

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
