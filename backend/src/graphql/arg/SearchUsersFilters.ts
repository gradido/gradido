import { Field, InputType, ObjectType } from 'type-graphql'

@ObjectType()
@InputType('SearchUsersFiltersInput')
export default class SearchUsersFilters {
  @Field(() => Boolean, { nullable: true, defaultValue: null })
  filterByActivated?: boolean | null

  @Field(() => Boolean, { nullable: true, defaultValue: null })
  filterByDeleted?: boolean | null
}
