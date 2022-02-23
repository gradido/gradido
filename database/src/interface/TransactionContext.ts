import { User } from '../../entity/User'

export interface TransactionContext {
  typeId: number
  userId: number
  balance: BigInt
  balanceDate: Date
  amount: BigInt
  memo: string
  creationDate?: Date
  sendReceiverUserId?: number
  sendSenderFinalBalance?: BigInt
}

export interface BalanceContext {
  modified?: Date
  recordDate?: Date
  amount?: number
  user?: User
}
