import { registerEnumType } from 'type-graphql'
import { PendingTransactionState } from 'shared'

registerEnumType(PendingTransactionState, {
  name: 'PendingTransactionState', // this one is mandatory
  description: 'State of the PendingTransaction', // this one is optional
})
