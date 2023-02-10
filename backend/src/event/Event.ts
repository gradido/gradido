import { EventProtocol as dbEvent } from '@entity/EventProtocol'
import Decimal from 'decimal.js-light'
import { EventProtocolType } from './EventProtocolType'

export class Event extends dbEvent {
  constructor(
    type: EventProtocolType,
    userId: number,
    xUserId: number | null = null,
    xCommunityId: number | null = null,
    transactionId: number | null = null,
    contributionId: number | null = null,
    amount: Decimal | null = null,
    messageId: number | null = null,
    autosave = true,
  ) {
    super()
    this.type = type
    this.userId = userId
    this.xUserId = xUserId
    this.xCommunityId = xCommunityId
    this.transactionId = transactionId
    this.contributionId = contributionId
    this.amount = amount
    this.messageId = messageId

    if (autosave) {
      // This is unsafe, since we cannot wait for this in the constructor - the saving process is async therefore
      this.save()
    }
  }
}

export const EVENT_CONTRIBUTION_CREATE = (
  userId: number,
  contributionId: number,
  amount: Decimal,
  autosave = true,
): Event =>
  new Event(
    EventProtocolType.CONTRIBUTION_CREATE,
    userId,
    null,
    null,
    null,
    contributionId,
    amount,
    null,
    autosave,
  )
export const EVENT_CONTRIBUTION_DELETE = (
  userId: number,
  contributionId: number,
  amount: Decimal,
  autosave = true,
): Event =>
  new Event(
    EventProtocolType.CONTRIBUTION_DELETE,
    userId,
    null,
    null,
    null,
    contributionId,
    amount,
    null,
    autosave,
  )
export const EVENT_CONTRIBUTION_UPDATE = (
  userId: number,
  contributionId: number,
  amount: Decimal,
  autosave = true,
): Event =>
  new Event(
    EventProtocolType.CONTRIBUTION_UPDATE,
    userId,
    null,
    null,
    null,
    contributionId,
    amount,
    null,
    autosave,
  )

export const EVENT_ADMIN_CONTRIBUTION_CREATE = (
  userId: number,
  contributionId: number,
  amount: Decimal,
  autosave = true,
): Event =>
  new Event(
    EventProtocolType.ADMIN_CONTRIBUTION_CREATE,
    userId,
    null,
    null,
    null,
    contributionId,
    amount,
    null,
    autosave,
  )

export const EVENT_ADMIN_CONTRIBUTION_UPDATE = (
  userId: number,
  contributionId: number,
  amount: Decimal,
  autosave = true,
): Event =>
  new Event(
    EventProtocolType.ADMIN_CONTRIBUTION_UPDATE,
    userId,
    null,
    null,
    null,
    contributionId,
    amount,
    null,
    autosave,
  )

export const EVENT_ADMIN_CONTRIBUTION_DELETE = (
  userId: number,
  contributionId: number,
  amount: Decimal,
  autosave = true,
): Event =>
  new Event(
    EventProtocolType.ADMIN_CONTRIBUTION_DELETE,
    userId,
    null,
    null,
    null,
    contributionId,
    amount,
    null,
    autosave,
  )

export const EVENT_CONTRIBUTION_CONFIRM = (
  userId: number,
  contributionId: number,
  amount: Decimal,
  autosave = true,
): Event =>
  new Event(
    EventProtocolType.CONTRIBUTION_CONFIRM,
    userId,
    null,
    null,
    null,
    contributionId,
    amount,
    null,
    autosave,
  )

export const EVENT_ADMIN_CONTRIBUTION_DENY = (
  userId: number,
  contributionId: number,
  amount: Decimal,
  autosave = true,
): Event =>
  new Event(
    EventProtocolType.ADMIN_CONTRIBUTION_DENY,
    userId,
    null,
    null,
    null,
    contributionId,
    amount,
    null,
    autosave,
  )

export const EVENT_TRANSACTION_SEND = (
  userId: number,
  xUserId: number,
  transactionId: number,
  amount: Decimal,
  autosave = true,
): Event =>
  new Event(
    EventProtocolType.TRANSACTION_SEND,
    userId,
    xUserId,
    null,
    transactionId,
    null,
    amount,
    null,
    autosave,
  )

export const EVENT_TRANSACTION_RECEIVE = (
  userId: number,
  xUserId: number,
  transactionId: number,
  amount: Decimal,
  autosave = true,
): Event =>
  new Event(
    EventProtocolType.TRANSACTION_RECEIVE,
    userId,
    xUserId,
    null,
    transactionId,
    null,
    amount,
    null,
    autosave,
  )

export const EVENT_LOGIN = (userId: number, autosave = true): Event =>
  new Event(EventProtocolType.LOGIN, userId, null, null, null, null, null, null, autosave)

export const EVENT_SEND_ACCOUNT_MULTIREGISTRATION_EMAIL = (
  userId: number,
  autosave = true,
): Event =>
  new Event(
    EventProtocolType.SEND_ACCOUNT_MULTIREGISTRATION_EMAIL,
    userId,
    null,
    null,
    null,
    null,
    null,
    null,
    autosave,
  )

export const EVENT_SEND_CONFIRMATION_EMAIL = (userId: number, autosave = true): Event =>
  new Event(
    EventProtocolType.SEND_CONFIRMATION_EMAIL,
    userId,
    null,
    null,
    null,
    null,
    null,
    null,
    autosave,
  )

export const EVENT_REDEEM_REGISTER = (
  userId: number,
  transactionId: number | null = null,
  contributionId: number | null = null,
  autosave = true,
): Event =>
  new Event(
    EventProtocolType.REDEEM_REGISTER,
    userId,
    null,
    null,
    transactionId,
    contributionId,
    null,
    null,
    autosave,
  )

export const EVENT_REGISTER = (userId: number, autosave = true): Event =>
  new Event(EventProtocolType.REGISTER, userId, null, null, null, null, null, null, autosave)

export const EVENT_ACTIVATE_ACCOUNT = (userId: number, autosave = true): Event =>
  new Event(
    EventProtocolType.ACTIVATE_ACCOUNT,
    userId,
    null,
    null,
    null,
    null,
    null,
    null,
    autosave,
  )
