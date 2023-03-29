import { Decimal } from 'decimal.js-light'
import { User as DbUser } from '@entity/User'
import { Transaction as DbTransaction } from '@entity/Transaction'
import { Event as DbEvent } from '@entity/Event'
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
