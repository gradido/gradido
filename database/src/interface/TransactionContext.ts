import Decimal from 'decimal.js-light'

export interface TransactionContext {
  typeId: number
  userId: number
  balance: Decimal
  balanceDate: Date
  amount: Decimal
  memo: string
  creationDate?: Date
  sendReceiverUserId?: number
}
