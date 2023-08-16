/* eslint-disable type-graphql/invalid-nullable-input-type */
import { ArgsType, Field, Int } from 'type-graphql'

import { Order } from '@enum/Order'

@ArgsType()
export class Paginated {
  @Field(() => Int, { defaultValue: 1 })
  currentPage: number

  @Field(() => Int, { defaultValue: 3 })
  pageSize: number

  @Field(() => Order, { defaultValue: Order.DESC })
  order: Order
}
