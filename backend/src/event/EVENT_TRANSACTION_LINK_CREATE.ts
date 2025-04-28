import { Event as DbEvent } from 'database'
import { TransactionLink as DbTransactionLink } from 'database'
import { User as DbUser } from 'database'
import { Decimal } from 'decimal.js-light'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_TRANSACTION_LINK_CREATE = async (
  user: DbUser,
  transactionLink: DbTransactionLink,
  amount: Decimal,
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
