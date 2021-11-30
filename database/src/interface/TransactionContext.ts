import { TransactionSendCoin } from '../../entity/TransactionSendCoin'
import { TransactionCreation } from '../../entity/TransactionCreation'

export interface TransactionContext {
  transactionTypeId?: number
  txHash?: Buffer
  memo?: string
  received?: Date
  blockchainTypeId?: number
  transactionSendCoin?: TransactionSendCoin
  transactionCreation?: TransactionCreation
}
