import Decimal from 'decimal.js-light'
import { User as DbUser } from '@entity/User'
import { TransactionLink as DbTransactionLink } from '@entity/TransactionLink'
import { Event as DbEvent } from '@entity/Event'
import { Event, EventType } from './Event'

export const EVENT_TRANSACTION_LINK_REDEEM = async (
  user: DbUser,
  senderUser: DbUser,
  transactionLink: DbTransactionLink,
  amount: Decimal,
): Promise<DbEvent> =>
  Event(
    EventType.TRANSACTION_LINK_REDEEM,
    user,
    user,
    senderUser,
    null,
    null,
    null,
    transactionLink,
    null,
    amount,
  ).save()
