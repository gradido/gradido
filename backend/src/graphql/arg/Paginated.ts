/* eslint-disable type-graphql/invalid-nullable-input-type */
import { IsPositive, IsEnum } from 'class-validator'
import { ArgsType, Field, Int } from 'type-graphql'

import { Order } from '@enum/Order'

@ArgsType()
export class Paginated {
  @Field(() => Int, { nullable: true })
  @IsPositive()
  currentPage?: number

  @Field(() => Int, { nullable: true })
  @IsPositive()
  pageSize?: number

  @Field(() => Order, { nullable: true })
  @IsEnum(Order)
  order?: Order
}
