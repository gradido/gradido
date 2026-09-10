import { Order } from 'shared'
import { registerEnumType } from 'type-graphql'

export { Order }

registerEnumType(Order, {
  name: 'Order', // this one is mandatory
  description: 'Order direction - ascending or descending', // this one is optional
})
