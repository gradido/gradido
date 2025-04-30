import type { Event as DbEvent } from '@entity/Event'
import type { Transaction as DbTransaction } from '@entity/Transaction'
import type { User as DbUser } from '@entity/User'
import type { Decimal } from 'decimal.js-light'

import { Event } from './Event'
import { EventType } from './EventType'

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
    null,
    null,
    amount,
  ).save()
