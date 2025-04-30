import type { Event as DbEvent } from '@entity/Event'
import type { TransactionLink as DbTransactionLink } from '@entity/TransactionLink'
import type { User as DbUser } from '@entity/User'

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
