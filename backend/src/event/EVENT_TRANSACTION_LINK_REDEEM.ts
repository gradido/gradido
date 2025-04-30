import type { Event as DbEvent } from '@entity/Event'
import type { TransactionLink as DbTransactionLink } from '@entity/TransactionLink'
import type { User as DbUser } from '@entity/User'
import type { Decimal } from 'decimal.js-light'

import { Event } from './Event'
import { EventType } from './EventType'

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
