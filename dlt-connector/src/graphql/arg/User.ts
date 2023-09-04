// https://www.npmjs.com/package/@apollo/protobufjs

import { IsPositive, IsUUID } from 'class-validator'
import { Field, Int, ArgsType } from 'type-graphql'

@ArgsType()
export class User {
  @Field(() => String)
  @IsUUID('4')
  uuid: string

  @Field(() => String)
  @IsUUID('4')
  communityUuid: string

  @Field(() => Int, { defaultValue: 1 })
  @IsPositive()
  accountNr: number
}
