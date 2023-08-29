import { IsPositive, IsEnum } from 'class-validator'
import { ArgsType, Field, Int, InputType } from 'type-graphql'

import { RoleNames } from '@enum/RoleNames'

@InputType()
@ArgsType()
export class SetUserRoleArgs {
  @Field(() => Int)
  @IsPositive()
  userId: number

  @Field(() => RoleNames, { nullable: true })
  @IsEnum(RoleNames)
  role: RoleNames | null | undefined
}
