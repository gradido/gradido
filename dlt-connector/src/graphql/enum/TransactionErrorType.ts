import { registerEnumType } from 'type-graphql'

export enum TransactionErrorType {
  NOT_IMPLEMENTED_YET = 'Not Implemented yet',
  MISSING_PARAMETER = 'Missing parameter',
  ALREADY_EXIST = 'Already exist',
  DB_ERROR = 'DB Error',
}

registerEnumType(TransactionErrorType, {
  name: 'TransactionErrorType',
  description: 'Transaction Error Type',
})
