import { registerEnumType } from 'type-graphql'

// enum for graphql but with int because it is the same in backend
// for transaction type from backend
export enum InputTransactionType {
  CREATION = 1,
  SEND = 2,
  RECEIVE = 3,
}

registerEnumType(InputTransactionType, {
  name: 'InputTransactionType', // this one is mandatory
  description: 'Type of the transaction', // this one is optional
})
