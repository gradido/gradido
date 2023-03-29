import { Event as DbEvent } from '@entity/Event'
import { User as DbUser } from '@entity/User'
import { Transaction as DbTransaction } from '@entity/Transaction'
import { TransactionLink as DbTransactionLink } from '@entity/TransactionLink'
import { Contribution as DbContribution } from '@entity/Contribution'
import { ContributionMessage as DbContributionMessage } from '@entity/ContributionMessage'
import { ContributionLink as DbContributionLink } from '@entity/ContributionLink'
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
