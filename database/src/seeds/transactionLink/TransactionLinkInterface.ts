export interface TransactionLinkInterface {
  email: string
  amount: number
  memo: string
  createdAt?: Date
  // TODO: for testing
  // redeemedAt?: Date
  // redeemedBy?: number
  deletedAt?: boolean
}
