import { TransactionTypeId } from 'database'
import { registerEnumType } from 'type-graphql'
export { TransactionTypeId }

registerEnumType(TransactionTypeId, {
  name: 'TransactionTypeId', // this one is mandatory
  description: 'Type of the transaction', // this one is optional
})
