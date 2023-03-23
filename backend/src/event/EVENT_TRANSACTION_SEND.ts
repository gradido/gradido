import Decimal from 'decimal.js-light'
import { User as DbUser } from '@entity/User'
import { Transaction as DbTransaction } from '@entity/Transaction'
import { Event as DbEvent } from '@entity/Event'
import { Event, EventType } from './Event'

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
    amount,
  ).save()
