import { Event as DbEvent } from '@entity/Event'
import { User as DbUser } from '@entity/User'
import { ContributionMessage as DbContributionMessage } from '@entity/ContributionMessage'
import { Contribution as DbContribution } from '@entity/Contribution'
import { Transaction as DbTransaction } from '@entity/Transaction'
import Decimal from 'decimal.js-light'
import { EventType } from './Event'

export const Event = (
  type: EventType,
  affectedUser: DbUser,
  actingUser: DbUser,
  involvedUser: DbUser | null = null,
  involvedTransaction: DbTransaction | null = null,
  involvedContribution: DbContribution | null = null,
  involvedContributionMessage: DbContributionMessage | null = null,
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
  event.amount = amount
  return event
}

export { EventType } from './EventType'

export { EVENT_ACTIVATE_ACCOUNT } from './EVENT_ACTIVATE_ACCOUNT'
export { EVENT_ADMIN_CONTRIBUTION_CONFIRM } from './EVENT_ADMIN_CONTRIBUTION_CONFIRM'
export { EVENT_ADMIN_CONTRIBUTION_CREATE } from './EVENT_ADMIN_CONTRIBUTION_CREATE'
export { EVENT_ADMIN_CONTRIBUTION_DELETE } from './EVENT_ADMIN_CONTRIBUTION_DELETE'
export { EVENT_ADMIN_CONTRIBUTION_DENY } from './EVENT_ADMIN_CONTRIBUTION_DENY'
export { EVENT_ADMIN_CONTRIBUTION_UPDATE } from './EVENT_ADMIN_CONTRIBUTION_UPDATE'
export { EVENT_ADMIN_SEND_CONFIRMATION_EMAIL } from './EVENT_ADMIN_SEND_CONFIRMATION_EMAIL'
export { EVENT_CONTRIBUTION_CREATE } from './EVENT_CONTRIBUTION_CREATE'
export { EVENT_CONTRIBUTION_DELETE } from './EVENT_CONTRIBUTION_DELETE'
export { EVENT_CONTRIBUTION_UPDATE } from './EVENT_CONTRIBUTION_UPDATE'
export { EVENT_LOGIN } from './EVENT_LOGIN'
export { EVENT_REGISTER } from './EVENT_REGISTER'
export { EVENT_SEND_ACCOUNT_MULTIREGISTRATION_EMAIL } from './EVENT_SEND_ACCOUNT_MULTIREGISTRATION_EMAIL'
export { EVENT_SEND_CONFIRMATION_EMAIL } from './EVENT_SEND_CONFIRMATION_EMAIL'
export { EVENT_TRANSACTION_SEND } from './EVENT_TRANSACTION_SEND'
export { EVENT_TRANSACTION_RECEIVE } from './EVENT_TRANSACTION_RECEIVE'
