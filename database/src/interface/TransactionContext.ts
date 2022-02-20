import { Transaction } from '../../entity/Transaction'
import { User } from '../../entity/User'

export interface TransactionContext {
  transactionTypeId: number
  userId: number
  amount: BigInt
  txHash?: Buffer
  memo: string
  received?: Date
  signature?: Buffer
  pubkey?: Buffer
  creationIdentHash?: Buffer
  creationDate?: Date
  sendReceiverPublicKey?: Buffer
  sendReceiverUserId?: number
  sendSenderFinalBalance?: BigInt
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

export interface UserTransactionContext {
  userId?: number
  transactionId?: number
  transactionTypeId?: number
  balance?: number
  balanceDate?: Date
  signature?: Buffer
  pubkey?: Buffer
}
