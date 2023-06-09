import { Event as DbEvent } from '@entity/Event'
import { Transaction as DbTransaction } from '@entity/Transaction'
import { User as DbUser } from '@entity/User'
import { Decimal } from 'decimal.js-light'

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
