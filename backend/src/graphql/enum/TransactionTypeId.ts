import { registerEnumType } from 'type-graphql'

export enum TransactionTypeId {
  CREATION = 1,
  SEND = 2,
  RECEIVE = 3,
  // This is a virtual property, never occurring on the database
  DECAY = 4,
  TRANSACTION_LINK = 5,
}

registerEnumType(TransactionTypeId, {
  name: 'TransactionTypeId', // this one is mandatory
  description: 'Type of the transaction', // this one is optional
})
