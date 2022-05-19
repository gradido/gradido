import { Field, InputType, ObjectType } from 'type-graphql'

@ObjectType()
@InputType('SearchUsersFiltersInput')
export default class SearchUsersFilters {
  @Field(() => Boolean, { nullable: true, defaultValue: null })
  byActivated?: boolean | null

  @Field(() => Boolean, { nullable: true, defaultValue: null })
  byDeleted?: boolean | null
}
