// https://www.npmjs.com/package/@apollo/protobufjs

import { IsPositive, IsUUID } from 'class-validator'
import { Field, Int, InputType } from 'type-graphql'

@InputType()
export class UserIdentifier {
  @Field(() => String)
  @IsUUID('4')
  uuid: string

  @Field(() => String)
  @IsUUID('4')
  communityUuid: string

  @Field(() => Int, { defaultValue: 1, nullable: true })
  @IsPositive()
  accountNr?: number
}
