// https://www.npmjs.com/package/@apollo/protobufjs

import { IsPositive, IsUUID } from 'class-validator'
import { Field, Int, InputType } from 'type-graphql'

@InputType()
export class CommunityUser {
  @Field(() => String)
  @IsUUID('4')
  uuid: string

  @Field(() => Int, { defaultValue: 1, nullable: true })
  @IsPositive()
  accountNr?: number
}
