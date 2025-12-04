import { PendingTransactionState } from 'shared'
import { registerEnumType } from 'type-graphql'

registerEnumType(PendingTransactionState, {
  name: 'PendingTransactionState', // this one is mandatory
  description: 'State of the PendingTransaction', // this one is optional
})
