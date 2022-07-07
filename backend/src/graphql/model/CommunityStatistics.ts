import { ObjectType, Field } from 'type-graphql'
import Decimal from 'decimal.js-light'

@ObjectType()
export class CommunityStatistics {
  @Field(() => Number)
  totalUsers: number

  @Field(() => Number)
  activeUsers: number

  @Field(() => Number)
  deletedUsers: number

  @Field(() => Decimal)
  totalGradidoCreated: Decimal

  @Field(() => Decimal)
  totalGradidoDecayed: Decimal

  @Field(() => Decimal)
  totalGradidoAvailable: Decimal

  @Field(() => Decimal)
  totalGradidoUnbookedDecayed: Decimal
}
