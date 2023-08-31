import { registerEnumType } from 'type-graphql'

export enum PendingTransactionState {
  NEW = 1,
  WAIT_ON_PENDING = 2,
  PENDING = 3,
  WAIT_ON_CONFIRM = 4,
  CONFIRMED = 5,
}

registerEnumType(PendingTransactionState, {
  name: 'PendingTransactionState', // this one is mandatory
  description: 'State of the PendingTransaction', // this one is optional
})
