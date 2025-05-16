import {
  Contribution as DbContribution,
  ContributionLink as DbContributionLink,
  ContributionMessage as DbContributionMessage,
  Event as DbEvent,
  Transaction as DbTransaction,
  TransactionLink as DbTransactionLink,
  User as DbUser,
} from 'database'
import { Decimal } from 'decimal.js-light'

import { EventType } from './EventType'

export const Event = (
  type: EventType,
  affectedUser: DbUser,
  actingUser: DbUser,
  involvedUser: DbUser | null = null,
  involvedTransaction: DbTransaction | null = null,
  involvedContribution: DbContribution | null = null,
  involvedContributionMessage: DbContributionMessage | null = null,
  involvedTransactionLink: DbTransactionLink | null = null,
  involvedContributionLink: DbContributionLink | null = null,
  amount: Decimal | null = null,
): DbEvent => {
  const event = new DbEvent()
  event.type = type
  event.affectedUser = affectedUser
  event.actingUser = actingUser
  event.involvedUser = involvedUser
  event.involvedTransaction = involvedTransaction
  event.involvedContribution = involvedContribution
  event.involvedContributionMessage = involvedContributionMessage
  event.involvedTransactionLink = involvedTransactionLink
  event.involvedContributionLink = involvedContributionLink
  event.amount = amount
  return event
}
