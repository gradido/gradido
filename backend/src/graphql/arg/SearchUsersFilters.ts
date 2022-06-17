import { Field, InputType } from 'type-graphql'

@InputType()
export default class SearchUsersFilters {
  @Field(() => Boolean, { nullable: true, defaultValue: null })
  byActivated: boolean

  @Field(() => Boolean, { nullable: true, defaultValue: null })
  byDeleted: boolean
}
