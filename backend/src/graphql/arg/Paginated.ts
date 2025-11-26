import { Order } from '@enum/Order'
import { IsEnum, IsPositive } from 'class-validator'
import { ArgsType, Field, InputType, Int } from 'type-graphql'

@ArgsType()
@InputType()
export class Paginated {
  @Field(() => Int)
  @IsPositive()
  currentPage: number

  @Field(() => Int)
  @IsPositive()
  pageSize: number

  @Field(() => Order)
  @IsEnum(Order)
  order: Order

  public constructor(pageSize?: number, currentPage?: number, order?: Order) {
    this.pageSize = pageSize ?? 3
    this.currentPage = currentPage ?? 1
    this.order = order ?? Order.DESC
  }
}
