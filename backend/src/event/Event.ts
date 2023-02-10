import { EventProtocol as DbEvent } from '@entity/EventProtocol'
import Decimal from 'decimal.js-light'
import { EventProtocolType } from './EventProtocolType'

export class Event {
  event: DbEvent
  constructor(
    type: EventProtocolType,
    userId: number,
    xUserId: number | null = null,
    xCommunityId: number | null = null,
    transactionId: number | null = null,
    contributionId: number | null = null,
    amount: Decimal | null = null,
    messageId: number | null = null,
  ) {
    this.event = new DbEvent()
    this.event.type = type
    this.event.userId = userId
    this.event.xUserId = xUserId
    this.event.xCommunityId = xCommunityId
    this.event.transactionId = transactionId
    this.event.contributionId = contributionId
    this.event.amount = amount
    this.event.messageId = messageId
  }

  save(): Promise<DbEvent> {
    return this.event.save()
  }
}

export const EVENT_CONTRIBUTION_CREATE = async (
  userId: number,
  contributionId: number,
  amount: Decimal,
): Promise<DbEvent> =>
  new Event(
    EventProtocolType.CONTRIBUTION_CREATE,
    userId,
    null,
    null,
    null,
    contributionId,
    amount,
    null,
  ).save()

export const EVENT_CONTRIBUTION_DELETE = async (
  userId: number,
  contributionId: number,
  amount: Decimal,
): Promise<DbEvent> =>
  new Event(
    EventProtocolType.CONTRIBUTION_DELETE,
    userId,
    null,
    null,
    null,
    contributionId,
    amount,
    null,
  ).save()

export const EVENT_CONTRIBUTION_UPDATE = async (
  userId: number,
  contributionId: number,
  amount: Decimal,
): Promise<DbEvent> =>
  new Event(
    EventProtocolType.CONTRIBUTION_UPDATE,
    userId,
    null,
    null,
    null,
    contributionId,
    amount,
    null,
  ).save()

export const EVENT_ADMIN_CONTRIBUTION_CREATE = async (
  userId: number,
  contributionId: number,
  amount: Decimal,
): Promise<DbEvent> =>
  new Event(
    EventProtocolType.ADMIN_CONTRIBUTION_CREATE,
    userId,
    null,
    null,
    null,
    contributionId,
    amount,
    null,
  ).save()

export const EVENT_ADMIN_CONTRIBUTION_UPDATE = async (
  userId: number,
  contributionId: number,
  amount: Decimal,
): Promise<DbEvent> =>
  new Event(
    EventProtocolType.ADMIN_CONTRIBUTION_UPDATE,
    userId,
    null,
    null,
    null,
    contributionId,
    amount,
    null,
  ).save()

export const EVENT_ADMIN_CONTRIBUTION_DELETE = async (
  userId: number,
  contributionId: number,
  amount: Decimal,
): Promise<DbEvent> =>
  new Event(
    EventProtocolType.ADMIN_CONTRIBUTION_DELETE,
    userId,
    null,
    null,
    null,
    contributionId,
    amount,
    null,
  ).save()

export const EVENT_CONTRIBUTION_CONFIRM = async (
  userId: number,
  contributionId: number,
  amount: Decimal,
): Promise<DbEvent> =>
  new Event(
    EventProtocolType.CONTRIBUTION_CONFIRM,
    userId,
    null,
    null,
    null,
    contributionId,
    amount,
    null,
  ).save()

export const EVENT_ADMIN_CONTRIBUTION_DENY = async (
  userId: number,
  contributionId: number,
  amount: Decimal,
): Promise<DbEvent> =>
  new Event(
    EventProtocolType.ADMIN_CONTRIBUTION_DENY,
    userId,
    null,
    null,
    null,
    contributionId,
    amount,
    null,
  ).save()

export const EVENT_TRANSACTION_SEND = async (
  userId: number,
  xUserId: number,
  transactionId: number,
  amount: Decimal,
): Promise<DbEvent> =>
  new Event(
    EventProtocolType.TRANSACTION_SEND,
    userId,
    xUserId,
    null,
    transactionId,
    null,
    amount,
    null,
  ).save()

export const EVENT_TRANSACTION_RECEIVE = async (
  userId: number,
  xUserId: number,
  transactionId: number,
  amount: Decimal,
): Promise<DbEvent> =>
  new Event(
    EventProtocolType.TRANSACTION_RECEIVE,
    userId,
    xUserId,
    null,
    transactionId,
    null,
    amount,
    null,
  ).save()

export const EVENT_LOGIN = async (userId: number): Promise<DbEvent> =>
  new Event(EventProtocolType.LOGIN, userId, null, null, null, null, null, null).save()

export const EVENT_SEND_ACCOUNT_MULTIREGISTRATION_EMAIL = async (
  userId: number,
): Promise<DbEvent> =>
  new Event(
    EventProtocolType.SEND_ACCOUNT_MULTIREGISTRATION_EMAIL,
    userId,
    null,
    null,
    null,
    null,
    null,
    null,
  ).save()

export const EVENT_SEND_CONFIRMATION_EMAIL = async (userId: number): Promise<DbEvent> =>
  new Event(
    EventProtocolType.SEND_CONFIRMATION_EMAIL,
    userId,
    null,
    null,
    null,
    null,
    null,
    null,
  ).save()

/* export const EVENT_REDEEM_REGISTER = async (
  userId: number,
  transactionId: number | null = null,
  contributionId: number | null = null,
): Promise<Event> =>
  new Event(
    EventProtocolType.REDEEM_REGISTER,
    userId,
    null,
    null,
    transactionId,
    contributionId,
    null,
    null,
  ).save()
*/

export const EVENT_REGISTER = async (userId: number): Promise<DbEvent> =>
  new Event(EventProtocolType.REGISTER, userId, null, null, null, null, null, null).save()

export const EVENT_ACTIVATE_ACCOUNT = async (userId: number): Promise<DbEvent> =>
  new Event(EventProtocolType.ACTIVATE_ACCOUNT, userId, null, null, null, null, null, null).save()
