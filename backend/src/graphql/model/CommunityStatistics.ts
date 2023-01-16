import { ObjectType, Field } from 'type-graphql'
import Decimal from 'decimal.js-light'

@ObjectType()
export class TotalAvailable {
  @Field(() => Number)
  activeUsers: number

  @Field(() => Decimal)
  totalGradidoAvailable: Decimal

  @Field(() => Decimal)
  totalGradidoUnbookedDecayed: Decimal
}

@ObjectType()
export class CommunityStatistics {
  @Field(() => Number)
  allUsers: number

  @Field(() => Number)
  totalUsers: number

  @Field(() => Number)
  deletedUsers: number

  @Field(() => Decimal)
  totalGradidoCreated: Decimal

  @Field(() => Decimal)
  totalGradidoDecayed: Decimal

  @Field(() => TotalAvailable)
  totalAvailable: TotalAvailable
}
