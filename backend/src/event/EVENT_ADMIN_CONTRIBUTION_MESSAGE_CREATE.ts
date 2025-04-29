import {
  Contribution as DbContribution,
  ContributionMessage as DbContributionMessage,
  Event as DbEvent,
  User as DbUser,
} from 'database'

import { Event } from './Event'
import { EventType } from './EventType'

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
