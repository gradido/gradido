export interface TransactionInterface {
  email: string
  amount: number
  memo: string
  createdAt?: Date
  deletedAt?: boolean
}
