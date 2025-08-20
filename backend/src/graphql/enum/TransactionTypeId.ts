import { registerEnumType } from 'type-graphql'
import { TransactionTypeId } from 'shared'

registerEnumType(TransactionTypeId, {
  name: 'TransactionTypeId', // this one is mandatory
  description: 'Type of the transaction', // this one is optional
})
