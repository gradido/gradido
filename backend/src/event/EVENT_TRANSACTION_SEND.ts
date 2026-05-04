import { Event as DbEvent, Transaction as DbTransaction, User as DbUser } from 'database'
import { GradidoUnit } from 'shared'

import { Event } from './Event'
import { EventType } from './EventType'

export const EVENT_TRANSACTION_SEND = async (
  user: DbUser,
  involvedUser: DbUser,
  transaction: DbTransaction,
  amount: GradidoUnit,
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
