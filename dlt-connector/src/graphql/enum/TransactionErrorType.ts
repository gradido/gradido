import { registerEnumType } from 'type-graphql'

export enum TransactionErrorType {
  NOT_IMPLEMENTED_YET = 'Not Implemented yet',
  MISSING_PARAMETER = 'Missing parameter',
  ALREADY_EXIST = 'Already exist',
}

registerEnumType(TransactionErrorType, {
  name: 'TransactionErrorType',
  description: 'Transaction Error Type',
})
