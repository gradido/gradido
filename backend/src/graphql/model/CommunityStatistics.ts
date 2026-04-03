import { GradidoUnit } from 'shared-native'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class DynamicStatisticsFields {
  @Field(() => Int)
  activeUsers: number

  @Field(() => GradidoUnit)
  totalGradidoAvailable: GradidoUnit

  @Field(() => GradidoUnit)
  totalGradidoUnbookedDecayed: GradidoUnit
}

@ObjectType()
export class CommunityStatistics {
  @Field(() => Int)
  allUsers: number

  @Field(() => Int)
  totalUsers: number

  @Field(() => Int)
  deletedUsers: number

  @Field(() => GradidoUnit)
  totalGradidoCreated: GradidoUnit

  @Field(() => GradidoUnit)
  totalGradidoDecayed: GradidoUnit

  // be carefull querying this, takes longer than 2 secs.
  @Field(() => DynamicStatisticsFields)
  dynamicStatisticsFields: DynamicStatisticsFields
}
