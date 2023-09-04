import { registerEnumType } from 'type-graphql'

export enum TransactionErrorType {
  NOT_IMPLEMENTED_YET = 'Not Implemented yet',
}

registerEnumType(TransactionErrorType, {
  name: 'TransactionErrorType',
  description: 'Transaction Error Type',
})
