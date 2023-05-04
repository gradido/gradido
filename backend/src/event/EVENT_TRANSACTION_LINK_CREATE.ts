import { Event as DbEvent } from '@entity/Event'
import { TransactionLink as DbTransactionLink } from '@entity/TransactionLink'
import { User as DbUser } from '@entity/User'
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
