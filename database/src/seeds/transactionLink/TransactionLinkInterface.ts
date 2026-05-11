export interface TransactionLinkInterface {
  email: string
  amount: number
  memo: string
  createdAt?: Date
  redeemedAt?: Date
  redeemedBy?: number
  deletedAt?: boolean
}
