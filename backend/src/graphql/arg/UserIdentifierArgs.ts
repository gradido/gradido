// https://www.npmjs.com/package/@apollo/protobufjs

import { IsString, IsUUID } from 'class-validator'
import { Field, ArgsType } from 'type-graphql'

@ArgsType()
export class UserIdentifierArgs {
  @Field(() => String)
  // TODO: custom validator
  @IsString()
  identifier: string

  @Field(() => String, { nullable: true })
  @IsUUID('4')
  communityUuid?: string | null
}
