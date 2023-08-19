/* eslint-disable type-graphql/invalid-nullable-input-type */
import { IsPositive, IsEnum } from 'class-validator'
import { ArgsType, Field, Int } from 'type-graphql'

import { Order } from '@enum/Order'

@ArgsType()
export class Paginated {
  @Field(() => Int, { defaultValue: 1 })
  @IsPositive()
  currentPage?: number

  @Field(() => Int, { defaultValue: 3 })
  @IsPositive()
  pageSize?: number

  @Field(() => Order, { defaultValue: Order.DESC })
  @IsEnum(Order)
  order?: Order
}
