import { Transaction as DbTransaction } from '@entity/Transaction'

import type { Order } from '@enum/Order'

export const getTransactionList = async (
  userId: number,
  limit: number,
  offset: number,
  order: Order,
): Promise<[DbTransaction[], number]> => {
  return DbTransaction.findAndCount({
    where: {
      userId,
    },
    order: { balanceDate: order, id: order },
    relations: ['previousTransaction'],
    skip: offset,
    take: limit,
  })
}
