import { registerEnumType } from 'type-graphql'
import { TransactionTypeId } from 'database'
export { TransactionTypeId }

registerEnumType(TransactionTypeId, {
  name: 'TransactionTypeId', // this one is mandatory
  description: 'Type of the transaction', // this one is optional
})
