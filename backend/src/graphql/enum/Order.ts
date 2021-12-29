import { registerEnumType } from 'type-graphql'

export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

registerEnumType(Order, {
  name: 'Order', // this one is mandatory
  description: 'Order direction - ascending or descending', // this one is optional
})
