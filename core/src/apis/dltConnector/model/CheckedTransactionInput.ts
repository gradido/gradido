import { TransactionParty } from './'

export class CheckedTransactionInput {
  valid: boolean
  error?: string
  amount?: string
  createdAt?: string
  confirmedAt?: string
  hieroTransactionId?: string
  recipient?: TransactionParty
  sender?: TransactionParty
  transactionType?: string
}
