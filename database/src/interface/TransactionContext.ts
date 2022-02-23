import { Transaction } from '../../entity/Transaction'
import { User } from '../../entity/User'

export interface TransactionContext {
  transactionId: number
  transactionTypeId: number
  userId: number
  balance: BigInt
  balanceDate: Date
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
