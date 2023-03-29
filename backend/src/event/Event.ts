/* eslint-disable import/no-cycle */
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

export { EventType }

export { EVENT_ADMIN_CONTRIBUTION_CONFIRM } from './EVENT_ADMIN_CONTRIBUTION_CONFIRM'
export { EVENT_ADMIN_CONTRIBUTION_CREATE } from './EVENT_ADMIN_CONTRIBUTION_CREATE'
export { EVENT_ADMIN_CONTRIBUTION_DELETE } from './EVENT_ADMIN_CONTRIBUTION_DELETE'
export { EVENT_ADMIN_CONTRIBUTION_DENY } from './EVENT_ADMIN_CONTRIBUTION_DENY'
export { EVENT_ADMIN_CONTRIBUTION_UPDATE } from './EVENT_ADMIN_CONTRIBUTION_UPDATE'
export { EVENT_ADMIN_CONTRIBUTION_LINK_CREATE } from './EVENT_ADMIN_CONTRIBUTION_LINK_CREATE'
export { EVENT_ADMIN_CONTRIBUTION_LINK_DELETE } from './EVENT_ADMIN_CONTRIBUTION_LINK_DELETE'
export { EVENT_ADMIN_CONTRIBUTION_LINK_UPDATE } from './EVENT_ADMIN_CONTRIBUTION_LINK_UPDATE'
export { EVENT_ADMIN_CONTRIBUTION_MESSAGE_CREATE } from './EVENT_ADMIN_CONTRIBUTION_MESSAGE_CREATE'
export { EVENT_ADMIN_USER_DELETE } from './EVENT_ADMIN_USER_DELETE'
export { EVENT_ADMIN_USER_UNDELETE } from './EVENT_ADMIN_USER_UNDELETE'
export { EVENT_ADMIN_USER_ROLE_SET } from './EVENT_ADMIN_USER_ROLE_SET'
export { EVENT_CONTRIBUTION_CREATE } from './EVENT_CONTRIBUTION_CREATE'
export { EVENT_CONTRIBUTION_DELETE } from './EVENT_CONTRIBUTION_DELETE'
export { EVENT_CONTRIBUTION_UPDATE } from './EVENT_CONTRIBUTION_UPDATE'
export { EVENT_CONTRIBUTION_MESSAGE_CREATE } from './EVENT_CONTRIBUTION_MESSAGE_CREATE'
export { EVENT_CONTRIBUTION_LINK_REDEEM } from './EVENT_CONTRIBUTION_LINK_REDEEM'
export { EVENT_EMAIL_ACCOUNT_MULTIREGISTRATION } from './EVENT_EMAIL_ACCOUNT_MULTIREGISTRATION'
export { EVENT_EMAIL_ADMIN_CONFIRMATION } from './EVENT_EMAIL_ADMIN_CONFIRMATION'
export { EVENT_EMAIL_CONFIRMATION } from './EVENT_EMAIL_CONFIRMATION'
export { EVENT_EMAIL_FORGOT_PASSWORD } from './EVENT_EMAIL_FORGOT_PASSWORD'
export { EVENT_TRANSACTION_SEND } from './EVENT_TRANSACTION_SEND'
export { EVENT_TRANSACTION_RECEIVE } from './EVENT_TRANSACTION_RECEIVE'
export { EVENT_TRANSACTION_LINK_CREATE } from './EVENT_TRANSACTION_LINK_CREATE'
export { EVENT_TRANSACTION_LINK_DELETE } from './EVENT_TRANSACTION_LINK_DELETE'
export { EVENT_TRANSACTION_LINK_REDEEM } from './EVENT_TRANSACTION_LINK_REDEEM'
export { EVENT_USER_ACTIVATE_ACCOUNT } from './EVENT_USER_ACTIVATE_ACCOUNT'
export { EVENT_USER_INFO_UPDATE } from './EVENT_USER_INFO_UPDATE'
export { EVENT_USER_LOGIN } from './EVENT_USER_LOGIN'
export { EVENT_USER_LOGOUT } from './EVENT_USER_LOGOUT'
export { EVENT_USER_REGISTER } from './EVENT_USER_REGISTER'
