import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'
import { Decimal } from 'decimal.js-light'

import { LogError } from '@/server/LogError'
import { calculateDecay } from '@/utils/decay'
import { getEnumValue } from '@/utils/typeConverter'

import { TransactionType } from './proto/3_3/enum/TransactionType'
import { TransactionRepository } from './Transaction.repository'

export class TransactionLogic {
  // eslint-disable-next-line no-useless-constructor
  constructor(private transaction: Transaction) {}

  public getTransactionType(): TransactionType {
    const type = getEnumValue(TransactionType, this.transaction.type)
    if (type === undefined) {
      throw new LogError('invalid transaction type stored in transaction')
    }
    return type
  }

  // if updated, update also TransactionRepository.getLastTransactionForBalanceAccount
  public getBalanceAccount(): Account | undefined | null {
    switch (this.getTransactionType()) {
      case TransactionType.GRADIDO_CREATION:
        return this.transaction.recipientAccount
      case TransactionType.GRADIDO_TRANSFER:
      case TransactionType.GRADIDO_DEFERRED_TRANSFER:
        return this.transaction.signingAccount
      case TransactionType.REGISTER_ADDRESS:
      case TransactionType.COMMUNITY_ROOT:
      case TransactionType.GROUP_FRIENDS_UPDATE:
        return null
    }
  }

  public async calculateBalanceCreatedAt(): Promise<Decimal> {
    // find last transaction for this balance account
    // take value + decay + value
    const balanceAccount = this.getBalanceAccount()
    if (!balanceAccount) {
      throw new LogError("couldn't find balance account for transaction")
    }
    const prevTransaction = await TransactionRepository.getLastTransactionForBalanceAccount(
      balanceAccount,
    )
    if (prevTransaction && prevTransaction.accountBalanceOnCreation) {
      const decay = calculateDecay(
        prevTransaction.accountBalanceOnCreation,
        prevTransaction.createdAt,
        this.transaction.createdAt,
      )
      if (this.transaction.amount) {
        return decay.balance.add(this.transaction.amount)
      }
      return decay.balance
    }
    return new Decimal(0)
  }
}
