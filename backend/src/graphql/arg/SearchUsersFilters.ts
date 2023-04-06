import { Field, InputType } from 'type-graphql'

@InputType()
export class SearchUsersFilters {
  @Field(() => Boolean, { nullable: true, defaultValue: null })
  byActivated?: boolean | null

  @Field(() => Boolean, { nullable: true, defaultValue: null })
  byDeleted?: boolean | null
}
