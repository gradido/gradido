import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'
import { Decimal } from 'decimal.js-light'

import { InputTransactionType } from '@/graphql/enum/InputTransactionType'
import { logger } from '@/logging/logger'
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

  public isConfirmed(): boolean {
    // Checks if runningHash exists and has a length of 32
    // The !! operator converts the value to a boolean, ensuring it is not null or undefined before proceeding to check its length
    return !!this.transaction.runningHash && this.transaction.runningHash.length === 32
  }

  // if updated, update also TransactionRepository.getLastTransactionForBalanceAccount
  public getBalanceAccount(
    inputTransactionType: InputTransactionType | undefined = undefined,
  ): Account | undefined | null {
    const transactionType = this.getTransactionType()
    logger.info('called with transaction type', {
      inputTransactionType: inputTransactionType
        ? getEnumValue(InputTransactionType, inputTransactionType)
        : inputTransactionType,
      transactionType,
    })

    switch (this.transaction.type as TransactionType) {
      case TransactionType.GRADIDO_CREATION:
        if (inputTransactionType && inputTransactionType !== InputTransactionType.CREATION) {
          throw new LogError(
            'wrong InputTransactionType %s for transaction with type: %s',
            getEnumValue(InputTransactionType, inputTransactionType),
            getEnumValue(TransactionType, this.getTransactionType()),
          )
        }
        return this.transaction.recipientAccount
      case TransactionType.GRADIDO_TRANSFER:
      case TransactionType.GRADIDO_DEFERRED_TRANSFER:
        if (!inputTransactionType || inputTransactionType === InputTransactionType.SEND) {
          return this.transaction.signingAccount
        } else if (inputTransactionType === InputTransactionType.RECEIVE) {
          return this.transaction.recipientAccount
        } else {
          throw new LogError(
            'wrong InputTransactionType %s for transaction with type: %s',
            getEnumValue(InputTransactionType, inputTransactionType),
            getEnumValue(TransactionType, this.getTransactionType()),
          )
        }
      case TransactionType.REGISTER_ADDRESS:
      case TransactionType.COMMUNITY_ROOT:
      case TransactionType.GROUP_FRIENDS_UPDATE:
        return null
      default:
        throw new LogError('not handled', transactionType)
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
