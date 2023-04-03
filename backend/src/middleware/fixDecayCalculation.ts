import { Decimal } from 'decimal.js-light'
import { MiddlewareFn } from 'type-graphql'

import { TransactionTypeId } from '@enum/TransactionTypeId'
import { Transaction } from '@model/Transaction'
import { TransactionList } from '@model/TransactionList'

export const fixDecayCalculation: MiddlewareFn = async (
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  { root, args, context, info },
  next,
) => {
  const result: TransactionList = (await next()) as TransactionList
  const { transactions } = result
  transactions.forEach((transaction: Transaction) => {
    if (transaction.typeId !== TransactionTypeId.DECAY) {
      const { balance, previousBalance, amount } = transaction
      transaction.decay.decay = new Decimal(
        Number(balance) - Number(amount) - Number(previousBalance),
      ).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    }
  })
  return result
}
