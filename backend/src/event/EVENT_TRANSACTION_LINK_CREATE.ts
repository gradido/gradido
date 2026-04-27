import { Event as DbEvent, TransactionLink as DbTransactionLink, User as DbUser } from 'database'
import { GradidoUnit } from 'shared'
import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_TRANSACTION_LINK_CREATE = async (
  user: DbUser,
  transactionLink: DbTransactionLink,
  amount: GradidoUnit,
): Promise<DbEvent> =>
  Event(
    EventType.TRANSACTION_LINK_CREATE,
    user,
    user,
    null,
    null,
    null,
    null,
    transactionLink,
    null,
    amount,
  ).save()
