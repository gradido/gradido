import { IsBoolean } from 'class-validator'
import { Field, InputType } from 'type-graphql'

@InputType()
export class SearchUsersFilters {
  @Field(() => Boolean, { nullable: true, defaultValue: null })
  @IsBoolean()
  byActivated?: boolean | null

  @Field(() => Boolean, { nullable: true, defaultValue: null })
  @IsBoolean()
  byDeleted?: boolean | null
}
