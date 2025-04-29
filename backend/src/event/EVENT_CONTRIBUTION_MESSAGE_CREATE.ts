import {
  Contribution as DbContribution,
  ContributionMessage as DbContributionMessage,
  Event as DbEvent,
  User as DbUser,
} from 'database'

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
