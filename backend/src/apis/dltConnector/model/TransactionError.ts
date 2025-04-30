import type { TransactionErrorType } from '@dltConnector/enum/TransactionErrorType'

export interface TransactionError {
  type: TransactionErrorType
  message: string
  name: string
}
