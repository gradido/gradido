import { registerEnumType } from 'type-graphql'

export enum InputTransactionType {
  CREATION = 1,
  SEND = 2,
  RECEIVE = 3,
}

registerEnumType(InputTransactionType, {
  name: 'InputTransactionType', // this one is mandatory
  description: 'Type of the transaction', // this one is optional
})
