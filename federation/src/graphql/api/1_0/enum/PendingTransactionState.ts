import { registerEnumType } from 'type-graphql'

export enum PendingTransactionState {
  NEW = 1,
  PENDING = 2,
  SETTLED = 3,
  REVERTED = 4,
}

registerEnumType(PendingTransactionState, {
  name: 'PendingTransactionState', // this one is mandatory
  description: 'State of the PendingTransaction', // this one is optional
})
