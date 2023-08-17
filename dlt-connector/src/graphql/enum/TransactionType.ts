import { registerEnumType } from 'type-graphql'

export enum TransactionType {
  CREATION = 1,
  SEND = 2,
  RECEIVE = 3,
}

registerEnumType(TransactionType, {
  name: 'TransactionType', // this one is mandatory
  description: 'Type of the transaction', // this one is optional
})
