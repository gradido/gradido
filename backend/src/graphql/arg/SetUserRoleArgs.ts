import { ArgsType, Field, Int, InputType } from 'type-graphql'

import { RoleNames } from '@enum/RoleNames'

@InputType()
@ArgsType()
export class SetUserRoleArgs {
  @Field(() => Int)
  userId: number

  @Field(() => RoleNames, { nullable: true })
  role: RoleNames | null | undefined
}
