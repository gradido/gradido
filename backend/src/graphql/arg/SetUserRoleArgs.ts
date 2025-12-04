import { RoleNames } from '@enum/RoleNames'
import { IsEnum, IsPositive } from 'class-validator'
import { ArgsType, Field, InputType, Int } from 'type-graphql'

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
