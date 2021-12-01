import { Transaction } from '../../entity/Transaction'
import { TransactionSendCoin } from '../../entity/TransactionSendCoin'
import { TransactionCreation } from '../../entity/TransactionCreation'
import { User } from '../../entity/User'

export interface TransactionContext {
  transactionTypeId?: number
  txHash?: Buffer
  memo?: string
  received?: Date
  blockchainTypeId?: number
  transactionSendCoin?: TransactionSendCoin
  transactionCreation?: TransactionCreation
}

export interface BalanceContext {
  modified?: Date
  recordDate?: Date
  amount?: number
  user?: User
}

export interface TransactionSendCoinContext {
  senderPublic?: Buffer
  userId?: number
  recipiantPublic?: Buffer
  recipiantUserId?: number
  amount?: number
  senderFinalBalance?: number
  transaction?: Transaction
}

export interface TransactionCreationContext {
  userId?: number
  amount?: number
  targetDate?: Timestamp
  transaction?: Transaction
}
