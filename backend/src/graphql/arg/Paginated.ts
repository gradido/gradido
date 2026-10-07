import { Order } from '@enum/Order'
import { IsEnum, IsPositive } from 'class-validator'
import { ArgsType, Field, InputType, Int } from 'type-graphql'

@ArgsType()
@InputType()
export class Paginated {
  // `nullable` beside a default: type-graphql 2 would otherwise declare the field non-null
  // (`Int! = 1`), and a client that sends null for it would be refused where it was not.
  @Field(() => Int, { nullable: true })
  @IsPositive()
  currentPage: number

  @Field(() => Int, { nullable: true })
  @IsPositive()
  pageSize: number

  @Field(() => Order, { nullable: true })
  @IsEnum(Order)
  order: Order

  public constructor(pageSize?: number, currentPage?: number, order?: Order) {
    this.pageSize = pageSize ?? 3
    this.currentPage = currentPage ?? 1
    this.order = order ?? Order.DESC
  }
}
