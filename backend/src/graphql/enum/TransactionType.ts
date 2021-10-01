import { registerEnumType } from 'type-graphql'

export enum TransactionType {
  CREATION = 'creation',
  SEND = 'send',
  RECIEVE = 'receive',
}

registerEnumType(TransactionType, {
  name: 'TransactionType', // this one is mandatory
  description: 'Name of the Type of the transaction', // this one is optional
})
