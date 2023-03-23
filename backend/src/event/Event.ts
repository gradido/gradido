import { Event as DbEvent } from '@entity/Event'
import { User as DbUser } from '@entity/User'
import { ContributionMessage as DbContributionMessage } from '@entity/ContributionMessage'
import { Contribution as DbContribution } from '@entity/Contribution'
import { Transaction as DbTransaction } from '@entity/Transaction'
import Decimal from 'decimal.js-light'
import { EventType } from './EventType'

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

export const EVENT_CONTRIBUTION_CREATE = async (
  user: DbUser,
  contribution: DbContribution,
  amount: Decimal,
): Promise<DbEvent> =>
  Event(EventType.CONTRIBUTION_CREATE, user, user, null, null, contribution, null, amount).save()

export const EVENT_CONTRIBUTION_DELETE = async (
  user: DbUser,
  contribution: DbContribution,
  amount: Decimal,
): Promise<DbEvent> =>
  Event(EventType.CONTRIBUTION_DELETE, user, user, null, null, contribution, null, amount).save()

export const EVENT_CONTRIBUTION_UPDATE = async (
  user: DbUser,
  contribution: DbContribution,
  amount: Decimal,
): Promise<DbEvent> =>
  Event(EventType.CONTRIBUTION_UPDATE, user, user, null, null, contribution, null, amount).save()

export const EVENT_ADMIN_CONTRIBUTION_CREATE = async (
  user: DbUser,
  moderator: DbUser,
  contribution: DbContribution,
  amount: Decimal,
): Promise<DbEvent> =>
  Event(
    EventType.ADMIN_CONTRIBUTION_CREATE,
    user,
    moderator,
    null,
    null,
    contribution,
    null,
    amount,
  ).save()

export const EVENT_ADMIN_CONTRIBUTION_UPDATE = async (
  user: DbUser,
  moderator: DbUser,
  contribution: DbContribution,
  amount: Decimal,
): Promise<DbEvent> =>
  Event(
    EventType.ADMIN_CONTRIBUTION_UPDATE,
    user,
    moderator,
    null,
    null,
    contribution,
    null,
    amount,
  ).save()

export const EVENT_ADMIN_CONTRIBUTION_DELETE = async (
  user: DbUser,
  moderator: DbUser,
  contribution: DbContribution,
  amount: Decimal,
): Promise<DbEvent> =>
  Event(
    EventType.ADMIN_CONTRIBUTION_DELETE,
    user,
    moderator,
    null,
    null,
    contribution,
    null,
    amount,
  ).save()

export const EVENT_CONTRIBUTION_CONFIRM = async (
  user: DbUser,
  moderator: DbUser,
  contribution: DbContribution,
  amount: Decimal,
): Promise<DbEvent> =>
  Event(
    EventType.CONTRIBUTION_CONFIRM,
    user,
    moderator,
    null,
    null,
    contribution,
    null,
    amount,
  ).save()

export const EVENT_ADMIN_CONTRIBUTION_DENY = async (
  user: DbUser,
  moderator: DbUser,
  contribution: DbContribution,
  amount: Decimal,
): Promise<DbEvent> =>
  Event(
    EventType.ADMIN_CONTRIBUTION_DENY,
    user,
    moderator,
    null,
    null,
    contribution,
    null,
    amount,
  ).save()

export const EVENT_TRANSACTION_SEND = async (
  user: DbUser,
  involvedUser: DbUser,
  transaction: DbTransaction,
  amount: Decimal,
): Promise<DbEvent> =>
  Event(
    EventType.TRANSACTION_SEND,
    user,
    user,
    involvedUser,
    transaction,
    null,
    null,
    amount,
  ).save()

export const EVENT_TRANSACTION_RECEIVE = async (
  user: DbUser,
  involvedUser: DbUser,
  transaction: DbTransaction,
  amount: Decimal,
): Promise<DbEvent> =>
  Event(
    EventType.TRANSACTION_RECEIVE,
    user,
    involvedUser,
    involvedUser,
    transaction,
    null,
    null,
    amount,
  ).save()

export const EVENT_LOGIN = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.LOGIN, user, user).save()

export const EVENT_SEND_ACCOUNT_MULTIREGISTRATION_EMAIL = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.SEND_ACCOUNT_MULTIREGISTRATION_EMAIL, user, { id: 0 } as DbUser).save()

export const EVENT_SEND_CONFIRMATION_EMAIL = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.SEND_CONFIRMATION_EMAIL, user, user).save()

export const EVENT_ADMIN_SEND_CONFIRMATION_EMAIL = async (
  user: DbUser,
  moderator: DbUser,
): Promise<DbEvent> => Event(EventType.ADMIN_SEND_CONFIRMATION_EMAIL, user, moderator).save()

export const EVENT_REGISTER = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.REGISTER, user, user).save()

export const EVENT_ACTIVATE_ACCOUNT = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.ACTIVATE_ACCOUNT, user, user).save()
