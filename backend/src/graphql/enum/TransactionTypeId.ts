import { registerEnumType } from 'type-graphql'

export enum TransactionTypeId {
  CREATION = 1,
  SEND = 2,
}

registerEnumType(TransactionTypeId, {
  name: 'TransactionTypeId', // this one is mandatory
  description: 'Type of the transaction', // this one is optional
})
