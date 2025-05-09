import { Event as DbEvent, Transaction as DbTransaction, User as DbUser } from 'database'
import { Decimal } from 'decimal.js-light'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_TRANSACTION_RECEIVE = async (
  user: DbUser,
  involvedUser: DbUser,
  transaction: DbTransaction,
  amount: Decimal,
): Promise<DbEvent> =>
  Event(
    EventType.TRANSACTION_RECEIVE,
    user,
    involvedUser,
    involvedUser,
    transaction,
    null,
    null,
    null,
    null,
    amount,
  ).save()
