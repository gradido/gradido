import { Event as DbEvent, TransactionLink as DbTransactionLink, User as DbUser } from 'database'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_TRANSACTION_LINK_DELETE = async (
  user: DbUser,
  transactionLink: DbTransactionLink,
): Promise<DbEvent> =>
  Event(
    EventType.TRANSACTION_LINK_DELETE,
    user,
    user,
    null,
    null,
    null,
    null,
    transactionLink,
  ).save()
