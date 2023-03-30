import { ObjectType, Field, Int } from 'type-graphql'
import { Decimal } from 'decimal.js-light'

@ObjectType()
export class DynamicStatisticsFields {
  @Field(() => Int)
  activeUsers: number

  @Field(() => Decimal)
  totalGradidoAvailable: Decimal

  @Field(() => Decimal)
  totalGradidoUnbookedDecayed: Decimal
}

@ObjectType()
export class CommunityStatistics {
  @Field(() => Int)
  allUsers: number

  @Field(() => Int)
  totalUsers: number

  @Field(() => Int)
  deletedUsers: number

  @Field(() => Decimal)
  totalGradidoCreated: Decimal

  @Field(() => Decimal)
  totalGradidoDecayed: Decimal

  // be carefull querying this, takes longer than 2 secs.
  @Field(() => DynamicStatisticsFields)
  dynamicStatisticsFields: DynamicStatisticsFields
}
